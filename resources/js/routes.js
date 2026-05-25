export const APP_ROUTES = {
  auth: {
    studentLogin: "/login-student",
    coordinatorLogin: "/login-coordinator",
    adminLogin: "/login-admin",
  },
  student: {
    home: "/estudiante/inicio",
    evidences: "/estudiante/evidencias",
  },
  coordinator: {
    home: "/coordinador/inicio",
    users: "/coordinador/usuarios",
    tracking: "/coordinador/seguimiento",
    pending: "/coordinador/pendientes",
    studentDetails: (id = ":id") => `/coordinador/estudiantes/${id}`,
  },
  admin: {
    home: "/administrador/inicio",
    periods: "/administrador/periodos",
    users: "/administrador/usuarios",
    tracking: "/administrador/seguimiento",
    evidences: "/administrador/evidencias",
    reports: "/administrador/reportes",
    documents: "/administrador/documentos",
    advertisements: "/administrador/anuncios",
    studentDetails: (id = ":id") => `/administrador/estudiantes/${id}`,
  },
};
