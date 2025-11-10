import React, { useState } from "react";

export default function UtilitiesLetterhead(){
  const [empresa, setEmpresa] = useState({ nombre:"", representante:"", puesto:"" });

  const generar = (e)=>{
    e.preventDefault();
    const blob = new Blob([`Carta membretada\nEmpresa: ${empresa.nombre}\nRepresentante: ${empresa.representante}\nPuesto: ${empresa.puesto}`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "carta_membretada.pdf"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <h2 className="mb-3">Utilerías: Membretar carta</h2>
      <form className="card p-3" onSubmit={generar}>
        <div className="row g-2">
          <div className="col"><input className="form-control" placeholder="Empresa" value={empresa.nombre} onChange={e=>setEmpresa({...empresa, nombre:e.target.value})}/></div>
          <div className="col"><input className="form-control" placeholder="Representante" value={empresa.representante} onChange={e=>setEmpresa({...empresa, representante:e.target.value})}/></div>
          <div className="col"><input className="form-control" placeholder="Puesto" value={empresa.puesto} onChange={e=>setEmpresa({...empresa, puesto:e.target.value})}/></div>
          <div className="col-auto"><button className="btn btn-primary">Generar PDF</button></div>
        </div>
      </form>
    </div>
  );
}