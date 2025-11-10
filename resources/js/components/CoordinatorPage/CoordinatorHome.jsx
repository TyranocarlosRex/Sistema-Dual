import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CoordinatorHome = () => {
  const [coordinator, setCoordinator] = useState(() => {
    const raw = localStorage.getItem('coordinator');
    return raw ? JSON.parse(raw) : null;
  });

  const [userEmail, setUserEmail] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).email : '';
  });

  const [stats, setStats] = useState({
    students: 0,
    activeProcesses: 0,
    pendingDocuments: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/coordinator/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(({ data }) => {
      if (data?.coordinator) {
        setCoordinator(data.coordinator);
        localStorage.setItem('coordinator', JSON.stringify(data.coordinator));
      }
      if (data?.user?.email) {
        setUserEmail(data.user.email);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    })
    .catch(error => console.error('Error al cargar datos:', error));

    setStats({
      students: 45,
      activeProcesses: 12,
      pendingDocuments: 7
    });
  }, []);

  if (!coordinator) {
    return (
      <div className="p-6 text-center">
        <p>Cargando información del coordinador...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {}
      <div className="bg-white p-4 mb-4 rounded shadow">
        <h1 className="text-2xl font-bold">
          Bienvenido, {coordinator.Nombre || 'Coordinador'}
        </h1>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded border border-blue-100">
          <h3 className="font-medium text-gray-700">Estudiantes</h3>
          <p className="text-2xl font-bold">{stats.students}</p>
        </div>
        <div className="bg-green-50 p-4 rounded border border-green-100">
          <h3 className="font-medium text-gray-700">Procesos Activos</h3>
          <p className="text-2xl font-bold">{stats.activeProcesses}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
          <h3 className="font-medium text-gray-700">Documentos Pendientes</h3>
          <p className="text-2xl font-bold">{stats.pendingDocuments}</p>
        </div>
      </div>

      {}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Correo Electrónico</label>
            <div className="p-2 bg-gray-50 rounded border">
              {userEmail || 'No especificado'}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
            <div className="p-2 bg-gray-50 rounded border">
              {coordinator.Telefono || 'No especificado'}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="space-y-2">
          <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
            Ver Estudiantes
          </button>
          <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
            Revisar Documentos
          </button>
          <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorHome;