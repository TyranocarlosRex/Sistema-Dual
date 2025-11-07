import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminHome = () => {
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem('admin');
    return raw ? JSON.parse(raw) : null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).email : '';
  });

  return (
    <h1 className="p-6 text-3xl">
      Pelenme la banana
    </h1>
  );
};

export default AdminHome;