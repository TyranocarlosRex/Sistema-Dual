import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

// Datos de prueba para estudiantes
const estudiantesPrueba = [
  {
    id: 1,
    nombre: 'Carlos Alberto Pérez López',
    control: '22331234',
    carrera: 'Sistemas',
    semestre: 7,
    periodo: 'Ene 2025 - Jun 2025',
    estado: 'Activo',
    progreso: 35,
    etapa: 'Inscripción'
  },
  {
    id: 2,
    nombre: 'Ana María García Sánchez',
    control: '22331235',
    carrera: 'Industrial',
    semestre: 8,
    periodo: 'Ene 2025 - Jun 2025',
    estado: 'Activo',
    progreso: 75,
    etapa: 'En proceso'
  },
  {
    id: 3,
    nombre: 'Juan Carlos Martínez Díaz',
    control: '22331236',
    carrera: 'Mecatrónica',
    semestre: 6,
    periodo: 'Ene 2025 - Jun 2025',
    estado: 'Baja temporal',
    progreso: 10,
    etapa: 'Inscripción'
  },
  {
    id: 4,
    nombre: 'María Fernanda López Torres',
    control: '22331237',
    carrera: 'Electrónica',
    semestre: 7,
    periodo: 'Ene 2025 - Jun 2025',
    estado: 'Activo',
    progreso: 90,
    etapa: 'Finalizando'
  },
  {
    id: 5,
    nombre: 'Pedro Antonio Ramírez Gómez',
    control: '22331238',
    carrera: 'Sistemas',
    semestre: 9,
    periodo: 'Ago 2024 - Dic 2024',
    estado: 'Egresado',
    progreso: 100,
    etapa: 'Finalizado'
  }
];

