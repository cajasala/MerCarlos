import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import './AdminProductUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const AdminProductUpload = () => {
    const [file, setFile] = useState(null);
    const [tiendaId, setTiendaId] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus({ type: '', msg: '' });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !tiendaId) {
            setStatus({ type: 'error', msg: 'Selecciona archivo y tienda.' });
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tiendaId', tiendaId);

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(`${API_URL}/api/admin/upload-products-csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            setStatus({
                type: data.errors > 0 ? 'warn' : 'success',
                msg: `${data.upserted || 0} productos procesados. ${data.errors > 0 ? `${data.errors} filas con error.` : 'Sin errores.'}`,
            });
            setFile(null);
        } catch (err) {
            const detail = err.response?.data || 'Error desconocido.';
            setStatus({ type: 'error', msg: typeof detail === 'string' ? detail : detail.body || 'Error al procesar el CSV.' });
        } finally { setLoading(false); }
    };

    return (
        <div className="admin-product-upload animate-fade-in">
            <form onSubmit={handleUpload} className="card send-form">
                <div className="admin-input-group">
                    <label>ID de la Tienda</label>
                    <input type="number" placeholder="Ej: 1" value={tiendaId}
                        onChange={e => setTiendaId(e.target.value)} required />
                </div>
                <div className={`drop-zone ${file ? 'has-file' : ''}`}>
                    <input type="file" accept=".csv" onChange={handleFileChange} id="prod-csv-upload" hidden />
                    <label htmlFor="prod-csv-upload" className="drop-zone-content">
                        <FileSpreadsheet size={48} className="upload-icon" />
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
                <div className="csv-hint">
                    <h4><HelpCircle size={16} /> Columnas del CSV</h4>
                    <div className="col-grid">
                        <div className="col-required">
                            <strong>Obligatorias:</strong>
                            <code>SKU, Nombre, Descripcion, UnidadMedidaBase, CantidadUnidadBase, LocalCategoriaID, LocalSubCategoriaID</code>
                        </div>
                    </div>
                </div>
                {status.msg && (
                    <div className={`status-alert ${status.type}`}>
                        {status.type === 'success' ? <CheckCircle size={18} /> : status.type === 'warn' ? <AlertCircle size={18} /> : <AlertCircle size={18} />}
                        <span>{status.msg}</span>
                    </div>
                )}
                <button className="btn btn-secondary btn-full" disabled={loading || !file}>
                    {loading ? 'Procesando...' : 'Cargar Maestro de Productos'}
                </button>
            </form>
        </div>
    );
};

export default AdminProductUpload;
