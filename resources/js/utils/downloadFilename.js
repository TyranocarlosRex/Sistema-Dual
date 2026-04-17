const getHeaderValue = (headers, key) => {
  if (!headers || typeof headers !== "object") {
    return "";
  }

  const value =
    headers[key] ??
    headers[key.toLowerCase()] ??
    headers[key.toUpperCase()] ??
    "";

  return Array.isArray(value) ? value[0] || "" : value || "";
};

const sanitizeFilename = (value, fallback) => {
  const clean = String(value || "")
    .replace(/^["']|["']$/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();

  return clean || fallback;
};

const decodeMimeWord = (value) => {
  const trimmed = String(value || "").trim().replace(/^["']|["']$/g, "");
  const match = trimmed.match(/^=\?([^?]+)\?([bqBQ])\?([^?]+)\?=$/);
  if (!match) {
    return trimmed;
  }

  const [, charsetRaw, encodingRaw, payload] = match;
  const charset = charsetRaw.toLowerCase() || "utf-8";
  const encoding = encodingRaw.toUpperCase();

  try {
    if (encoding === "B") {
      const binary = atob(payload);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return new TextDecoder(charset).decode(bytes);
    }

    const quotedPrintable = payload
      .replace(/_/g, " ")
      .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    return quotedPrintable;
  } catch {
    return trimmed;
  }
};

const decodeRfc5987Value = (value) => {
  const cleaned = String(value || "").trim().replace(/^["']|["']$/g, "");
  const parts = cleaned.split("''");
  const encoded = parts.length > 1 ? parts.slice(1).join("''") : cleaned;

  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

export const parseDownloadFilename = (headers, fallback = "archivo") => {
  const safeFallback = sanitizeFilename(fallback, "archivo");

  const customName =
    getHeaderValue(headers, "x-download-filename") ||
    getHeaderValue(headers, "x-file-name");
  if (customName) {
    try {
      return sanitizeFilename(decodeURIComponent(customName), safeFallback);
    } catch {
      return sanitizeFilename(customName, safeFallback);
    }
  }

  const disposition = getHeaderValue(headers, "content-disposition");
  if (!disposition) {
    return safeFallback;
  }

  const utfMatch = disposition.match(/filename\*\s*=\s*([^;]+)/i);
  if (utfMatch) {
    const decoded = decodeRfc5987Value(utfMatch[1]);
    if (decoded) {
      return sanitizeFilename(decoded, safeFallback);
    }
  }

  const basicMatch = disposition.match(/filename\s*=\s*([^;]+)/i);
  if (basicMatch) {
    const decoded = decodeMimeWord(basicMatch[1]);
    if (decoded) {
      return sanitizeFilename(decoded, safeFallback);
    }
  }

  return safeFallback;
};
