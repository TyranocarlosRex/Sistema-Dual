import React, { useState } from "react";

export default function UtilitiesLetterhead() {
  const [empresa, setEmpresa] = useState({
    nombre: "",
    representante: ""
  });

  const generarPDF = (evento) => {
    evento.preventDefault();
    console.log('Función de generación de PDF deshabilitada temporalmente');
  };

  const actualizarCampo = (campo, valor) => {
    setEmpresa({
      ...empresa,
      [campo]: valor
    });
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h2 className="h4 mb-0">Generar Carta Membretada</h2>
        </div>
        <div className="card-body">
          <form onSubmit={generarPDF} className="needs-validation" noValidate>
            <div className="mb-3">
              <label className="form-label">Nombre de la Empresa</label>
              <input 
                type="text" 
                className="form-control" 
                value={empresa.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Nombre del Representante</label>
              <input 
                type="text" 
                className="form-control" 
                value={empresa.representante}
                onChange={(e) => actualizarCampo('representante', e.target.value)}
              />
            </div>
            
            <button type="submit" className="btn btn-primary">
              Generar Carta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}