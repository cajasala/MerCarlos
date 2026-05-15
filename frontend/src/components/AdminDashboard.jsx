import React, { useState } from 'react';
import axios from 'axios';
import { LayoutGrid, Upload, Database, FileText, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const AdminDashboard = ({ onLogout }) => {
  const [file, setFile] = useState(null);
  const [tiendaId, setTiendaId] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus({ type: '', message: '' });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !tiendaId) {
      setStatus({ type: 'error', message: 'Por favor selecciona un archivo y una tienda.' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tiendaId', tiendaId);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_URL}/admin/upload-csv`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setStatus({ type: 'success', message: res.data.message });
      setFile(null);
    } catch (err) {
      setStatus({ type: 'error', message: 'Error al procesar el archivo CSV.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout animate-fade-in">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <LayoutGrid size={24} className="text-secondary" />
          <h2>MerCarlos Admin</h2>
        </div>
        <nav className="admin-nav">
          <button className="nav-item active"><Database size={20} /> Carga Masiva</button>
          <button className="nav-item"><FileText size={20} /> Pedidos</button>
        </nav>
        <button className="admin-logout" onClick={onLogout}>
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1>Carga Masiva de Precios</h1>
          <p>Actualiza los precios de una tienda subiendo un archivo CSV.</p>
        </header>

        <section className="admin-section">
          <div className="upload-container card">
            <form onSubmit={handleUpload}>
              <div className="admin-input-group">
                <label>ID de la Tienda</label>
                <input 
                  type="number" 
                  placeholder="Ej: 1" 
                  value={tiendaId}
                  onChange={(e) => setTiendaId(e.target.value)}
                  required
                />
              </div>

              <div className={`drop-zone ${file ? 'has-file' : ''}`}>
                <input type="file" accept=".csv" onChange={handleFileChange} id="csv-upload" hidden />
                <label htmlFor="csv-upload" className="drop-zone-content">
                  <Upload size={48} className="upload-icon" />
                  {file ? (
                    <div className="file-info">
                      <strong>{file.name}</strong>
                      <span>{(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                  ) : (
                    <div className="upload-text">
                      <strong>Selecciona un archivo CSV</strong>
                      <span>o arrastra y suelta aquí</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="csv-template-info">
                <h4>Formato requerido:</h4>
                <code>SKU, PrecioRegular, PrecioPromocion, EsPromocion</code>
                <p>Usa 1 para EsPromocion = verdadero, 0 para falso.</p>
              </div>

              {status.message && (
                <div className={`status-alert ${status.type}`}>
                  {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{status.message}</span>
                </div>
              )}

              <button className="btn btn-secondary btn-full" disabled={loading || !file}>
                {loading ? 'Procesando...' : 'Iniciar Carga'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
