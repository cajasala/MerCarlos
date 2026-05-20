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

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        setFile(file);
        setStatus({ type: '', msg: '' });
        
        if (!file) {
            return;
        }
        
        // Validate CSV file
        try {
            const text = await file.text();
            const lines = text.trim().split('\n');
            if (lines.length === 0) {
                setStatus({ type: 'error', msg: 'El archivo CSV está vacío.' });
                setFile(null);
                return;
            }
            
            const headers = lines[0].trim().split(',').map(h => h.trim());
            const requiredColumns = ['SKU', 'PrecioRegular', 'PrecioPromocion', 'EsPromocion'];
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            
            if (missingColumns.length > 0) {
                setStatus({ type: 'error', msg: `Columnas obligatorias faltantes: ${missingColumns.join(', ')}` });
                setFile(null);
                return;
            }
            
            // Validate data types in rows (skip header)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Skip empty lines
                
                const values = line.split(',').map(v => v.trim());
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index] || '';
                });
                
                // Validate SKU
                if (!rowData.SKU || rowData.SKU.trim() === '') {
                    setStatus({ type: 'error', msg: `Fila ${i + 1}: SKU no puede estar vacío` });
                    setFile(null);
                    return;
                }
                
                // Validate PrecioRegular
                if (!rowData.PrecioRegular || isNaN(parseFloat(rowData.PrecioRegular))) {
                    setStatus({ type: 'error', msg: `Fila ${i + 1}: PrecioRegular debe ser un número válido` });
                    setFile(null);
                    return;
                }
                
                // Validate PrecioPromocion
                if (!rowData.PrecioPromocion && rowData.PrecioPromocion !== '0') {
                    setStatus({ type: 'error', msg: `Fila ${i + 1}: PrecioPromocion es requerido y debe ser un número válido` });
                    setFile(null);
                    return;
                }
                if (rowData.PrecioPromocion !== '' && isNaN(parseFloat(rowData.PrecioPromocion))) {
                    setStatus({ type: 'error', msg: `Fila ${i + 1}: PrecioPromocion debe ser un número válido` });
                    setFile(null);
                    return;
                }
                
                // Validate EsPromocion
                if (rowData.EsPromocion !== '0' && rowData.EsPromocion !== '1') {
                    setStatus({ type: 'error', msg: `Fila ${i + 1}: EsPromocion debe ser 0 o 1` });
                    setFile(null);
                    return;
                }
            }
            
            setStatus({ type: 'success', msg: 'Archivo CSV válido - todas las columnas obligatorias presentes y tipos de datos correctos' });
        } catch (err) {
            setStatus({ type: 'error', msg: 'Error al leer el archivo CSV' });
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
            const res = await axios.post(`${API_URL}/api/admin/upload-prices-csv`, formData, {
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