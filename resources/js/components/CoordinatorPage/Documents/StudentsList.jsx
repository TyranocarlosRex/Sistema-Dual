import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Datos de prueba estáticos
const INICIALES = [
  { 
    id: 1, 
    nombre: "Carlos A",  
    no_control: "22331234", 
    carrera: "Sistemas",  
    semestre: 7,
    periodo: 1, 
    estado: 'activo',
    segundoPeriodo: false,
    documentos: ["Carta de presentación"],
    correo: "carlosa@ejemplo.com",
    telefono: "1234567890",
    empresa: "Empresa A"
  },
  { 
    id: 2, 
    nombre: "Carlos B",
    no_control: "22335678", 
    carrera: "Industrial", 
    semestre: 5,
    periodo: 2, 
    estado: 'pendiente',
    segundoPeriodo: true,
    documentos: ["Carta de presentación", "Vigencia de seguro"],
    correo: "carlosb@ejemplo.com",
    telefono: "0987654321",
    empresa: "Empresa B"
  },
  { 
    id: 3, 
    nombre: "Carlos C", 
    no_control: "22339876", 
    carrera: "Sistemas",  
    semestre: 8,
    periodo: 1, 
    estado: 'rechazado',
    segundoPeriodo: false,
    documentos: [],
    correo: "carlosc@ejemplo.com",
    telefono: "5551234567",
    empresa: "Empresa C"
  },
];

// Componente de notificación simple
function Notificacion({ mensaje, tipo, onCerrar }) {
  if (!mensaje) return null;
  
  // Estilos en línea para evitar CSS adicional
  const estilos = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    minWidth: '250px',
    padding: '15px',
    borderRadius: '4px',
    color: '#fff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    animation: 'slideIn 0.3s ease-out',
    backgroundColor: tipo === 'exito' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#17a2b8'
  };

  return (
    <div style={estilos}>
      <span>{mensaje}</span>
      <button 
        onClick={onCerrar}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0 0 0 15px'
        }}
      >
        &times;
      </button>
    </div>
  );
}

