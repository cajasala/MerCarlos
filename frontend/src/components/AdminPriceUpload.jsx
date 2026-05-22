import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import './AdminPriceUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const AdminPriceUpload = () => {
    const [file, setFile] = useState(null);
    const [tiendaId, setTiendaId] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        try {
            const file = e.target.files[0];
            if (!file) {
                setStatus({ type: '', msg: '' });
                return;
            }
            
            setFile(file);
            
            // Simple validation for now - just check if it's a CSV
            if (!file.name.toLowerCase().endsWith('.csv')) {
                setStatus({ type: 'error', msg: 'Por favor seleccione un archivo CSV' });
                setFile(null);
                return;
            }
            
            setStatus({ type: 'success', msg: 'Archivo CSV seleccionado correctamente' });
        } catch (err) {
            setStatus({ type: 'error', msg: 'Error al procesar el archivo' });
            setFile(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !tiendaId) {
            setStatus({ type: 'error', msg: 'Selecciona archivo y tienda.' });
            return;
        }
        
        // Prevent upload if there's a validation error
        if (status.type === 'error') {
            return;
        }
        
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tiendaId', tiendaId);

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(`${API_URL}/mng/upload-csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            setStatus({
                type: data.errors > 0 ? 'warn' : 'success',
                msg: `${data.upserted || 0} precios procesados. ${data.errors > 0 ? `${data.errors} filas con error.` : 'Sin errores.'}`,
            });
            setFile(null);
        } catch (err) {
            const detail = err.response?.data || 'Error desconocido.';
            setStatus({ type: 'error', msg: typeof detail === 'string' ? detail : detail.body || 'Error al procesar el CSV.' });
        } finally { setLoading(false); }
    };

    return (
        <div className="admin-price-upload animate-fade-in">
            <form onSubmit={handleUpload} className="card send-form">
                <div className="admin-input-group">
                    <label>ID de la Tienda</label>
                    <input type="number" placeholder="Ej: 1" value={tiendaId}
                        onChange={e => setTiendaId(e.target.value)} required />
                </div>
                <div className={`drop-zone ${file ? 'has-file' : ''}`}>
                    <input type="file" accept=".csv" onChange={handleFileChange} id="price-csv-upload" hidden />
                    <label htmlFor="price-csv-upload" className="drop-zone-content">
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
                    <h4><HelpCircle size={16} /> Columnas del CSV (Todas Obligatorias)</h4>
                    <div className="col-grid">
                        <div className="col-required">
                            <strong>Columnas:</strong>
                            <code>SKU, PrecioRegular, PrecioPromocion, EsPromocion</code>
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
                    {loading ? 'Procesando...' : 'Cargar Precios'}
                </button>
            </form>
        </div>
    );
};

export default AdminPriceUpload;