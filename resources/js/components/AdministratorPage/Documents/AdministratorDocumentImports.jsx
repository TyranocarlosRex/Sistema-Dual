import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useToast } from "../../Shared/ToastProvider";
import { getApiErrorMessage } from "../../../utils/errorMessages";

const escapePreviewHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const PLACEHOLDER_MENU_WIDTH = 360;
const PLACEHOLDER_QUERY_PATTERN = /^[a-z0-9_.-]*$/i;
const PLACEHOLDER_OPTIONS = [
  {
    token: "alumno_nombre",
    label: "Nombre",
    description: "Nombre del alumno",
    category: "Alumno",
  },
  {
    token: "alumno_apellidos",
    label: "Apellidos",
    description: "Apellidos del alumno",
    category: "Alumno",
  },
  {
    token: "alumno_nombre_completo",
    label: "Nombre completo",
    description: "Nombre y apellidos en una sola variable",
    category: "Alumno",
  },
  {
    token: "alumno_no_control",
    label: "No. control",
    description: "Numero de control del alumno",
    category: "Alumno",
  },
  {
    token: "alumno_carrera",
    label: "Carrera",
    description: "Carrera asignada al alumno",
    category: "Alumno",
  },
  {
    token: "alumno_semestre",
    label: "Semestre",
    description: "Semestre actual",
    category: "Alumno",
  },
  {
    token: "alumno_correo_institucional",
    label: "Correo institucional",
    description: "Correo del alumno",
    category: "Alumno",
  },
  {
    token: "alumno_telefono",
    label: "Telefono",
    description: "Telefono registrado del alumno",
    category: "Alumno",
  },
  {
    token: "alumno_direccion",
    label: "Direccion",
    description: "Direccion registrada del alumno",
    category: "Alumno",
  },
  {
    token: "periodo_codigo",
    label: "Codigo de periodo",
    description: "Codigo del periodo activo o seleccionado",
    category: "Periodo",
  },
  {
    token: "periodo_fecha_inicio",
    label: "Fecha de inicio",
    description: "Fecha de inicio del periodo",
    category: "Periodo",
  },
  {
    token: "periodo_fecha_fin",
    label: "Fecha de fin",
    description: "Fecha de cierre o fin del periodo",
    category: "Periodo",
  },
  {
    token: "asignacion_estatus",
    label: "Estatus",
    description: "Estatus del alumno en el periodo",
    category: "Seguimiento",
  },
  {
    token: "asignacion_empresa",
    label: "Empresa",
    description: "Empresa vinculada al alumno",
    category: "Seguimiento",
  },
  {
    token: "asignacion_numero_convenio",
    label: "Numero de convenio",
    description: "Convenio asociado al alumno",
    category: "Seguimiento",
  },
  {
    token: "asignacion_motivo_baja",
    label: "Motivo de baja",
    description: "Motivo registrado cuando aplica",
    category: "Seguimiento",
  },
  {
    token: "asignacion_fecha_alta",
    label: "Fecha de alta",
    description: "Fecha de alta en el periodo",
    category: "Seguimiento",
  },
  {
    token: "asignacion_fecha_baja",
    label: "Fecha de baja",
    description: "Fecha de baja del alumno",
    category: "Seguimiento",
  },
  {
    token: "fecha_actual",
    label: "Fecha actual",
    description: "Fecha del dia de la generacion",
    category: "Sistema",
  },
];

const QUICK_PLACEHOLDER_TOKENS = [
  "alumno_nombre_completo",
  "alumno_no_control",
  "alumno_carrera",
  "periodo_codigo",
  "asignacion_empresa",
];

const PREVIEW_STYLES = `
.document-import-preview {
  color: #0f172a;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.document-import-preview .imported-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.92rem;
  line-height: 1.5;
}

.document-import-preview .docx-section--header {
  margin-bottom: 1.5rem;
}

.document-import-preview .docx-section--footer {
  margin-top: 1.75rem;
}

.document-import-preview .docx-paragraph {
  margin: 0 0 0.9rem;
  white-space: pre-wrap;
  line-height: 1.45;
}

.document-import-preview .docx-paragraph.is-right {
  text-align: right;
}

.document-import-preview .docx-paragraph.is-center {
  text-align: center;
}

.document-import-preview .docx-paragraph.is-justify {
  text-align: justify;
}

.document-import-preview .docx-textbox {
  margin-bottom: 0.75rem;
}

.document-import-preview .docx-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0 1.25rem;
}

.document-import-preview .docx-table td {
  border: 1px solid #cbd5e1;
  padding: 0.65rem 0.8rem;
  vertical-align: top;
}

.document-import-preview .docx-rule {
  display: block;
  width: 100%;
  height: 0;
  margin: 0.6rem 0 0.95rem;
  border-top: 1.5px solid #64748b;
}

.document-import-preview .docx-media--banner {
  display: block;
  margin-bottom: 0.75rem;
}

.document-import-preview .docx-image--banner {
  display: block;
  width: 100%;
  height: auto;
}

.document-import-preview .docx-media--inline {
  display: inline-flex;
  align-items: flex-end;
  gap: 1rem;
  margin: 0.35rem 0;
}

.document-import-preview .docx-image--inline {
  max-height: 8rem;
  width: auto;
}

.document-import-preview .document-import-editor {
  border: 1px dashed #cbd5e1;
  border-radius: 1rem;
  padding: 1rem;
  background: linear-gradient(180deg, #fffef9 0%, #ffffff 100%);
}

.document-import-preview .document-import-editor__body {
  min-height: 260px;
  outline: none;
}

.document-import-preview .document-import-editor__body:focus {
  box-shadow: inset 0 0 0 2px #bfdbfe;
  border-radius: 0.75rem;
}

.document-import-preview .document-import-editor__body [contenteditable="false"] {
  user-select: none;
  pointer-events: none;
}

.document-import-preview .document-import-editor__helper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  color: #475569;
}

.document-import-preview .document-import-editor__helper code {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
}

.document-import-preview .document-import-placeholder-chip {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
}

.document-import-preview .document-import-placeholder-chip:hover {
  background: #dbeafe;
}

.document-import-placeholder-menu {
  position: fixed;
  z-index: 1400;
  width: min(${PLACEHOLDER_MENU_WIDTH}px, calc(100vw - 1.5rem));
  max-height: min(360px, calc(100vh - 2rem));
  overflow: auto;
  border: 1px solid #cbd5e1;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(10px);
}

.document-import-placeholder-menu__header {
  padding: 0.8rem 0.95rem 0.55rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.document-import-placeholder-menu__title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
}

.document-import-placeholder-menu__subtitle {
  font-size: 0.75rem;
  color: #64748b;
}

.document-import-placeholder-menu__list {
  padding: 0.35rem;
}

.document-import-placeholder-menu__item {
  width: 100%;
  border: 0;
  border-radius: 0.9rem;
  background: transparent;
  text-align: left;
  padding: 0.7rem 0.8rem;
}

.document-import-placeholder-menu__item.is-active,
.document-import-placeholder-menu__item:hover {
  background: #eff6ff;
}

.document-import-placeholder-menu__token {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.15rem 0.5rem;
  font-size: 0.78rem;
  font-family: Consolas, "Courier New", monospace;
}

.document-import-placeholder-menu__meta {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
}

.document-import-placeholder-menu__description {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.82rem;
  color: #64748b;
}

.document-import-placeholder-menu__empty {
  padding: 1rem;
  color: #64748b;
  font-size: 0.86rem;
}
`;

