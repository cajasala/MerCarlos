import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image, Plus, Trash2, Camera, CheckCircle } from 'lucide-react';
import './AdminProductImages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const AdminProductImages = ({ productId }) => {
    const [images, setImages] = useState([]);
    const [productIdInput, setProductIdInput] = useState(productId || '');
    const [selectedProductId, setSelectedProductId] = useState(productId || null);
    const [file, setFile] = useState(null);
    const [isCover, setIsCover] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (selectedProductId) fetchImages();
    }, [selectedProductId]);

     const fetchImages = async () => {
         const token = localStorage.getItem('adminToken');
         try {
             const res = await axios.get(
                  `${API_URL}/api/admin/products/${selectedProductId}/images`,
                  { headers: { Authorization: `Bearer ${token}` } }
              );
             setImages(res.data || []);
         } catch (err) {
             console.error('Error fetching images:', err);
             if (err.response?.status === 401) {
                 alert('Tu sesión ha expirado o el token es inválido. Por favor cierra sesión y vuelve a entrar.');
             } else {
                 alert('Error al cargar las imágenes.');
             }
         }
     };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !selectedProductId) return;
        setUploading(true);
        setMessage({ type: '', text: '' });

        const token = localStorage.getItem('adminToken');
        const formData = new FormData();
        formData.append('image', file);
        formData.append('esPortada', isCover);

        try {
            const res = await axios.post(
                `${API_URL}/api/admin/products/${selectedProductId}/images`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: `Imagen subida correctamente (ID: ${res.data?.imagenId || 'n/a'})` });
            setFile(null);
            setIsCover(false);
            fetchImages();
         } catch (err) {
             console.error('Error uploading image:', err);
             let errorMessage = 'Error al subir la imagen.';
             if (err.response) {
                 errorMessage = err.response.data || err.response.statusText || errorMessage;
             } else if (err.request) {
                 errorMessage = 'No se recibió respuesta del servidor.';
             } else {
                 errorMessage = err.message;
             }
             setMessage({ type: 'error', text: errorMessage });
         } finally { setUploading(false); }
    };

    const handleDelete = async (imagenId) => {
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(
                `${API_URL}/api/admin/products/${selectedProductId}/images/${imagenId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchImages();
        } catch (err) {
            alert(err.response?.data || 'Error al eliminar la imagen.');
        }
    };

    return (
        <div className="admin-product-images animate-fade-in">
            <div className="img-product-selector">
                <label>ID del Producto</label>
                <input
                    type="number"
                    placeholder="Ej: 1"
                    value={productIdInput}
                    onChange={e => setProductIdInput(e.target.value)}
                    onBlur={() => setSelectedProductId(parseInt(productIdInput, 10))}
                />
                <button className="btn btn-secondary" onClick={() => setSelectedProductId(parseInt(productIdInput, 10))}>
                    Buscar
                </button>
            </div>

            {selectedProductId && (
                <div className="img-upload-form card">
                    <h3><Camera size={20} /> Subir Nueva Imagen</h3>
                    <form onSubmit={handleUpload} className="upload-form-row">
                        <div className="img-drop-zone">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={e => setFile(e.target.files[0])}
                                id="img-upload-input"
                                hidden
                            />
                            <label htmlFor="img-upload-input" className="drop-zone-label">
                                {file ? (
                                    <span className="file-name"><CheckCircle size={16} /> {file.name}</span>
                                ) : (
                                    <span><Image size={32} /> Tocar para seleccionar o tomar foto</span>
                                )}
                            </label>
                        </div>

                        <label className="img-cover-check">
                            <input
                                type="checkbox"
                                checked={isCover}
                                onChange={e => setIsCover(e.target.checked)}
                            /> Es portada (sobrescribe la anterior)
                        </label>

                        <button className="btn btn-primary" type="submit" disabled={!file || uploading}>
                            {uploading ? 'Subiendo...' : 'Subir'}
                        </button>
                    </form>
                    {message.text && (
                        <div className={`status-msg status-${message.type}`}>{message.text}</div>
                    )}
                </div>
            )}

            <div className="img-grid">
                {images.length === 0 ? (
                    <p className="no-images-msg">No hay imágenes para este producto.</p>
                ) : images.map(img => (
                    <div key={img.ImagenID} className={`img-card ${img.EsPortada ? 'img-cover' : ''}`}>
                        <img src={img.ImagenURL} alt={`Producto ${img.ProductoID}`} loading="lazy" />
                        {img.EsPortada && <span className="cover-badge">PORTADA</span>}
                        <button
                            className="img-delete-btn"
                            onClick={() => handleDelete(img.ImagenID)}
                            title="Eliminar imagen"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminProductImages;
