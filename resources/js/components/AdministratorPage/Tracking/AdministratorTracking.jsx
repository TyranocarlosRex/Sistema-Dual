import React from "react";

export default function CoordinatorReports() {
  const carreras = ["Sistemas", "Industrial", "Mecatrónica", "Electrónica"];

  const documentosPendientes = [
    "Carta de presentación",
    "Seguro facultativo",
    "Carta de aceptación",
    "Proyecto de educación dual",
    "Plan de formación",
  ];

  const estados = ["Activo", "Baja temporal", "Egresado", "En proceso"];
  const periodos = ["Ene-Jun 2024", "Ago-Dic 2024", "Ene-Jun 2025"];

  return (
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-header bg-white border-bottom-0">
          <h4 className="mb-0">Seguimiento de estudiantes</h4>
        </div>

        <div className="card-body">
          <div className="row">
            {/* Estudiantes por carrera */}
            <div className="col-md-6 mb-4">
              <div className="card h-100 border">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Estudiantes por Carrera</h5>
                </div>
                <div className="card-body">
                  {carreras.map((carrera, index) => {
                    const porcentaje = Math.floor(Math.random() * 100);
                    return (
                      <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small">{carrera}</span>
                          <span className="small fw-bold">{porcentaje}%</span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${porcentaje}%`,
                              backgroundColor: `hsl(${index * 90}, 70%, 50%)`,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Documentos pendientes */}
            <div className="col-md-6 mb-4">
              <div className="card h-100 border">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Documentos Pendientes</h5>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    {documentosPendientes.map((documento, index) => {
                      const cantidad = Math.floor(Math.random() * 15);
                      return (
                        <li
                          key={index}
                          className="list-group-item d-flex justify-content-between align-items-center px-0"
                        >
                          <span
                            className="text-truncate"
                            style={{ maxWidth: "200px" }}
                            title={documento}
                          >
                            {documento}
                          </span>
                          <span className="badge bg-danger rounded-pill">
                            {cantidad}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            {/* Progreso de estudiantes */}
            <div className="col-12">
              <div className="card border">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Progreso de Estudiantes</h5>
                  <div className="btn-group">
                    <button className="btn btn-sm btn-outline-secondary">
                      <i className="bi bi-arrow-left"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Estudiante</th>
                          <th>Carrera</th>
                          <th>Periodo</th>
                          <th>Progreso</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, i) => {
                          const progreso = Math.floor(Math.random() * 100);
                          const estado =
                            estados[
                              Math.floor(Math.random() * estados.length)
                            ];
                          const carrera =
                            carreras[
                              Math.floor(Math.random() * carreras.length)
                            ];
                          const periodo =
                            periodos[
                              Math.floor(Math.random() * periodos.length)
                            ];

                          let estadoClass = "";
                          if (estado === "Activo") estadoClass = "success";
                          else if (estado === "Baja temporal")
                            estadoClass = "warning";
                          else if (estado === "Egresado")
                            estadoClass = "primary";
                          else estadoClass = "info";

                          return (
                            <tr key={i}>
                              <td>Estudiante {i + 1}</td>
                              <td>{carrera}</td>
                              <td>{periodo}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div
                                    className="progress flex-grow-1 me-2"
                                    style={{ height: "6px" }}
                                  >
                                    <div
                                      className={`progress-bar bg-${
                                        progreso < 30
                                          ? "danger"
                                          : progreso < 70
                                          ? "warning"
                                          : "success"
                                      }`}
                                      role="progressbar"
                                      style={{ width: `${progreso}%` }}
                                    ></div>
                                  </div>
                                  <small className="text-muted">
                                    {progreso}%
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span className={`badge bg-${estadoClass}`}>
                                  {estado}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}