const findTextNode = (node, mode = "forward") => {
  if (!node) {
    return null;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);

  if (mode === "backward") {
    let current = walker.nextNode();
    let last = null;

    while (current) {
      last = current;
      current = walker.nextNode();
    }

    return last;
  }

  return walker.nextNode();
};

const resolveCaretTextContext = (root, selection) => {
  if (!root || !selection || !selection.rangeCount || !selection.isCollapsed) {
    return null;
  }

  const anchorNode = selection.anchorNode;

  if (!anchorNode || !root.contains(anchorNode)) {
    return null;
  }

  if (anchorNode.nodeType === Node.TEXT_NODE) {
    return {
      textNode: anchorNode,
      offset: Math.min(selection.anchorOffset, anchorNode.textContent?.length ?? 0),
    };
  }

  if (anchorNode.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const beforeChild = anchorNode.childNodes?.[selection.anchorOffset - 1] || null;
  const beforeText = findTextNode(beforeChild, "backward");
  if (beforeText) {
    return {
      textNode: beforeText,
      offset: beforeText.textContent?.length ?? 0,
    };
  }

  const currentChild = anchorNode.childNodes?.[selection.anchorOffset] || null;
  const currentText = findTextNode(currentChild, "forward");
  if (currentText) {
    return {
      textNode: currentText,
      offset: 0,
    };
  }

  return null;
};

const clampMenuLeft = (left) => {
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : PLACEHOLDER_MENU_WIDTH;
  return Math.max(12, Math.min(left, viewportWidth - PLACEHOLDER_MENU_WIDTH - 12));
};

const DEFAULT_BODY_HTML = '<div class="docx-paragraph is-left"><div class="docx-paragraph__text"><br></div></div>';

const filenameToTitle = (filename = "") => String(filename).replace(/\.[^.]+$/, "").trim();

const buildBlankDocumentResult = () => ({
  filename: null,
  extension: null,
  text: "",
  header_html: "",
  body_html: DEFAULT_BODY_HTML,
  footer_html: "",
  characters: 0,
  lines: 0,
});

const countLines = (value = "") => {
  const normalized = String(value).replace(/\r/g, "").trim();
  return normalized ? normalized.split("\n").length : 0;
};

const buildMetrics = (value = "") => {
  const normalized = String(value).replace(/\r/g, "").trim();

  return {
    characters: normalized.length,
    lines: countLines(normalized),
  };
};

const formatDateTime = (value) => {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const sortDocuments = (items = []) =>
  [...items].sort((a, b) => {
    const first = new Date(b.updated_at || b.created_at || 0).getTime();
    const second = new Date(a.updated_at || a.created_at || 0).getTime();

    if (first !== second) {
      return first - second;
    }

    return (b.id || 0) - (a.id || 0);
  });

const upsertDocument = (items, nextDocument) => sortDocuments([nextDocument, ...(items || []).filter((item) => item.id !== nextDocument.id)]);

const formatPeriodLabel = (period) => {
  if (!period) {
    return "Sin periodo";
  }

  const code = period.codigo || `Periodo ${period.id}`;
  const status = period.estatus ? String(period.estatus).replace(/^\w/, (value) => value.toUpperCase()) : "";

  return status ? `${code} - ${status}` : code;
};

const buildGeneratedDocumentHtml = (generatedDocument) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapePreviewHtml(generatedDocument?.student?.nombre_completo || "Documento generado")}</title>
    <style>${PREVIEW_STYLES}</style>
  </head>
  <body style="margin:0;background:#f8fafc;">
    <div class="document-import-preview" style="padding:24px;max-width:960px;margin:0 auto;">
      ${generatedDocument?.header_html ? `<div class="docx-section docx-section--header">${generatedDocument.header_html}</div>` : ""}
      <div>${generatedDocument?.body_html || ""}</div>
      ${generatedDocument?.footer_html ? `<div class="docx-section docx-section--footer">${generatedDocument.footer_html}</div>` : ""}
    </div>
  </body>
</html>`;

const triggerBlobDownload = (filename, blob) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const printHtmlDocument = (html) => new Promise((resolve, reject) => {
  const iframe = document.createElement("iframe");
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) {
      return;
    }

    cleaned = true;
    window.URL.revokeObjectURL(url);

    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  iframe.onload = () => {
    const targetWindow = iframe.contentWindow;

    if (!targetWindow) {
      cleanup();
      reject(new Error("No se pudo abrir la vista de impresion."));
      return;
    }

    const finish = () => {
      window.setTimeout(() => {
        cleanup();
        resolve();
      }, 500);
    };

    targetWindow.onafterprint = finish;
    targetWindow.focus();
    window.setTimeout(() => {
      try {
        targetWindow.print();
        window.setTimeout(finish, 1500);
      } catch (error) {
        cleanup();
        reject(error);
      }
    }, 150);
  };

  iframe.onerror = () => {
    cleanup();
    reject(new Error("No se pudo cargar la vista de impresion."));
  };

  document.body.appendChild(iframe);
  iframe.src = url;
});

const extractDownloadFilename = (headers, fallback) => {
  const disposition = headers?.["content-disposition"] || "";
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const simpleMatch = disposition.match(/filename="?([^\";]+)"?/i);

  return simpleMatch?.[1] || fallback;
};

const readBlobMessage = async (blob, fallback) => {
  if (!(blob instanceof Blob)) {
    return fallback;
  }

  try {
    const rawText = await blob.text();

    if (!rawText) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(rawText);
      const validationMessage = Object.values(parsed?.errors || {})?.flat?.()?.[0];
      return validationMessage || parsed?.message || fallback;
    } catch {
      const titleMatch = rawText.match(/<title>(.*?)<\/title>/i);
      return titleMatch?.[1] || rawText.slice(0, 180) || fallback;
    }
  } catch {
    return fallback;
  }
};

const readApiErrorMessage = (error, fallback) => {
  return getApiErrorMessage(error, fallback);
};

export default function AdministratorDocumentImports() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const { showToast } = useToast();
  const previewRef = useRef(null);
  const bodyEditorRef = useRef(null);
  const placeholderMenuRef = useRef(null);
  const placeholderTriggerRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const [periods, setPeriods] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [bodySeedHtml, setBodySeedHtml] = useState("");
  const [editorVersion, setEditorVersion] = useState(0);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatorDocument, setGeneratorDocument] = useState(null);
  const [generatorScope, setGeneratorScope] = useState("student");
  const [generatorPeriodId, setGeneratorPeriodId] = useState("");
  const [generatorCareer, setGeneratorCareer] = useState("");
  const [generatorSearch, setGeneratorSearch] = useState("");
  const [generatorStudentId, setGeneratorStudentId] = useState("");
  const [generatorStudents, setGeneratorStudents] = useState([]);
  const [generatorStudentsTotal, setGeneratorStudentsTotal] = useState(0);
  const [generatorCareers, setGeneratorCareers] = useState([]);
  const [generatorOptionsLoading, setGeneratorOptionsLoading] = useState(false);
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [generatorError, setGeneratorError] = useState("");
  const [generationResult, setGenerationResult] = useState(null);
  const [previewModalDocument, setPreviewModalDocument] = useState(null);
  const [baseline, setBaseline] = useState({ title: "", description: "" });
  const [metrics, setMetrics] = useState({ characters: 0, lines: 0 });
  const [placeholderMenu, setPlaceholderMenu] = useState({
    open: false,
    query: "",
    top: 0,
    left: 0,
    activeIndex: 0,
  });

  const plainPreviewHtml = `<pre class="imported-pre">${escapePreviewHtml(result?.text || "")}</pre>`;
  const originalBodyHtml = result?.body_html || plainPreviewHtml || DEFAULT_BODY_HTML;
  const headerHtml = result?.header_html || "";
  const footerHtml = result?.footer_html || "";
  const hasPendingFileImport = Boolean(file && result?.filename !== file.name);
  const metaDirty = title.trim() !== baseline.title || description.trim() !== baseline.description;
  const hasUnsavedChanges = Boolean(result) && (bodyDirty || metaDirty);
  const quickPlaceholders = useMemo(
    () => PLACEHOLDER_OPTIONS.filter((option) => QUICK_PLACEHOLDER_TOKENS.includes(option.token)),
    []
  );
  const filteredPlaceholders = useMemo(() => {
    const query = placeholderMenu.query.trim().toLowerCase();

    if (!query) {
      return PLACEHOLDER_OPTIONS;
    }

    return PLACEHOLDER_OPTIONS.filter((option) =>
      [option.token, option.label, option.description, option.category].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [placeholderMenu.query]);

  const syncPreviewMetrics = () => {
    const text = previewRef.current?.innerText || result?.text || "";
    setMetrics(buildMetrics(text));
  };

  const askToDiscardChanges = (message) => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm(message);
  };

  const resetComposer = ({ blank = false } = {}) => {
    setSelectedDocumentId(null);
    setTitle("");
    setDescription("");
    setFile(null);
    setError("");
    setBaseline({ title: "", description: "" });
    setBodyDirty(false);
    closePlaceholderMenu();

    if (blank) {
      setResult(buildBlankDocumentResult());
      return;
    }

    setResult(null);
    setBodySeedHtml("");
    setEditorVersion((value) => value + 1);
    setMetrics({ characters: 0, lines: 0 });
  };

  const handleCloseComposer = () => {
    if (!askToDiscardChanges("Hay cambios sin guardar. Cerrar el formulario descartara el borrador actual.")) {
      return;
    }

    setShowComposer(false);
    resetComposer();
  };

  const hydrateEditorFromDocument = (documentItem) => {
    setSelectedDocumentId(documentItem.id || null);
    setTitle(documentItem.titulo || "");
    setDescription(documentItem.descripcion || "");
    setBaseline({
      title: (documentItem.titulo || "").trim(),
      description: (documentItem.descripcion || "").trim(),
    });
    setFile(null);
    setError("");
    setResult({
      filename: documentItem.filename || documentItem.source_filename || null,
      extension: documentItem.extension || documentItem.source_extension || null,
      text: documentItem.text || documentItem.plain_text || "",
      header_html: documentItem.header_html || "",
      body_html: documentItem.body_html || DEFAULT_BODY_HTML,
      footer_html: documentItem.footer_html || "",
      characters: documentItem.characters || 0,
      lines: documentItem.lines || 0,
    });
  };

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    setDocumentsError("");

    try {
      const response = await axios.get("/api/documents", { headers });
      setDocuments(sortDocuments(Array.isArray(response.data) ? response.data : []));
    } catch (err) {
      console.error(err);
      setDocumentsError(readApiErrorMessage(err, "No pudimos cargar los documentos guardados. Actualiza la pagina e intenta de nuevo."));
    } finally {
      setDocumentsLoading(false);
    }
  };

  const fetchPeriods = async () => {
    setPeriodsLoading(true);

    try {
      const response = await axios.get("/api/periods", { headers });
      const nextPeriods = Array.isArray(response.data) ? response.data : [];
      const preferredPeriodId = nextPeriods.find((item) => item.estatus === "activo")?.id || nextPeriods[0]?.id || "";

      setPeriods(nextPeriods);
      setGeneratorPeriodId((prev) => prev || String(preferredPeriodId || ""));
    } catch (err) {
      console.error(err);
      showToast({
        title: "No se pudieron cargar los periodos",
        message: readApiErrorMessage(err, "La generacion quedara disponible cuando se puedan consultar los periodos."),
        variant: "error",
      });
    } finally {
      setPeriodsLoading(false);
    }
  };

  const resetGenerator = () => {
    setGeneratorDocument(null);
    setGeneratorScope("student");
    setGeneratorCareer("");
    setGeneratorSearch("");
    setGeneratorStudentId("");
    setGeneratorStudents([]);
    setGeneratorStudentsTotal(0);
    setGeneratorCareers([]);
    setGeneratorOptionsLoading(false);
    setGeneratorLoading(false);
    setGeneratorError("");
    setGenerationResult(null);
  };

  const loadGenerationOptions = async ({ periodId, search, career }) => {
    setGeneratorOptionsLoading(true);
    setGeneratorError("");

    try {
      const response = await axios.get("/api/document-generations/options", {
        headers,
        params: {
          limit: 25,
          ...(periodId ? { periodo_id: Number(periodId) } : {}),
          ...(search ? { search } : {}),
          ...(career ? { career } : {}),
        },
      });

      const data = response.data || {};
      const nextStudents = Array.isArray(data.students) ? data.students : [];
      const nextCareers = Array.isArray(data.careers) ? data.careers : [];

      setGeneratorStudents(nextStudents);
      setGeneratorStudentsTotal(Number(data.students_total || 0));
      setGeneratorCareers(nextCareers);
      setGeneratorStudentId((prev) => {
        if (prev && nextStudents.some((student) => String(student.id) === String(prev))) {
          return prev;
        }

        return nextStudents[0]?.id ? String(nextStudents[0].id) : "";
      });
      setGeneratorCareer((prev) => {
        if (!nextCareers.length) {
          return "";
        }

        if (prev && nextCareers.includes(prev)) {
          return prev;
        }

        return prev || nextCareers[0];
      });
      if (data.period?.id) {
        setGeneratorPeriodId((prev) => prev || String(data.period.id));
      }
    } catch (err) {
      console.error(err);
      setGeneratorError(readApiErrorMessage(err, "No se pudieron cargar los alumnos para generar el documento."));
    } finally {
      setGeneratorOptionsLoading(false);
    }
  };

  const handleOpenGenerator = (documentItem) => {
    setGeneratorDocument(documentItem);
    setGeneratorScope("student");
    setGeneratorCareer("");
    setGeneratorSearch("");
    setGeneratorStudentId("");
    setGeneratorStudents([]);
    setGeneratorStudentsTotal(0);
    setGeneratorCareers([]);
    setGeneratorError("");
    setGenerationResult(null);
  };

  const handleCloseGenerator = () => {
    resetGenerator();
  };

  const handleGenerateDocument = async () => {
    if (!generatorDocument) {
      return;
    }

    const payload = {
      scope: generatorScope,
      ...(generatorPeriodId ? { periodo_id: Number(generatorPeriodId) } : {}),
    };

    if (generatorScope === "student") {
      if (!generatorStudentId) {
        setGeneratorError("Selecciona un alumno para generar el documento.");
        return;
      }

      payload.student_id = Number(generatorStudentId);
    }

    if (generatorScope === "career") {
      if (!generatorCareer) {
        setGeneratorError("Selecciona una carrera para generar el documento.");
        return;
      }

      payload.career = generatorCareer;
    }

    setGeneratorLoading(true);
    setGeneratorError("");

    try {
      const response = await axios.post(`/api/documents/${generatorDocument.id}/generate`, payload, { headers });
      const data = response.data || {};
      setGenerationResult(data);
      showToast({
        title: "Documentos generados",
        message: `Se generaron ${Number(data.generated_count || 0)} documento(s).`,
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      const message = readApiErrorMessage(err, "No se pudo generar el documento con los filtros seleccionados.");
      setGeneratorError(message);
      showToast({ title: "Generacion fallida", message, variant: "error" });
    } finally {
      setGeneratorLoading(false);
    }
  };

  const handleOpenGeneratedPreview = (generatedDocument) => {
    setPreviewModalDocument(generatedDocument);
  };

  const handleCloseGeneratedPreview = () => {
    setPreviewModalDocument(null);
  };

  const handlePrintGeneratedDocument = async (generatedDocument) => {
    try {
      await printHtmlDocument(buildGeneratedDocumentHtml(generatedDocument));
    } catch (err) {
      console.error(err);
      showToast({
        title: "No se pudo abrir la impresion",
        message: "El navegador no permitio abrir la vista de impresion. Intenta con Descargar PDF.",
        variant: "error",
      });
    }
  };

  const handleDownloadGeneratedPdf = async (generatedDocument) => {
    if (!generatorDocument?.id || !generatedDocument?.student?.id) {
      return;
    }

    try {
      const response = await axios.post(
        `/api/documents/${generatorDocument.id}/download-pdf`,
        {
          student_id: Number(generatedDocument.student.id),
          ...(generatorPeriodId ? { periodo_id: Number(generatorPeriodId) } : {}),
        },
        {
          headers,
          responseType: "blob",
        }
      );

      const fallbackName = generatedDocument?.pdf_filename || generatedDocument?.filename?.replace(/\.[^.]+$/, ".pdf") || "documento-generado.pdf";
      const filename = extractDownloadFilename(response.headers, fallbackName);
      triggerBlobDownload(filename, response.data);
      showToast({
        title: "PDF descargado",
        message: `Se descargo ${filename}.`,
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      const message = err?.response?.data instanceof Blob
        ? await readBlobMessage(err.response.data, "No se pudo descargar el PDF del documento generado.")
        : readApiErrorMessage(err, "No se pudo descargar el PDF del documento generado.");
      setGeneratorError(message);
      showToast({
        title: "No se pudo descargar el PDF",
        message,
        variant: "error",
      });
    }
  };

  const closePlaceholderMenu = () => {
    placeholderTriggerRef.current = null;
    setPlaceholderMenu((prev) =>
      prev.open
        ? {
            ...prev,
            open: false,
            query: "",
            activeIndex: 0,
          }
        : prev
    );
  };

  const syncPlaceholderMenu = () => {
    const editor = bodyEditorRef.current;
    const selection = window.getSelection();
    const caret = resolveCaretTextContext(editor, selection);

    if (!editor || !selection || !caret) {
      closePlaceholderMenu();
      return;
    }

    const beforeCaret = (caret.textNode.textContent || "").slice(0, caret.offset);
    const openIndex = beforeCaret.lastIndexOf("{");
    const closeIndex = beforeCaret.lastIndexOf("}");

    if (openIndex === -1 || openIndex < closeIndex) {
      closePlaceholderMenu();
      return;
    }

    const query = beforeCaret.slice(openIndex + 1);
    if (!PLACEHOLDER_QUERY_PATTERN.test(query)) {
      closePlaceholderMenu();
      return;
    }

    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);

    const rect = range.getClientRects()[0] || range.getBoundingClientRect();
    placeholderTriggerRef.current = {
      textNode: caret.textNode,
      startOffset: openIndex,
      endOffset: caret.offset,
    };

    setPlaceholderMenu((prev) => ({
      open: true,
      query,
      top: (rect.bottom || 0) + 10,
      left: clampMenuLeft((rect.left || 0) - 12),
      activeIndex: prev.query === query ? prev.activeIndex : 0,
    }));
  };

  const schedulePlaceholderSync = () => {
    window.requestAnimationFrame(syncPlaceholderMenu);
  };

  const insertPlaceholderFallback = (tokenValue) => {
    const editor = bodyEditorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) {
      return false;
    }

    let range = selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;

    if (!range || !editor.contains(range.startContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const textNode = document.createTextNode(`{${tokenValue}}`);
    range.deleteContents();
    range.insertNode(textNode);

    const nextRange = document.createRange();
    nextRange.setStart(textNode, textNode.textContent.length);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);

    return true;
  };

  const applyPlaceholder = (tokenValue) => {
    const editor = bodyEditorRef.current;
    const trigger = placeholderTriggerRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) {
      closePlaceholderMenu();
      return;
    }

    let inserted = false;

    if (trigger?.textNode && editor.contains(trigger.textNode)) {
      const originalText = trigger.textNode.textContent || "";
      const safeStart = Math.max(0, Math.min(trigger.startOffset, originalText.length));
      const safeEnd = Math.max(safeStart, Math.min(trigger.endOffset, originalText.length));
      const replacement = `{${tokenValue}}`;

      trigger.textNode.textContent = `${originalText.slice(0, safeStart)}${replacement}${originalText.slice(safeEnd)}`;

      const nextRange = document.createRange();
      nextRange.setStart(trigger.textNode, safeStart + replacement.length);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
      inserted = true;
    }

    if (!inserted) {
      inserted = insertPlaceholderFallback(tokenValue);
    }

    closePlaceholderMenu();

    if (inserted) {
      editor.focus();
      setBodyDirty((bodyEditorRef.current?.innerHTML ?? "") !== originalBodyHtml);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchPeriods();
  }, [headers]);

  useEffect(() => {
    if (!generatorDocument) {
      return undefined;
    }

    const careerFilter = generatorScope === "career" ? generatorCareer : "";
    const timeout = window.setTimeout(() => {
      loadGenerationOptions({
        periodId: generatorPeriodId,
        search: generatorScope === "student" ? generatorSearch.trim() : "",
        career: careerFilter,
      });
    }, generatorScope === "student" ? 250 : 0);

    return () => window.clearTimeout(timeout);
  }, [generatorDocument, generatorPeriodId, generatorSearch, generatorScope, generatorCareer]);

  useEffect(() => {
    if (!result) {
      setBodySeedHtml("");
      setEditorVersion((value) => value + 1);
      setBodyDirty(false);
      closePlaceholderMenu();
      setMetrics({ characters: 0, lines: 0 });
      return;
    }

    setBodySeedHtml(result.body_html || `<pre class="imported-pre">${escapePreviewHtml(result.text || "")}</pre>`);
    setEditorVersion((value) => value + 1);
    setBodyDirty(false);
    closePlaceholderMenu();

    const frame = window.requestAnimationFrame(syncPreviewMetrics);
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  useEffect(() => {
    if (!placeholderMenu.open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (placeholderMenuRef.current?.contains(event.target) || bodyEditorRef.current?.contains(event.target)) {
        return;
      }

      closePlaceholderMenu();
    };

    const handleResize = () => {
      schedulePlaceholderSync();
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [placeholderMenu.open]);

  useEffect(() => {
    if (!placeholderMenu.open) {
      return;
    }

    setPlaceholderMenu((prev) => ({
      ...prev,
      activeIndex: filteredPlaceholders.length ? Math.min(prev.activeIndex, filteredPlaceholders.length - 1) : 0,
    }));
  }, [filteredPlaceholders.length, placeholderMenu.open]);

  useEffect(() => {
    if (generatorScope !== "career" || generatorCareer || generatorCareers.length === 0) {
      return;
    }

    setGeneratorCareer(generatorCareers[0]);
  }, [generatorScope, generatorCareer, generatorCareers]);

  useEffect(() => {
    if (!previewModalDocument) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPreviewModalDocument(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewModalDocument]);

  const handleCreateBlank = () => {
    if (!askToDiscardChanges("Hay cambios sin guardar. Se reemplazara el borrador actual.")) {
      return;
    }

    setSuccess("");
    setDocumentsError("");
    setShowComposer(true);
    resetComposer({ blank: true });
    showToast({
      title: "Documento en blanco",
      message: "Ya puedes escribir el contenido y guardarlo en la biblioteca.",
      variant: "success",
    });
  };

  const handleImport = async () => {
    if (!file) {
      setError("Selecciona un archivo primero.");
      return;
    }

    if (!askToDiscardChanges("Hay cambios sin guardar. Importar otro archivo reemplazara el contenido actual.")) {
      return;
    }

    const data = new FormData();
    data.append("file", file);

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("/api/document-imports", data, { headers });
      setShowComposer(true);
      setSelectedDocumentId(null);
      setTitle(filenameToTitle(response.data?.filename || file.name));
      setDescription("");
      setBaseline({ title: "", description: "" });
      setResult(response.data);
      showToast({
        title: "Importacion lista",
        message: "Ahora puedes editar el cuerpo y guardar el documento para volver a usarlo.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      const message = readApiErrorMessage(err, "No se pudo importar el archivo.");
      setError(message);
      showToast({ title: "Importacion fallida", message, variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleBodyInput = () => {
    setBodyDirty((bodyEditorRef.current?.innerHTML ?? "") !== originalBodyHtml);
    schedulePlaceholderSync();
    window.requestAnimationFrame(syncPreviewMetrics);
  };

  const handleBodyKeyDown = (event) => {
    if (!placeholderMenu.open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPlaceholderMenu((prev) => ({
        ...prev,
        activeIndex: filteredPlaceholders.length ? (prev.activeIndex + 1) % filteredPlaceholders.length : 0,
      }));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setPlaceholderMenu((prev) => ({
        ...prev,
        activeIndex: filteredPlaceholders.length
          ? (prev.activeIndex - 1 + filteredPlaceholders.length) % filteredPlaceholders.length
          : 0,
      }));
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      if (filteredPlaceholders.length > 0) {
        event.preventDefault();
        applyPlaceholder(filteredPlaceholders[placeholderMenu.activeIndex]?.token);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePlaceholderMenu();
    }
  };

  const handleResetBody = () => {
    setBodySeedHtml(originalBodyHtml || DEFAULT_BODY_HTML);
    setEditorVersion((value) => value + 1);
    setBodyDirty(false);
    closePlaceholderMenu();
    window.requestAnimationFrame(syncPreviewMetrics);
  };

  const handleCopy = async () => {
    if (!result) return;

    const text = previewRef.current?.innerText?.trim() || result.text || "";

    try {
      await navigator.clipboard.writeText(text);
      showToast({
        title: "Texto copiado",
        message: "Se copio la version actual del documento, incluyendo tus cambios.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      showToast({ title: "No se pudo copiar", message: "Copia manualmente el contenido desde la vista previa.", variant: "error" });
    }
  };

  const handleSave = async () => {
    if (!result) {
      setError("Primero crea o importa un documento.");
      return;
    }

    if (hasPendingFileImport) {
      setError("Seleccionaste un archivo, pero aun no lo has importado. Presiona Importar documento para cargar el membrete antes de guardar.");
      return;
    }

    if (!title.trim()) {
      setError("Agrega un titulo para guardar el documento.");
      return;
    }

    const bodyHtml = bodyEditorRef.current?.innerHTML || bodySeedHtml || result.body_html || DEFAULT_BODY_HTML;
    const payload = {
      titulo: title.trim(),
      descripcion: description.trim() || null,
      header_html: headerHtml,
      body_html: bodyHtml,
      footer_html: footerHtml,
      source_filename: result?.filename || null,
      source_extension: result?.extension || null,
    };

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = selectedDocumentId
        ? await axios.put(`/api/documents/${selectedDocumentId}`, payload, { headers })
        : await axios.post("/api/documents", payload, { headers });

      const savedDocument = response.data;

      setDocuments((prev) => upsertDocument(prev, savedDocument));
      setBaseline({
        title: (savedDocument.titulo || "").trim(),
        description: (savedDocument.descripcion || "").trim(),
      });
      setSelectedDocumentId(savedDocument.id);
      setTitle(savedDocument.titulo || "");
      setDescription(savedDocument.descripcion || "");
      setFile(null);
      setResult({
        filename: savedDocument.filename || savedDocument.source_filename || null,
        extension: savedDocument.extension || savedDocument.source_extension || null,
        text: savedDocument.text || savedDocument.plain_text || "",
        header_html: savedDocument.header_html || "",
        body_html: savedDocument.body_html || DEFAULT_BODY_HTML,
        footer_html: savedDocument.footer_html || "",
        characters: savedDocument.characters || 0,
        lines: savedDocument.lines || 0,
      });
      setSuccess(selectedDocumentId ? "Documento actualizado correctamente." : "Documento guardado correctamente.");
      setShowComposer(false);
      resetComposer();

      showToast({
        title: selectedDocumentId ? "Cambios guardados" : "Documento guardado",
        message: selectedDocumentId
          ? "El documento se actualizo correctamente."
          : "El documento ya forma parte de tu biblioteca.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      const message = readApiErrorMessage(err, "No pudimos guardar el documento. Revisa el titulo y el contenido.");
      setError(message);
      showToast({ title: "No se pudo guardar", message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDocument = (documentItem) => {
    if (documentItem.id === selectedDocumentId) {
      setShowComposer(true);
      return;
    }

    if (!askToDiscardChanges("Hay cambios sin guardar. Abrir otro documento reemplazara el contenido actual.")) {
      return;
    }

    setSuccess("");
    setDocumentsError("");
    setShowComposer(true);
    hydrateEditorFromDocument(documentItem);
  };

  const handleDeleteDocument = async (documentItem) => {
    const confirmed = window.confirm(`Vas a eliminar "${documentItem.titulo}". Esta accion no se puede deshacer.`);

    if (!confirmed) {
      return;
    }

    setDeletingId(documentItem.id);
    setDocumentsError("");
    setSuccess("");

    try {
      await axios.delete(`/api/documents/${documentItem.id}`, { headers });
      setDocuments((prev) => prev.filter((item) => item.id !== documentItem.id));

      if (selectedDocumentId === documentItem.id) {
        setShowComposer(false);
        resetComposer();
      }

      if (generatorDocument?.id === documentItem.id) {
        resetGenerator();
      }

      setSuccess("Documento eliminado.");
      showToast({
        title: "Documento eliminado",
        message: "El documento salio de la biblioteca.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      const message = readApiErrorMessage(err, "No pudimos eliminar el documento. Intenta nuevamente.");
      setDocumentsError(message);
      showToast({ title: "No se pudo eliminar", message, variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const resetDisabled = !result || !bodyDirty;
  const saveDisabled = saving || !result || !title.trim() || hasPendingFileImport;
  const generatedDocuments = Array.isArray(generationResult?.documents) ? generationResult.documents : [];

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1200px" }}>
        <section
          className="rounded-4 text-white shadow-lg mb-4"
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
            padding: "22px 24px",
          }}
        >
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>Documentos</p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <h1 className="h4 mb-1">Biblioteca de documentos</h1>
              <p className="mb-0" style={{ maxWidth: "560px", opacity: 0.9 }}>
                Revisa los documentos ya creados, abre uno para editarlo o genera uno nuevo con membrete y variables.
              </p>
            </div>
            <div className="ms-auto">
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => (showComposer ? handleCloseComposer() : handleCreateBlank())}
              >
                {showComposer ? "Cerrar formulario" : "Nuevo documento"}
              </button>
            </div>
          </div>
        </section>

        {documentsError && <div className="alert alert-danger py-2">{documentsError}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h5 className="mb-0">Documentos existentes</h5>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{documents.length} en total</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleCreateBlank}
                >
                  Nuevo documento
                </button>
              </div>
            </div>

            {documentsLoading ? (
              <div className="text-muted">Cargando...</div>
            ) : documents.length === 0 ? (
              <div className="text-muted">Aun no hay documentos creados.</div>
            ) : (
              <div className="row g-3">
                {documents.map((documentItem) => {
                  const isActive = showComposer && documentItem.id === selectedDocumentId;
                  const isGeneratorActive = generatorDocument?.id === documentItem.id;
                  const placeholdersCount = Array.isArray(documentItem.placeholders) ? documentItem.placeholders.length : 0;

                  return (
                    <div key={documentItem.id} className="col-12 col-lg-6">
                      <div className={`border rounded p-3 h-100 ${(isActive || isGeneratorActive) ? "bg-primary-subtle border-primary" : "bg-white"}`}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <div className="fw-semibold">{documentItem.titulo}</div>
                            <div className="text-muted small">
                              Actualizado {formatDateTime(documentItem.updated_at || documentItem.created_at)} - ID: {documentItem.id}
                            </div>
                          </div>
                          <div className="d-flex gap-2 flex-wrap justify-content-end">
                            {isActive && <span className="badge text-bg-primary">En edicion</span>}
                            {isGeneratorActive && <span className="badge text-bg-success">Generador</span>}
                          </div>
                        </div>

                        {documentItem.descripcion && (
                          <p className="text-muted small mb-2" style={{ whiteSpace: "pre-line" }}>
                            {documentItem.descripcion}
                          </p>
                        )}

                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span className="badge text-bg-light border">{documentItem.lines || 0} lineas</span>
                          <span className="badge text-bg-light border">{documentItem.characters || 0} caracteres</span>
                          {placeholdersCount > 0 && <span className="badge text-bg-light border">{placeholdersCount} variables</span>}
                          {documentItem.source_extension && (
                            <span className="badge text-bg-light border">{String(documentItem.source_extension).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className={`btn btn-sm ${isGeneratorActive ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => handleOpenGenerator(documentItem)}
                            disabled={deletingId === documentItem.id}
                          >
                            {isGeneratorActive ? "Generador abierto" : "Generar"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenDocument(documentItem)}
                            disabled={deletingId === documentItem.id}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteDocument(documentItem)}
                            disabled={deletingId === documentItem.id}
                          >
                            {deletingId === documentItem.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {generatorDocument && (
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body d-grid gap-3">
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <h5 className="mb-1">Generar documento membretado</h5>
                  <div className="small text-muted">
                    Plantilla activa: <strong>{generatorDocument.titulo}</strong>. Puedes crear una version para un alumno, para todos o solo por carrera.
                  </div>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCloseGenerator}>
                  Cerrar generador
                </button>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label small">Periodo</label>
                  <select
                    className="form-select"
                    value={generatorPeriodId}
                    onChange={(event) => {
                      setGeneratorPeriodId(event.target.value);
                      setGeneratorStudentId("");
                      setGeneratorCareer("");
                      setGeneratorSearch("");
                      setGeneratorError("");
                      setGenerationResult(null);
                    }}
                    disabled={periodsLoading}
                  >
                    {periods.length === 0 ? (
                      <option value="">Periodo actual</option>
                    ) : (
                      periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {formatPeriodLabel(period)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small">Generar para</label>
                  <select
                    className="form-select"
                    value={generatorScope}
                    onChange={(event) => {
                      setGeneratorScope(event.target.value);
                      setGeneratorSearch("");
                      setGeneratorStudentId("");
                      setGeneratorError("");
                      setGenerationResult(null);
                    }}
                  >
                    <option value="student">Un alumno</option>
                    <option value="all">Todos los alumnos</option>
                    <option value="career">Una carrera</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small">Plantilla</label>
                  <div className="form-control bg-light">{generatorDocument.titulo}</div>
                </div>

                {generatorScope === "student" && (
                  <>
                    <div className="col-12 col-md-4">
                      <label className="form-label small">Buscar alumno</label>
                      <input
                        type="text"
                        className="form-control"
                        value={generatorSearch}
                        onChange={(event) => {
                          setGeneratorSearch(event.target.value);
                          setGeneratorError("");
                          setGenerationResult(null);
                        }}
                        placeholder="Nombre, apellido o numero de control"
                      />
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label small">Alumno</label>
                      <select
                        className="form-select"
                        value={generatorStudentId}
                        onChange={(event) => {
                          setGeneratorStudentId(event.target.value);
                          setGeneratorError("");
                          setGenerationResult(null);
                        }}
                        disabled={generatorOptionsLoading || generatorStudents.length === 0}
                      >
                        {generatorStudents.length === 0 ? (
                          <option value="">No hay alumnos disponibles</option>
                        ) : (
                          generatorStudents.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.nombre_completo} - {student.no_control} - {student.carrera || "Sin carrera"}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </>
                )}

                {generatorScope === "career" && (
                  <div className="col-12 col-md-6">
                    <label className="form-label small">Carrera</label>
                    <select
                      className="form-select"
                      value={generatorCareer}
                      onChange={(event) => {
                        setGeneratorCareer(event.target.value);
                        setGeneratorError("");
                        setGenerationResult(null);
                      }}
                      disabled={generatorOptionsLoading || generatorCareers.length === 0}
                    >
                      {generatorCareers.length === 0 ? (
                        <option value="">No hay carreras disponibles</option>
                      ) : (
                        generatorCareers.map((career) => (
                          <option key={career} value={career}>
                            {career}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>

              <div className="border rounded-3 p-3 bg-light">
                <div className="fw-semibold small mb-2">Variables detectadas en la plantilla</div>
                <div className="d-flex flex-wrap gap-2">
                  {(Array.isArray(generatorDocument.placeholders) ? generatorDocument.placeholders : []).length > 0 ? (
                    generatorDocument.placeholders.map((placeholder) => (
                      <span key={placeholder} className="badge text-bg-light border">
                        {`{${placeholder}}`}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted small">Esta plantilla no tiene variables. Aun asi puedes generar copias con el membrete intacto.</span>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                <div className="small text-muted">
                  {generatorOptionsLoading
                    ? "Consultando alumnos disponibles..."
                    : generatorScope === "student"
                      ? `${generatorStudentsTotal} alumno(s) encontrados${generatorSearch.trim() ? " para la busqueda actual" : ""}.`
                      : generatorScope === "career"
                        ? `${generatorStudentsTotal} alumno(s) disponibles en la carrera seleccionada.`
                        : `${generatorStudentsTotal} alumno(s) disponibles para generar esta plantilla.`}
                </div>
                <button type="button" className="btn btn-primary" onClick={handleGenerateDocument} disabled={generatorLoading || generatorOptionsLoading}>
                  {generatorLoading ? "Generando..." : "Generar documentos"}
                </button>
              </div>

              {generatorError && <div className="alert alert-danger py-2 mb-0">{generatorError}</div>}

              {generatedDocuments.length > 0 && (
                <div className="border-top pt-3">
                  <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
                    <div>
                      <h6 className="mb-1">Resultados generados</h6>
                      <div className="small text-muted">
                        {generationResult?.generated_count || generatedDocuments.length} documento(s) listos
                        {generationResult?.period?.codigo ? ` para el periodo ${generationResult.period.codigo}` : ""}.
                      </div>
                    </div>
                  </div>

                  <div className="d-grid gap-3">
                    {generatedDocuments.map((generatedDocument, index) => (
                      <div key={`${generatedDocument?.student?.id || "generated"}-${index}`} className="border rounded-3 p-3 bg-white">
                        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                          <div>
                            <div className="fw-semibold">{generatedDocument?.student?.nombre_completo || "Alumno sin nombre"}</div>
                            <div className="small text-muted">
                              {generatedDocument?.student?.no_control || "Sin control"} - {generatedDocument?.student?.carrera || "Sin carrera"}
                              {generatedDocument?.student?.semestre ? ` - Semestre ${generatedDocument.student.semestre}` : ""}
                            </div>
                          </div>
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleDownloadGeneratedPdf(generatedDocument)}
                            >
                              Descargar PDF
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleOpenGeneratedPreview(generatedDocument)}
                            >
                              Ver completo
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handlePrintGeneratedDocument(generatedDocument)}
                            >
                              Imprimir / Guardar PDF
                            </button>
                          </div>
                        </div>

                        {generatedDocument?.unresolved_placeholders?.length > 0 && (
                          <div className="alert alert-warning py-2 small mt-3 mb-0">
                            Variables sin resolver: {generatedDocument.unresolved_placeholders.map((placeholder) => `{${placeholder}}`).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showComposer && (
          <div className="row g-3">
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body d-grid gap-3">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <h5 className="mb-1">Editor de documento</h5>
                    <div className="small text-muted">
                      {selectedDocumentId ? "Estas editando un documento guardado." : result ? "Tienes un borrador listo para guardar." : "Empieza con un documento en blanco o importa un archivo."}
                    </div>
                  </div>
                  {selectedDocumentId ? <span className="badge text-bg-primary">Guardado</span> : result ? <span className="badge text-bg-warning">Borrador</span> : null}
                </div>

                <div>
                  <label className="form-label small">Titulo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ej. Carta de presentacion base"
                  />
                </div>

                <div>
                  <label className="form-label small">Descripcion</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe cuando se usa este documento"
                  />
                </div>

                <div className="border rounded-3 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <div className="fw-semibold small">Entrada de archivo</div>
                      <div className="small text-muted">Soporta TXT, HTML, DOCX y PDF. En PDF funciona mejor si es digital y no escaneado.</div>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCreateBlank}>
                      Nuevo en blanco
                    </button>
                  </div>

                  <input
                    type="file"
                    className="form-control"
                    accept=".txt,.html,.htm,.docx,.pdf"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />

                  {file && (
                    <div className="small text-muted mt-2">
                      {file.name} - {Math.round(file.size / 1024)} KB
                    </div>
                  )}

                  {hasPendingFileImport && (
                    <div className="alert alert-warning py-2 small mt-3 mb-0">
                      Archivo seleccionado sin importar. Presiona <strong>Importar documento</strong> para cargar el membrete en la vista previa.
                    </div>
                  )}
                </div>

                <div className="border rounded-3 p-3 bg-light">
                  <div className="fw-semibold small mb-2">Variables para automatizar</div>
                  <div className="small text-muted mb-3">
                    En el cuerpo editable puedes escribir <code>{"{"}</code> para abrir sugerencias y convertir el documento en plantilla.
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {quickPlaceholders.map((option) => (
                      <button
                        key={option.token}
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => applyPlaceholder(option.token)}
                        disabled={!result}
                      >
                        {`{${option.token}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {result?.filename && (
                  <div className="border rounded-3 p-3 bg-white small">
                    <div><strong>Archivo base:</strong> {result.filename}</div>
                    <div><strong>Tipo:</strong> {String(result.extension || "manual").toUpperCase()}</div>
                  </div>
                )}

                {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}

                <div className="d-flex gap-2 flex-wrap">
                  <button type="button" className={`btn ${hasPendingFileImport ? "btn-primary" : "btn-outline-primary"}`} onClick={handleImport} disabled={busy || !file}>
                    {busy ? "Importando..." : "Importar documento"}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saveDisabled}>
                    {saving ? "Guardando..." : selectedDocumentId ? "Guardar cambios" : "Guardar documento"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={handleCloseComposer}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-grid gap-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h5 className="mb-1">Vista previa estructurada</h5>
                    <div className="small text-muted">El encabezado y el pie quedan fijos. Solo el cuerpo central es editable.</div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {result && <span className="badge text-bg-light border">{metrics.lines} lineas</span>}
                    {result && <span className="badge text-bg-light border">{metrics.characters} caracteres</span>}
                    {result && (
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleResetBody} disabled={resetDisabled}>
                        Restaurar cuerpo
                      </button>
                    )}
                    {result && (
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCopy}>
                        Copiar texto
                      </button>
                    )}
                  </div>
                </div>

                {result ? (
                  <>
                    <div className="small text-muted">
                      {selectedDocumentId ? `Documento guardado #${selectedDocumentId}` : "Borrador sin guardar"}
                      {hasUnsavedChanges ? " - Cambios pendientes" : ""}
                    </div>
                    <div className="border rounded-3 bg-white overflow-auto position-relative" style={{ minHeight: "420px", maxHeight: "760px" }}>
                      <style>{PREVIEW_STYLES}</style>
                      <div className="document-import-preview p-4" ref={previewRef}>
                        {headerHtml && <div className="docx-section docx-section--header" dangerouslySetInnerHTML={{ __html: headerHtml }} />}

                        <div className="document-import-editor mb-3">
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                            <span className="badge text-bg-light border">Cuerpo editable</span>
                            <span className="small text-muted">Modifica el texto sin afectar el membrete.</span>
                          </div>
                          <div className="document-import-editor__helper small mb-3">
                            <span>Escribe <code>{"{"}</code> para insertar datos del alumno, periodo o seguimiento.</span>
                          </div>
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {quickPlaceholders.map((option) => (
                              <button
                                key={`chip-${option.token}`}
                                type="button"
                                className="document-import-placeholder-chip"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => applyPlaceholder(option.token)}
                              >
                                {`{${option.token}}`}
                              </button>
                            ))}
                          </div>
                          <div
                            key={editorVersion}
                            ref={bodyEditorRef}
                            className="document-import-editor__body"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleBodyInput}
                            onKeyDown={handleBodyKeyDown}
                            onKeyUp={schedulePlaceholderSync}
                            onClick={schedulePlaceholderSync}
                            dangerouslySetInnerHTML={{ __html: bodySeedHtml || originalBodyHtml || DEFAULT_BODY_HTML }}
                          />
                        </div>

                        {footerHtml && <div className="docx-section docx-section--footer" dangerouslySetInnerHTML={{ __html: footerHtml }} />}
                      </div>

                      {placeholderMenu.open && (
                        <div
                          ref={placeholderMenuRef}
                          className="document-import-placeholder-menu"
                          style={{ top: placeholderMenu.top, left: placeholderMenu.left }}
                        >
                          <div className="document-import-placeholder-menu__header">
                            <div className="document-import-placeholder-menu__title">Variables disponibles</div>
                            <div className="document-import-placeholder-menu__subtitle">
                              Inserta la opcion y el editor cerrara automaticamente con <code>{"}"}</code>.
                            </div>
                          </div>
                          {filteredPlaceholders.length > 0 ? (
                            <div className="document-import-placeholder-menu__list">
                              {filteredPlaceholders.map((option, index) => (
                                <button
                                  key={option.token}
                                  type="button"
                                  className={`document-import-placeholder-menu__item${index === placeholderMenu.activeIndex ? " is-active" : ""}`}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => applyPlaceholder(option.token)}
                                >
                                  <span className="document-import-placeholder-menu__token">{`{${option.token}}`}</span>
                                  <span className="document-import-placeholder-menu__meta">{option.category} - {option.label}</span>
                                  <span className="document-import-placeholder-menu__description">{option.description}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="document-import-placeholder-menu__empty">
                              No hay coincidencias para <code>{`{${placeholderMenu.query}}`}</code>.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="border rounded-3 p-4 text-muted bg-white" style={{ minHeight: "420px" }}>
                    Aun no hay contenido cargado. Puedes crear un documento en blanco, importar un archivo o abrir uno de la biblioteca.
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {previewModalDocument && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{ background: "rgba(15, 23, 42, 0.68)", zIndex: 1700 }}
            onClick={handleCloseGeneratedPreview}
          >
            <div
              className="bg-white rounded-4 shadow-lg w-100 d-flex flex-column"
              style={{ maxWidth: "1120px", height: "min(90vh, 900px)" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-start gap-3 p-3 p-md-4 border-bottom">
                <div>
                  <h5 className="mb-1">Vista completa del documento</h5>
                  <div className="small text-muted">
                    {previewModalDocument?.student?.nombre_completo || "Alumno sin nombre"}
                    {previewModalDocument?.student?.no_control ? ` - ${previewModalDocument.student.no_control}` : ""}
                    {previewModalDocument?.student?.carrera ? ` - ${previewModalDocument.student.carrera}` : ""}
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap justify-content-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handlePrintGeneratedDocument(previewModalDocument)}
                  >
                    Imprimir / Guardar PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleCloseGeneratedPreview}
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="flex-grow-1 overflow-auto bg-light">
                <div className="border rounded-4 bg-white m-3 m-md-4 shadow-sm" style={{ minHeight: "calc(100% - 2rem)" }}>
                  <style>{PREVIEW_STYLES}</style>
                  <div className="document-import-preview p-4 p-md-5">
                    {previewModalDocument?.header_html && (
                      <div className="docx-section docx-section--header" dangerouslySetInnerHTML={{ __html: previewModalDocument.header_html }} />
                    )}
                    <div dangerouslySetInnerHTML={{ __html: previewModalDocument?.body_html || DEFAULT_BODY_HTML }} />
                    {previewModalDocument?.footer_html && (
                      <div className="docx-section docx-section--footer" dangerouslySetInnerHTML={{ __html: previewModalDocument.footer_html }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
