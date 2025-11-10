import React, { useState } from 'react';

const ConfiguracionDocumentos = () => {
  const [documentos, setDocumentos] = useState([
    { id: 1, nombre: 'Carta de presentación', tipo: 'Plantilla', periodo: 'Ambos', fechaLimite: '2023-12-31' },
    { id: 2, nombre: 'Vigencia de seguro', tipo: 'Formato', periodo: 'Ambos', fechaLimite: '2023-12-31' },
  ]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [periodo, setPeriodo] = useState('Ambos');
  const [fechaLimite, setFechaLimite] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const guardarDocumento = (e) => {
    e.preventDefault();
    
    const mensajeExistente = document.querySelector('.alert-warning');
    if (mensajeExistente) {
      mensajeExistente.remove();
    }
    
    if (!nombre.trim() || !tipo) {
      const mensaje = document.createElement('div');
      mensaje.className = 'alert alert-warning mb-3';
      mensaje.style.transition = 'none';
      mensaje.style.transform = 'none';
      mensaje.textContent = 'Por favor complete todos los campos obligatorios';
      
      const form = e.target;
      form.parentNode.insertBefore(mensaje, form.nextSibling);
      
      setTimeout(() => {
        if (document.body.contains(mensaje)) {
          mensaje.remove();
        }
      }, 3000);
      
      return;
    }
    
    if (editandoId) {
      setDocumentos(documentos.map(d => 
        d.id === editandoId 
          ? { ...d, nombre, tipo, periodo, fechaLimite }
          : d
      ));
      setEditandoId(null);
    } else {
      const nuevoDoc = {
        id: Date.now(),
        nombre,
        tipo,
        periodo,
        fechaLimite
      };
      setDocumentos([...documentos, nuevoDoc]);
    }
    
    setNombre('');
    setTipo('');
    setPeriodo('Ambos');
    setFechaLimite('');
  };

  const confirmarEliminacion = (id) => {
    setDocumentoAEliminar(id);
    setMostrarConfirmacion(true);
  };

  const eliminarDocumento = () => {
    if (documentoAEliminar) {
      setDocumentos(documentos.filter(doc => doc.id !== documentoAEliminar));
      setDocumentoAEliminar(null);
      setMostrarConfirmacion(false);
    }
  };

  const cancelarEliminacion = () => {
    setDocumentoAEliminar(null);
    setMostrarConfirmacion(false);
  };

  const editarDocumento = (doc) => {
    setNombre(doc.nombre);
    setTipo(doc.tipo || '');
    setPeriodo(doc.periodo);
    setFechaLimite(doc.fechaLimite);
    setEditandoId(doc.id);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>Configuración de Documentos</h5>
      </div>
      
      {}
      {mostrarConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar eliminación</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={cancelarEliminacion}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar este documento?</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cancelarEliminacion}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={eliminarDocumento}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="card-body">
        <form onSubmit={guardarDocumento} className="mb-4" noValidate>
          <div className="row g-3">
            <div className="col-md-4">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nombre del documento" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)}
                style={{boxShadow: 'none'}}
              />
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text" title="Tipo de documento">
                  <i className="bi bi-card-text"></i>
                </span>
                <select 
                  className="form-select" 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)}
                  style={{boxShadow: 'none'}}
                  title="Seleccione el tipo de documento"
                >
                  <option value="" disabled>Seleccione un tipo</option>
                  <option 
                    value="Plantilla"
                    title="Documento generado automáticamente por el sistema para que el estudiante lo descargue, complete y suba. Ej: Carta de presentación, Carta de aceptación"
                  >
                    Plantilla
                  </option>
                  <option 
                    value="Formato"
                    title="Documento que el estudiante debe obtener externamente y subir al sistema. Ej: Vigencia de seguro, documentos de la empresa"
                  >
                    Formato
                  </option>
                  <option 
                    value="Requisito"
                    title="Documento obligatorio para avanzar en el programa. Ej: Proyecto de educación dual, Análisis de competencias"
                  >
                    Requisito
                  </option>
                  <option 
                    value="Seguimiento"
                    title="Documentos que se requieren periódicamente durante el programa. Ej: Formatos de ejecución mensual, evaluaciones"
                  >
                    Seguimiento
                  </option>
                </select>
                <span className="input-group-text" title="Tipo de documento">
                  <i className="bi bi-card-text"></i>
                </span>
              </div>
            </div>
            <div className="col-md-2">
              <select 
                className="form-select" 
                value={periodo} 
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <option value="Ambos">Ambos periodos</option>
                <option value="1">Primer periodo</option>
                <option value="2">Segundo periodo</option>
              </select>
            </div>
            <div className="col-md-2">
              <input 
                type="date" 
                className="form-control" 
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                required
              />
            </div>
            <div className="col-md-1">
              <button type="submit" className="btn btn-primary w-100">
                {editandoId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
            {editandoId && (
              <div className="col-md-2">
                <button 
                  type="button" 
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setEditandoId(null);
                    setNombre('');
                    setTipo('Plantilla');
                    setPeriodo('Ambos');
                    setFechaLimite('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </form>

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Periodo</th>
                <th>Fecha Límite</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.nombre}</td>
                  <td>
                    <span className={`badge ${
                      doc.tipo === 'Plantilla' ? 'bg-primary' : 
                      doc.tipo === 'Formato' ? 'bg-info text-dark' : 'bg-warning text-dark'
                    }`}>
                      {doc.tipo}
                    </span>
                  </td>
                  <td>{doc.periodo}</td>
                  <td>{doc.fechaLimite}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => editarDocumento(doc)}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => confirmarEliminacion(doc.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RevisionDocumentos = () => {
  const [documentosPendientes, setDocumentosPendientes] = useState([
    { 
      id: 1, 
      estudiante: 'Carlos A', 
      documento: 'Carta de presentación', 
      fecha: '2023-11-10',
      estado: 'Pendiente',
      comentarios: ''
    },
    { 
      id: 2, 
      estudiante: 'Carlos B', 
      documento: 'Vigencia de seguro', 
      fecha: '2023-11-09',
      estado: 'Pendiente',
      comentarios: ''
    },
  ]);

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [comentario, setComentario] = useState('');
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [error, setError] = useState('');

  const cambiarEstadoDocumento = (id, nuevoEstado) => {
    if (nuevoEstado === 'Rechazado' && comentario.trim() === '') {
      setError('Por favor ingresa un comentario de rechazo');
      return;
    }
    
    setError('');
    
    setDocumentosPendientes(documentosPendientes.map(doc => 
      doc.id === id 
        ? { 
            ...doc, 
            estado: nuevoEstado,
            comentarios: nuevoEstado === 'Rechazado' ? comentario : 'Documento aprobado',
            revisadoPor: 'Coordinador',
            fechaRevision: new Date().toISOString().split('T')[0]
          } 
        : doc
    ));
    
    setDocumentoSeleccionado(null);
    setComentario('');
  };

  const documentosFiltrados = documentosPendientes.filter(doc => 
    filtroEstado === 'todos' || doc.estado === filtroEstado
  );

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Revisión de Documentos</h5>
        <div className="col-md-3">
          <select 
            className="form-select" 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Aprobado">Aprobados</option>
            <option value="Rechazado">Rechazados</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentosFiltrados.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.estudiante}</td>
                  <td>{doc.documento}</td>
                  <td>{doc.fecha}</td>
                  <td>
                    <span className={`badge ${
                      doc.estado === 'Aprobado' ? 'bg-success' : 
                      doc.estado === 'Rechazado' ? 'bg-danger' : 'bg-warning text-dark'
                    }`}>
                      {doc.estado}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => setDocumentoSeleccionado(doc)}
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        {documentoSeleccionado && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Revisar Documento</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setDocumentoSeleccionado(null);
                      setError('');
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <p><strong>Estudiante:</strong> {documentoSeleccionado.estudiante}</p>
                  <p><strong>Documento:</strong> {documentoSeleccionado.documento}</p>
                  <p><strong>Fecha de envío:</strong> {documentoSeleccionado.fecha}</p>
                  
                  <div className="mb-3">
                    <label className="form-label">Comentarios:</label>
                    {error && (
                      <div className="alert alert-warning" role="alert">
                        {error}
                      </div>
                    )}
                    <textarea 
                      className={`form-control ${error ? 'is-invalid' : ''}`} 
                      rows="3"
                      value={comentario}
                      onChange={(e) => {
                        setComentario(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Ingresa tus comentarios aquí..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => cambiarEstadoDocumento(documentoSeleccionado.id, 'Aprobado')}
                  >
                    Aprobar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={() => cambiarEstadoDocumento(documentoSeleccionado.id, 'Rechazado')}
                  >
                    Rechazar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setDocumentoSeleccionado(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HistorialDocumentos = () => {
  const [historial] = useState([
    { 
      id: 1, 
      estudiante: 'Carlos A', 
      documento: 'Carta de presentación', 
      fecha: '2023-11-10',
      estado: 'Aprobado',
      revisadoPor: 'Admin',
      comentarios: 'Documento completo y correcto'
    },
    { 
      id: 2, 
      estudiante: 'Carlos B', 
      documento: 'Vigencia de seguro', 
      fecha: '2023-11-09',
      estado: 'Rechazado',
      revisadoPor: 'Admin',
      comentarios: 'Documento vencido'
    },
  ]);

  const [filtro, setFiltro] = useState({
    estudiante: '',
    documento: '',
    estado: 'todos',
    fechaInicio: '',
    fechaFin: ''
  });

  const documentosFiltrados = historial.filter(item => {
    const cumpleEstudiante = item.estudiante.toLowerCase().includes(filtro.estudiante.toLowerCase());
    const cumpleDocumento = item.documento.toLowerCase().includes(filtro.documento.toLowerCase());
    const cumpleEstado = filtro.estado === 'todos' || item.estado === filtro.estado;
    const cumpleFechaInicio = !filtro.fechaInicio || item.fecha >= filtro.fechaInicio;
    const cumpleFechaFin = !filtro.fechaFin || item.fecha <= filtro.fechaFin;

    return cumpleEstudiante && cumpleDocumento && cumpleEstado && cumpleFechaInicio && cumpleFechaFin;
  });

  const limpiarFiltros = () => {
    setFiltro({
      estudiante: '',
      documento: '',
      estado: 'todos',
      fechaInicio: '',
      fechaFin: ''
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>Historial de Documentos</h5>
      </div>
      <div className="card-body">
        <div className="row mb-4">
          <div className="col-md-3 mb-2">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Filtrar por estudiante"
              value={filtro.estudiante}
              onChange={(e) => setFiltro({...filtro, estudiante: e.target.value})}
            />
          </div>
          <div className="col-md-3 mb-2">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Filtrar por documento"
              value={filtro.documento}
              onChange={(e) => setFiltro({...filtro, documento: e.target.value})}
            />
          </div>
          <div className="col-md-2 mb-2">
            <select 
              className="form-select"
              value={filtro.estado}
              onChange={(e) => setFiltro({...filtro, estado: e.target.value})}
            >
              <option value="todos">Todos los estados</option>
              <option value="Aprobado">Aprobados</option>
              <option value="Rechazado">Rechazados</option>
            </select>
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label small text-muted mb-0">Desde</label>
            <input 
              type="date" 
              className="form-control" 
              placeholder="Fecha inicio"
              value={filtro.fechaInicio}
              onChange={(e) => setFiltro({...filtro, fechaInicio: e.target.value})}
              title="Mostrar documentos desde esta fecha"
            />
            <small className="form-text text-muted">Fecha inicial</small>
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label small text-muted mb-0">Hasta</label>
            <input 
              type="date" 
              className="form-control" 
              placeholder="Fecha fin"
              value={filtro.fechaFin}
              onChange={(e) => setFiltro({...filtro, fechaFin: e.target.value})}
              title="Mostrar documentos hasta esta fecha"
            />
            <small className="form-text text-muted">Fecha final</small>
          </div>
          <div className="col-md-2">
            <button 
              className="btn btn-outline-secondary w-100"
              onClick={limpiarFiltros}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Revisado por</th>
                <th>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              {documentosFiltrados.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.estudiante}</td>
                  <td>{doc.documento}</td>
                  <td>{doc.fecha}</td>
                  <td>
                    <span className={`badge ${
                      doc.estado === 'Aprobado' ? 'bg-success' : 'bg-danger'
                    }`}>
                      {doc.estado}
                    </span>
                  </td>
                  <td>{doc.revisadoPor}</td>
                  <td>{doc.comentarios}</td>
                </tr>
              ))}
              {documentosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-3">
                    No se encontraron registros que coincidan con los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GestionDocumentos = () => {
  const [pestañaActiva, setPestañaActiva] = useState('configuracion');

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gestión de Documentos</h2>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${pestañaActiva === 'configuracion' ? 'active' : ''}`}
            onClick={() => setPestañaActiva('configuracion')}
          >
            <i className="bi bi-gear me-1"></i> Configuración
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${pestañaActiva === 'revision' ? 'active' : ''}`}
            onClick={() => setPestañaActiva('revision')}
          >
            <i className="bi bi-clipboard-check me-1"></i> Revisión
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${pestañaActiva === 'historial' ? 'active' : ''}`}
            onClick={() => setPestañaActiva('historial')}
          >
            <i className="bi bi-clock-history me-1"></i> Historial
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {pestañaActiva === 'configuracion' && <ConfiguracionDocumentos />}
        {pestañaActiva === 'revision' && <RevisionDocumentos />}
        {pestañaActiva === 'historial' && <HistorialDocumentos />}
      </div>
    </div>
  );
};

export default GestionDocumentos;
