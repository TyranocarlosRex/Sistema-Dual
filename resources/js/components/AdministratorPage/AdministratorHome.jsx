import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdministratorHome = () => {
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem('admin');
    return raw ? JSON.parse(raw) : null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).email : '';
  });

  useEffect(() => {
    // Refresca desde el backend (por si los datos cambiaron)
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(({ data }) => {
      if (data?.admin) {
        setAdmin(data.admin);
        localStorage.setItem('admin', JSON.stringify(data.admin));
      }
      if (data?.user?.email) {
        setUserEmail(data.user.email);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    })
    .catch(() => {/* silenciar o mostrar toast */});
  }, []);

  if (!admin) {
    return <div className="p-6"> </div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl">
        Bienvenido, {admin.name}
      </h2>

      <div>
        <label className="block mb-1">Correo</label>
        <input
          type="text"
          readOnly
          value={userEmail || ''}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded">
        
      </div>
    </div>
  );
};

export default AdministratorHome;