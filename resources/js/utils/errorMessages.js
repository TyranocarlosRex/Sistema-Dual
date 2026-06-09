const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const firstValidationMessage = (data) => {
  const errors = data?.errors;

  if (!errors || typeof errors !== "object") {
    return "";
  }

  return Object.values(errors).flat().filter(Boolean)[0] || "";
};

const friendlyFromServerMessage = (message) => {
  const normalized = normalizeText(message);

  if (!normalized) return "";

  if (
    normalized.includes("credenciales invalidas") ||
    normalized.includes("faltan credenciales") ||
    normalized.includes("parametros faltantes")
  ) {
    return "Revisa tus datos de acceso.";
  }

  if (normalized.includes("token")) {
    return "Vuelve a iniciar sesion.";
  }

  if (normalized.includes("no autorizado")) {
    return "Tu cuenta no tiene permiso para realizar esta accion.";
  }

  if (normalized.includes("no tienes perfil")) {
    return "Tu cuenta no tiene perfil para esta seccion.";
  }

  if (normalized.includes("periodo cerrado")) {
    return "Este periodo ya esta cerrado y solo permite consulta.";
  }

  if (normalized.includes("periodo activo")) {
    return message;
  }

  return message;
};

export const getApiErrorMessage = (
  error,
  fallback = "No pudimos completar la accion."
) => {
  const response = error?.response;
  const status = response?.status;
  const serverMessage =
    firstValidationMessage(response?.data) || response?.data?.message || "";

  if (!response) {
    return "No pudimos conectarnos con el servidor.";
  }

  if (status === 401) {
    return "Tu sesion expiro. Inicia sesion otra vez.";
  }

  if (status === 403) {
    return friendlyFromServerMessage(serverMessage) || "Tu cuenta no tiene permiso para realizar esta accion.";
  }

  if (status === 404) {
    return friendlyFromServerMessage(serverMessage) || "No encontramos la informacion solicitada.";
  }

  if (status === 413) {
    return "El archivo es demasiado grande.";
  }

  if (status === 422) {
    return friendlyFromServerMessage(serverMessage) || fallback;
  }

  if (status === 429) {
    return "Se hicieron demasiados intentos. Espera un momento y vuelve a probar.";
  }

  if (status >= 500) {
    return "El servidor tuvo un problema.";
  }

  return friendlyFromServerMessage(serverMessage) || fallback;
};

export const getLoginErrorMessage = (error) => {
  const response = error?.response;
  const status = response?.status;
  const serverMessage =
    firstValidationMessage(response?.data) || response?.data?.message || "";
  const normalized = normalizeText(serverMessage);

  if (!response) {
    return "No pudimos conectarnos con el servidor.";
  }

  if (status === 422 || normalized.includes("faltan credenciales") || normalized.includes("parametros faltantes")) {
    return "Completa usuario y contrasena para iniciar sesion.";
  }

  if (status === 403 && normalized.includes("septimo") && normalized.includes("semestre")) {
    return "No pudimos iniciar sesion";
  }

  if (
    status === 401 ||
    status === 404 ||
    normalized.includes("credenciales invalidas") ||
    normalized.includes("no encontrado")
  ) {
    return "No pudimos iniciar sesion. Verifica tus datos.";
  }

  return getApiErrorMessage(error, "No pudimos iniciar sesion.");
};
