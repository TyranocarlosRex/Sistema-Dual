import React, { useState } from 'react';

export default function CoordinatorReports() {
  const [activeTab, setActiveTab] = useState('predefinidos');
  
  const [filtros, setFiltros] = useState({
    carrera: '',
    periodo: '',
    estado: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const reportesPredefinidos = [
    { 
      id: 1, 
      nombre: 'Estudiantes activos', 
      descripcion: 'Listado de estudiantes actualmente en el programa', 
      icono: 'bi-people' 
    },
    { 
      id: 2, 
      nombre: 'Estudiantes por carrera', 
      descripcion: 'Distribución de estudiantes por carrera', 
      icono: 'bi-bar-chart' 
    },
    { 
      id: 3, 
      nombre: 'Progreso por estudiante', 
      descripcion: 'Avance de cada estudiante en el programa', 
      icono: 'bi-graph-up' 
    },
    { 
      id: 4, 
      nombre: 'Documentos pendientes', 
      descripcion: 'Documentos faltantes por estudiante', 
      icono: 'bi-file-earmark-text' 
    },
  ];

  const opcionesFiltros = {
    carreras: ['Sistemas', 'Industrial', 'Mecatrónica', 'Electrónica'],
    periodos: ['Enero-Junio 2024', 'Agosto-Diciembre 2024', 'Enero-Junio 2025'],
    estados: ['Activo', 'Baja temporal', 'Egresado', 'En proceso']
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
    notificacion.role = 'alert';
    notificacion.innerHTML = `
      <strong>${titulo}</strong> ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const contenedor = document.getElementById('notificaciones');
    contenedor.appendChild(notificacion);
    
    setTimeout(() => {
      notificacion.remove();
    }, 5000);
  };

  const generarReporte = (tipo, nombre = '') => {
    mostrarNotificacion('info', 'Generando reporte', 
      nombre ? `Se está generando el reporte: ${nombre}` : 'Generando reporte personalizado');
    
    console.log('Generando reporte con filtros:', filtros);
  };

  const exportarDatos = (formato) => {
    mostrarNotificacion('info', 'Exportando datos', 
      `Los datos se están exportando en formato ${formato}`);
    
    console.log(`Exportando a ${formato} con filtros:`, filtros);
  };

  return (
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-header bg-white border-bottom-0">
          <h4 className="mb-0">Módulo de Reportes</h4>
        </div>
        
        {}
        <ul className="nav nav-tabs px-3 pt-2">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'predefinidos' ? 'active' : ''}`}
              onClick={() => setActiveTab('predefinidos')}
            >
              <i className="bi bi-collection me-1"></i> Reportes Predefinidos
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'personalizados' ? 'active' : ''}`}
              onClick={() => setActiveTab('personalizados')}
            >
              <i className="bi bi-gear-wide-connected me-1"></i> Generador de Reportes
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'metricas' ? 'active' : ''}`}
              onClick={() => setActiveTab('metricas')}
            >
              <i className="bi bi-graph-up me-1"></i> Métricas del Programa
            </button>
          </li>
        </ul>

        <div className="card-body">
          {}
          
          {}
          {activeTab === 'predefinidos' && (
            <div className="row g-4">
              {reportesPredefinidos.map(reporte => (
                <div key={reporte.id} className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <i className={`bi ${reporte.icono} fs-3 text-primary me-3`}></i>
                        <h5 className="card-title mb-0">{reporte.nombre}</h5>
                      </div>
                      <p className="card-text text-muted small">{reporte.descripcion}</p>
                    </div>
                    <div className="card-footer bg-transparent border-top-0 pt-0">
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-primary flex-fill"
                          onClick={() => generarReporte('vista_previa', reporte.nombre)}
                        >
                          <i className="bi bi-eye me-1"></i> Vista Previa
                        </button>
                        <div className="dropdown">
                          <button 
                            className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                            type="button" 
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            title="Exportar"
                          >
                            <i className="bi bi-download"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={() => exportarDatos('PDF')}
                              >
                                <i className="bi bi-file-pdf me-2"></i> PDF
                              </button>
                            </li>
                            <li>
                              <button 
                                className="dropdown-item" 
                                onClick={() => exportarDatos('Excel')}
                              >
                                <i className="bi bi-file-excel me-2"></i> Excel
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {}
          {activeTab === 'personalizados' && (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card border">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Generar Reporte Personalizado</h5>
                    <p className="text-muted small mb-0">Selecciona los criterios para generar tu reporte</p>
                  </div>
                  <div className="card-body">
                    <form onSubmit={(e) => { e.preventDefault(); generarReporte('personalizado'); }}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Carrera</label>
                          <select 
                            className="form-select form-select-sm"
                            name="carrera"
                            value={filtros.carrera}
                            onChange={handleInputChange}
                          >
                            <option value="">Todas las carreras</option>
                            {opcionesFiltros.carreras.map((carrera, index) => (
                              <option key={index} value={carrera}>{carrera}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="col-md-6">
                          <label className="form-label">Periodo</label>
                          <select 
                            className="form-select form-select-sm"
                            name="periodo"
                            value={filtros.periodo}
                            onChange={handleInputChange}
                          >
                            <option value="">Todos los periodos</option>
                            {opcionesFiltros.periodos.map((periodo, index) => (
                              <option key={index} value={periodo}>{periodo}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="col-md-6">
                          <label className="form-label">Estado</label>
                          <select 
                            className="form-select form-select-sm"
                            name="estado"
                            value={filtros.estado}
                            onChange={handleInputChange}
                          >
                            <option value="">Todos los estados</option>
                            {opcionesFiltros.estados.map((estado, index) => (
                              <option key={index} value={estado}>{estado}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="col-md-6">
                          <label className="form-label">Rango de fechas</label>
                          <div className="input-group input-group-sm">
                            <input 
                              type="date" 
                              className="form-control" 
                              name="fechaInicio"
                              value={filtros.fechaInicio}
                              onChange={handleInputChange}
                            />
                            <span className="input-group-text">a</span>
                            <input 
                              type="date" 
                              className="form-control" 
                              name="fechaFin"
                              value={filtros.fechaFin}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        
                        <div className="col-12 mt-4">
                          <div className="d-flex justify-content-between">
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary"
                              onClick={() => setFiltros({
                                carrera: '',
                                periodo: '',
                                estado: '',
                                fechaInicio: '',
                                fechaFin: ''
                              })}
                            >
                              <i className="bi bi-arrow-counterclockwise me-1"></i> Limpiar Filtros
                            </button>
                            <div className="btn-group">
                              <button 
                                type="submit" 
                                className="btn btn-primary"
                              >
                                <i className="bi bi-gear me-1"></i> Generar Reporte
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-primary dropdown-toggle dropdown-toggle-split" 
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <span className="visually-hidden">Exportar</span>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                  <button 
                                    className="dropdown-item" 
                                    type="button"
                                    onClick={() => exportarDatos('PDF')}
                                  >
                                    <i className="bi bi-file-pdf me-2"></i> Exportar a PDF
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item" 
                                    type="button"
                                    onClick={() => exportarDatos('Excel')}
                                  >
                                    <i className="bi bi-file-excel me-2"></i> Exportar a Excel
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {}
          {activeTab === 'metricas' && (
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="card h-100 border">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Estudiantes por Carrera</h5>
                  </div>
                  <div className="card-body">
                    {['Sistemas', 'Industrial', 'Mecatrónica', 'Electrónica'].map((carrera, index) => {
                      const porcentaje = Math.floor(Math.random() * 100);
                      return (
                        <div key={index} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="small">{carrera}</span>
                            <span className="small fw-bold">{porcentaje}%</span>
                          </div>
                          <div className="progress" style={{height: '8px'}}>
                            <div 
                              className="progress-bar" 
                              role="progressbar" 
                              style={{
                                width: `${porcentaje}%`,
                                backgroundColor: `hsl(${index * 90}, 70%, 50%)`
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="col-md-6 mb-4">
                <div className="card h-100 border">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Documentos Pendientes</h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      {[
                        'Carta de presentación',
                        'Seguro facultativo',
                        'Carta de aceptación',
                        'Proyecto de educación dual',
                        'Plan de formación'
                      ].map((documento, index) => {
                        const cantidad = Math.floor(Math.random() * 15);
                        return (
                          <li key={index} className="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span className="text-truncate" style={{maxWidth: '200px'}} title={documento}>
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
                          {Array.from({length: 5}).map((_, i) => {
                            const progreso = Math.floor(Math.random() * 100);
                            const estados = ['Activo', 'Baja temporal', 'Egresado', 'En proceso'];
                            const estado = estados[Math.floor(Math.random() * estados.length)];
                            const carreras = ['Sistemas', 'Industrial', 'Mecatrónica', 'Electrónica'];
                            const carrera = carreras[Math.floor(Math.random() * carreras.length)];
                            const periodos = ['Ene-Jun 2024', 'Ago-Dic 2024', 'Ene-Jun 2025'];
                            const periodo = periodos[Math.floor(Math.random() * periodos.length)];
                            
                            let estadoClass = '';
                            if (estado === 'Activo') estadoClass = 'success';
                            else if (estado === 'Baja temporal') estadoClass = 'warning';
                            else if (estado === 'Egresado') estadoClass = 'primary';
                            else estadoClass = 'info';
                            
                            return (
                              <tr key={i}>
                                <td>Estudiante {i + 1}</td>
                                <td>{carrera}</td>
                                <td>{periodo}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="progress flex-grow-1 me-2" style={{height: '6px'}}>
                                      <div 
                                        className={`progress-bar bg-${progreso < 30 ? 'danger' : progreso < 70 ? 'warning' : 'success'}`}
                                        role="progressbar" 
                                        style={{width: `${progreso}%`}}
                                      ></div>
                                    </div>
                                    <small className="text-muted">{progreso}%</small>
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
          )}
        </div>
      </div>
      
      {}
      <div id="notificaciones" className="position-fixed" style={{top: '20px', right: '20px', zIndex: 1060, maxWidth: '350px'}}></div>
    </div>
  );
};