export default function StudentsList() {
  // Estados
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({
    carrera: "",
    periodo: "",
    estado: "todos"
  });
  const [estudiantes, setEstudiantes] = useState(INICIALES);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const navigate = useNavigate();
  
  // Cerrar notificación después de 3 segundos
  useEffect(() => {
    if (notificacion.mensaje) {
      const timer = setTimeout(() => {
        setNotificacion({ mensaje: '', tipo: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);
  
  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    setNotificacion({ mensaje, tipo });
  };

  // Filtrar estudiantes
  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    const cumpleBusqueda = 
      estudiante.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      estudiante.no_control.toLowerCase().includes(busqueda.toLowerCase());
    
    // Verificar si el estudiante está en el período filtrado
    const periodoCoincide = filtros.periodo === "" || 
      (filtros.periodo === "1" && !estudiante.segundoPeriodo) ||
      (filtros.periodo === "2" && estudiante.segundoPeriodo);
    
    const cumpleFiltros = 
      (filtros.carrera === "" || estudiante.carrera === filtros.carrera) &&
      periodoCoincide &&
      (filtros.estado === "todos" || estudiante.estado === filtros.estado);
    
    return cumpleBusqueda && cumpleFiltros;
  });

  // Acciones
  const cambiarEstado = (id, nuevoEstado) => {
    setEstudiantes(estudiantes.map(est => 
      est.id === id ? { ...est, estado: nuevoEstado } : est
    ));
    
    // Mostrar notificación
    const accion = nuevoEstado === 'activo' ? 'activado' : 'desactivado';
    mostrarNotificacion(`Estudiante ${accion} correctamente`, 'exito');
  };
  
  const habilitarSegundoPeriodo = (id) => {
    const nuevosEstudiantes = estudiantes.map(est => 
      est.id === id ? { ...est, segundoPeriodo: true } : est
    );
    setEstudiantes(nuevosEstudiantes);
    mostrarNotificacion('Segundo período habilitado correctamente', 'exito');
    
    // Actualizar también el estudiante seleccionado si es el mismo
    if (estudianteSeleccionado && estudianteSeleccionado.id === id) {
      setEstudianteSeleccionado({ ...estudianteSeleccionado, segundoPeriodo: true });
    }
  };
  
  const enviarCorreo = (email) => {
    // Simular envío de correo
    mostrarNotificacion(`Correo enviado a: ${email}`, 'info');
  };

  // Obtener clase CSS según el estado
  const getEstadoClase = (estado) => {
    switch(estado) {
      case 'activo': return 'bg-success';
      case 'pendiente': return 'bg-warning';
      case 'rechazado': return 'bg-danger';
      default: return 'bg-light text-dark';
    }
  };

  // Obtener texto legible del estado
  const getEstadoTexto = (estado) => {
    switch(estado) {
      case 'activo': return 'Activo';
      case 'pendiente': return 'Pendiente';
      case 'rechazado': return 'Rechazado';
      default: return 'Sin estado';
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Notificación */}
      {notificacion.mensaje && (
        <Notificacion 
          mensaje={notificacion.mensaje} 
          tipo={notificacion.tipo}
          onCerrar={() => setNotificacion({ mensaje: '', tipo: '' })}
        />
      )}
      
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Gestión de Estudiantes</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setMostrarModal(true)}
        >
          + Nuevo Estudiante
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Buscar</label>
              <div className="input-group">
                <span className="input-group-text">🔍</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre o número de control..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Carrera</label>
              <select
                className="form-select"
                value={filtros.carrera}
                onChange={(e) => setFiltros({...filtros, carrera: e.target.value})}
              >
                <option value="">Todas las carreras</option>
                <option value="Sistemas">Sistemas</option>
                <option value="Industrial">Industrial</option>
                <option value="Mecatrónica">Mecatrónica</option>
                <option value="Electrónica">Electrónica</option>
              </select>
            </div>
            
            <div className="col-md-2">
              <label className="form-label">Periodo</label>
              <select
                className="form-select"
                value={filtros.periodo}
                onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="1">Primer Periodo</option>
                <option value="2">Segundo Periodo</option>
              </select>
            </div>
            
            <div className="col-md-2">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="todos">Todos</option>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            
            <div className="col-md-1 d-flex align-items-end">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setBusqueda("");
                  setFiltros({ carrera: "", periodo: "", estado: "todos" });
                }}
                title="Limpiar filtros"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de estudiantes */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>No. Control</th>
                  <th>Nombre</th>
                  <th>Carrera</th>
                  <th>Semestre</th>
                  <th>Periodo</th>
                  <th>Documentos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map(estudiante => (
                  <tr key={estudiante.id}>
                    <td>{estudiante.no_control}</td>
                    <td>{estudiante.nombre}</td>
                    <td>{estudiante.carrera}</td>
                    <td>{estudiante.semestre}°</td>
                    <td>
                      {estudiante.segundoPeriodo ? '2°' : `${estudiante.periodo}°`}
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {estudiante.documentos?.length || 0} docs
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getEstadoClase(estudiante.estado || 'pendiente')}`}>
                        {getEstadoTexto(estudiante.estado || 'pendiente')}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => setEstudianteSeleccionado(estudiante)}
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        <div className="btn-group" role="group">
                          <button 
                            className={`btn ${estudiante.estado === 'activo' ? 'btn-success' : 'btn-outline-success'}`}
                            title="Activar"
                            onClick={() => cambiarEstado(estudiante.id, 'activo')}
                          >
                            Activo
                          </button>
                          <button 
                            className={`btn ${estudiante.estado === 'pendiente' ? 'btn-warning' : 'btn-outline-warning'}`}
                            title="Marcar como pendiente"
                            onClick={() => cambiarEstado(estudiante.id, 'pendiente')}
                          >
                            Pendiente
                          </button>
                          <button 
                            className={`btn ${estudiante.estado === 'rechazado' ? 'btn-danger' : 'btn-outline-danger'}`}
                            title="Rechazar"
                            onClick={() => cambiarEstado(estudiante.id, 'rechazado')}
                          >
                            Rechazado
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {estudiantesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No se encontraron estudiantes que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      {estudianteSeleccionado && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Detalles del Estudiante</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setEstudianteSeleccionado(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Información Personal</h6>
                    <p><strong>Nombre:</strong> {estudianteSeleccionado.nombre}</p>
                    <p><strong>No. Control:</strong> {estudianteSeleccionado.no_control}</p>
                    <p><strong>Carrera:</strong> {estudianteSeleccionado.carrera}</p>
                    <p><strong>Semestre:</strong> {estudianteSeleccionado.semestre}°</p>
                    <p><strong>Periodo:</strong> {estudianteSeleccionado.periodo}°</p>
                    <p><strong>Correo:</strong> {estudianteSeleccionado.correo}</p>
                    <p><strong>Teléfono:</strong> {estudianteSeleccionado.telefono}</p>
                    <p><strong>Empresa:</strong> {estudianteSeleccionado.empresa}</p>
                    <p>
                      <strong>Estado:</strong>{' '}
                      <span className={`badge ${getEstadoClase(estudianteSeleccionado.estado || 'pendiente')}`}>
                        {getEstadoTexto(estudianteSeleccionado.estado || 'pendiente')}
                      </span>
                      {estudianteSeleccionado.segundoPeriodo && (
                        <span className="badge bg-info ms-2">2° Período</span>
                      )}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Documentos</h6>
                    {estudianteSeleccionado.documentos && estudianteSeleccionado.documentos.length > 0 ? (
                      <div className="list-group mb-3">
                        {estudianteSeleccionado.documentos.map((doc, idx) => (
                          <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>📄 {doc}</span>
                            <span className="badge bg-success rounded-pill">Completado</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-info">No hay documentos registrados</div>
                    )}
                    
                    <h6 className="mt-4">Acciones</h6>
                    <div className="d-flex flex-wrap gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/documentos/${estudianteSeleccionado.id}`)}
                      >
                        Revisar Documentos
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => enviarCorreo(estudianteSeleccionado.correo)}
                      >
                        Enviar Correo
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-success"
                        onClick={() => habilitarSegundoPeriodo(estudianteSeleccionado.id)}
                        disabled={estudianteSeleccionado.segundoPeriodo}
                      >
                        {estudianteSeleccionado.segundoPeriodo ? '2° Período Habilitado' : 'Habilitar 2° Período'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEstudianteSeleccionado(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para nuevo estudiante */}
      {mostrarModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Nuevo Estudiante</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setMostrarModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre completo</label>
                  <input type="text" className="form-control" placeholder="Ejemplo: Carlos Eduardo Muñoz Castillo" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Número de control</label>
                  <input type="text" className="form-control" placeholder="22331234" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Carrera</label>
                  <select className="form-select">
                    <option value="">Selecciona una carrera</option>
                    <option value="Sistemas">Sistemas</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Mecatrónica">Mecatrónica</option>
                    <option value="Electrónica">Electrónica</option>
                  </select>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Semestre</label>
                    <input type="number" min="1" max="12" className="form-control" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Periodo</label>
                    <select className="form-select">
                      <option value="1">Primer Periodo</option>
                      <option value="2">Segundo Periodo</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input type="email" className="form-control" placeholder="ejemplo@hermosillo.tecnm.mx" />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    // En una implementación real, aquí iría la lógica para guardar
                    setNotificacion({ mensaje: 'Estudiante agregado correctamente', tipo: 'exito' });
                    setMostrarModal(false);
                    // Limpiar notificación después de 3 segundos
                    setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 3000);
                  }}
                >
                  Guardar Estudiante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}