const ListaProcesos = () => {
  const [activeTab, setActiveTab] = useState('seguimiento');
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtro, setFiltro] = useState({
    busqueda: '',
    carrera: '',
    periodo: '',
    estado: ''
  });

  // Cargar datos de prueba al inicio
  useEffect(() => {
    setEstudiantes(estudiantesPrueba);
  }, []);

  // Filtrar estudiantes
  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    const cumpleBusqueda = estudiante.nombre.toLowerCase().includes(filtro.busqueda.toLowerCase()) || 
                         estudiante.control.includes(filtro.busqueda);
    const cumpleCarrera = !filtro.carrera || estudiante.carrera === filtro.carrera;
    const cumplePeriodo = !filtro.periodo || estudiante.periodo === filtro.periodo;
    const cumpleEstado = !filtro.estado || estudiante.estado === filtro.estado;
    
    return cumpleBusqueda && cumpleCarrera && cumplePeriodo && cumpleEstado;
  });

  // Obtener opciones únicas para los filtros
  const carreras = [...new Set(estudiantes.map(e => e.carrera))];
  const periodos = [...new Set(estudiantes.map(e => e.periodo))];
  const estados = [...new Set(estudiantes.map(e => e.estado))];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltro(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltro({
      busqueda: '',
      carrera: '',
      periodo: '',
      estado: ''
    });
  };

  const verDetallesEstudiante = (estudiante) => {
    // Aquí iría la lógica para mostrar detalles del estudiante
    const mensaje = `Detalles de ${estudiante.nombre}\n` +
                   `Control: ${estudiante.control}\n` +
                   `Carrera: ${estudiante.carrera}\n` +
                   `Semestre: ${estudiante.semestre}°\n` +
                   `Estado: ${estudiante.estado}\n` +
                   `Progreso: ${estudiante.progreso}%\n` +
                   `Etapa: ${estudiante.etapa}`;
    
    // Mostrar mensaje en la interfaz en lugar de un alert
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'alert alert-info';
    mensajeDiv.style.position = 'fixed';
    mensajeDiv.style.top = '20px';
    mensajeDiv.style.right = '20px';
    mensajeDiv.style.zIndex = '1050';
    mensajeDiv.style.whiteSpace = 'pre-line';
    mensajeDiv.textContent = mensaje;
    
    // Botón para cerrar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-close';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.right = '5px';
    closeBtn.onclick = () => mensajeDiv.remove();
    
    mensajeDiv.appendChild(closeBtn);
    document.body.appendChild(mensajeDiv);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
      if (document.body.contains(mensajeDiv)) {
        mensajeDiv.remove();
      }
    }, 5000);
  };

  const editarEstudiante = (estudiante) => {
    // Aquí iría la lógica para editar el estudiante
    const mensaje = `Editando a: ${estudiante.nombre}\n` +
                   `(Esta es una simulación - en una implementación real se abriría un formulario de edición)`;
    
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'alert alert-warning';
    mensajeDiv.style.position = 'fixed';
    mensajeDiv.style.top = '20px';
    mensajeDiv.style.left = '50%';
    mensajeDiv.style.transform = 'translateX(-50%)';
    mensajeDiv.style.zIndex = '1050';
    mensajeDiv.style.whiteSpace = 'pre-line';
    mensajeDiv.textContent = mensaje;
    
    // Botón para cerrar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-close';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.right = '5px';
    closeBtn.onclick = () => mensajeDiv.remove();
    
    mensajeDiv.appendChild(closeBtn);
    document.body.appendChild(mensajeDiv);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
      if (document.body.contains(mensajeDiv)) {
        mensajeDiv.remove();
      }
    }, 5000);
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header">
          <h5>Módulo de Procesos</h5>
        </div>
        <div className="card-body">
          {/* Pestañas de navegación */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'seguimiento' ? 'active' : ''}`}
                onClick={() => setActiveTab('seguimiento')}
              >
                Seguimiento de Inscripciones
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'periodos' ? 'active' : ''}`}
                onClick={() => setActiveTab('periodos')}
              >
                Control de Periodos
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'bajas' ? 'active' : ''}`}
                onClick={() => setActiveTab('bajas')}
              >
                Gestión de Bajas y Altas
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'progreso' ? 'active' : ''}`}
                onClick={() => setActiveTab('progreso')}
              >
                Progreso de Estudiantes
              </button>
            </li>
          </ul>

          {/* Contenido de las pestañas */}
          <div className="tab-content">
            {activeTab === 'seguimiento' && (
              <div className="tab-pane fade show active">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-0">Seguimiento de Inscripciones</h6>
                    <p className="text-muted mb-0">
                      Visualiza y gestiona el estado de las inscripciones al programa de Educación Dual.
                    </p>
                  </div>
                  <div>
                    <span className="badge bg-primary">Total: {estudiantesFiltrados.length}</span>
                  </div>
                </div>

                {/* Filtros */}
                <div className="row g-3 mb-3">
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Buscar por nombre o control..."
                      name="busqueda"
                      value={filtro.busqueda}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-2">
                    <select 
                      className="form-select form-select-sm"
                      name="carrera"
                      value={filtro.carrera}
                      onChange={handleInputChange}
                    >
                      <option value="">Todas las carreras</option>
                      {carreras.map((carrera, index) => (
                        <option key={index} value={carrera}>{carrera}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select 
                      className="form-select form-select-sm"
                      name="periodo"
                      value={filtro.periodo}
                      onChange={handleInputChange}
                    >
                      <option value="">Todos los periodos</option>
                      {periodos.map((periodo, index) => (
                        <option key={index} value={periodo}>{periodo}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select 
                      className="form-select form-select-sm"
                      name="estado"
                      value={filtro.estado}
                      onChange={handleInputChange}
                    >
                      <option value="">Todos los estados</option>
                      {estados.map((estado, index) => (
                        <option key={index} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button 
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={limpiarFiltros}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>

                {/* Tabla de estudiantes */}
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead className="table-light">
                      <tr>
                        <th># Control</th>
                        <th>Nombre del Estudiante</th>
                        <th>Carrera</th>
                        <th>Sem.</th>
                        <th>Periodo</th>
                        <th>Estado</th>
                        <th>Progreso</th>
                        <th>Etapa</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantesFiltrados.map(estudiante => (
                        <tr key={estudiante.id}>
                          <td>{estudiante.control}</td>
                          <td>{estudiante.nombre}</td>
                          <td>{estudiante.carrera}</td>
                          <td>{estudiante.semestre}°</td>
                          <td>{estudiante.periodo}</td>
                          <td>
                            <span className={`badge ${
                              estudiante.estado === 'Activo' ? 'bg-success' :
                              estudiante.estado === 'Baja temporal' ? 'bg-warning text-dark' :
                              estudiante.estado === 'Egresado' ? 'bg-info' : 'bg-secondary'
                            }`}>
                              {estudiante.estado}
                            </span>
                          </td>
                          <td>
                            <div className="progress" style={{height: '20px'}}>
                              <div 
                                className={`progress-bar ${
                                  estudiante.progreso < 30 ? 'bg-danger' :
                                  estudiante.progreso < 70 ? 'bg-warning' : 'bg-success'
                                }`} 
                                role="progressbar" 
                                style={{width: `${estudiante.progreso}%`}}
                                aria-valuenow={estudiante.progreso}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                {estudiante.progreso}%
                              </div>
                            </div>
                          </td>
                          <td>{estudiante.etapa}</td>
                          <td className="text-nowrap">
                            <button 
                              className="btn btn-sm btn-outline-primary me-1"
                              title="Ver detalles"
                              onClick={() => verDetallesEstudiante(estudiante)}
                            >
                              <i className="bi bi-eye me-1"></i> Ver
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-success"
                              title="Editar"
                              onClick={() => editarEstudiante(estudiante)}
                            >
                              <i className="bi bi-pencil me-1"></i> Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {estudiantesFiltrados.length === 0 && (
                        <tr>
                          <td colSpan="9" className="text-center text-muted py-3">
                            No se encontraron estudiantes con los filtros seleccionados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'periodos' && (
              <div className="tab-pane fade show active">
                <h6>Control de Periodos Académicos</h6>
                <p className="text-muted">
                  Gestiona los periodos académicos del programa de Educación Dual.
                </p>
                <div className="row">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body">
                        <h6>Periodo Actual</h6>
                        <p>Ene 2025 - Jun 2025</p>
                        <button className="btn btn-sm btn-outline-primary">
                          Configurar Próximo Periodo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bajas' && (
              <div className="tab-pane fade show active">
                <h6>Gestión de Bajas y Altas</h6>
                <p className="text-muted">
                  Registra altas y bajas de estudiantes en el programa de Educación Dual.
                </p>
                <div className="d-flex gap-2 mb-3">
                  <button className="btn btn-primary">
                    <i className="bi bi-person-plus me-1"></i> Dar de Alta
                  </button>
                  <button className="btn btn-outline-danger">
                    <i className="bi bi-person-x me-1"></i> Dar de Baja
                  </button>
                </div>
                {/* Aquí iría la tabla de bajas/altas */}
              </div>
            )}

            {activeTab === 'progreso' && (
              <div className="tab-pane fade show active">
                <h6>Progreso de Estudiantes por Etapa</h6>
                <p className="text-muted">
                  Monitorea el avance de los estudiantes en cada etapa del programa.
                </p>
                <div className="alert alert-info">
                  <i className="bi bi-graph-up me-2"></i>
                  Visualización del progreso general de los estudiantes.
                </div>
                {/* Aquí irían las gráficas de progreso */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaProcesos;
