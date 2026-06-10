import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, ShieldAlert } from 'lucide-react';
import './AdminLogin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const AdminLogin = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('ddddd');
      const res = await axios.post(`${API_URL}/mng/login`, formData);
      console.log('Login response:', res.data);
      onLoginSuccess(res.data);
     } catch (err) {
       console.log(err);
       if (err.response && err.response.status === 401) {
         setError('Credenciales de administrador inválidas.');
       } else {
         setError('Error al intentar iniciar sesión. Por favor, intente de nuevo.');
       }
     } finally {
       setLoading(false);
     }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card card animate-fade-in">
        <div className="admin-login-header">
          <ShieldAlert size={48} className="text-secondary" />
          <h2>MerCarlos Admin</h2>
          <p>Acceso restringido para administradores</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              name="username"
              placeholder="Usuario"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-secondary btn-full" disabled={loading}>
            {loading ? 'Validando...' : 'Entrar al Panel'}
          </button>
        </form>

        <button className="btn-link" onClick={() => window.location.href = '/'}>
          Volver a la tienda
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
