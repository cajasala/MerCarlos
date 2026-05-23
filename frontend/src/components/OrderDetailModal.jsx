import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MessageCircle, Copy, AlertCircle } from 'lucide-react';
import './OrderDetailModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const OrderDetailModal = ({ orderId, onClose }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/api/admin/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrder(res.data);
        } catch (err) {
            console.error('Error fetching order detail', err);
            setError('No se pudo cargar el detalle del pedido.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target.classList.contains('order-detail-overlay')) {
            onClose();
        }
    };

    const handleWhatsApp = () => {
        if (!order || !order.Telefono) return;
        const phone = order.Telefono.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
    };

    const formatMessage = () => {
        if (!order) return '';
        const itemsText = order.items.map((item, idx) => 
            `${idx + 1}. ${item.ProductoNombre} x${item.Cantidad} = $${item.PrecioUnitario.toLocaleString()}`
        ).join('\n');

        return `🛒 PEDIDO #${order.OrdenID}
👤 Cliente: ${order.Nombre} ${order.Apellido}
📞 Teléfono: ${order.Telefono}
${order.Email ? `📧 Email: ${order.Email}\n` : ''}───────────────────────────
FECHA: ${new Date(order.FechaOrden).toLocaleString('es-CO', {dateStyle: 'short', timeStyle: 'short'})}
ESTADO: ${order.StatusNombre}
TIENDA: ${order.TiendaNombre}
───────────────────────────
ARTÍCULOS:
${itemsText}
───────────────────────────
💰 TOTAL: $${order.Total.toLocaleString()}`;
    };

    const handleCopy = async () => {
        const text = formatMessage();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            alert('No se pudo copiar automáticamente. Copialo manualmente.');
        }
    };

    if (!orderId) return null;

    return (
        <div className="order-detail-overlay" onClick={handleBackdropClick}>
            <div className="order-detail-modal-content animate-fade-in">
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>
                
                {loading ? (
                    <div className="modal-loading">
                        <div className="spinner"></div>
                        <p>Cargando detalle...</p>
                    </div>
                ) : error ? (
                    <div className="modal-error">
                        <AlertCircle size={48} className="error-icon" />
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchOrder}>Reintentar</button>
                    </div>
                ) : order ? (
                    <>
                        <div className="modal-header">
                            <h2># {order.OrdenID}</h2>
                            <span className="badge-status">{order.StatusNombre}</span>
                        </div>
                        
                        <div className="modal-body">
                            <div className="modal-section">
                                <h3>CLIENTE</h3>
                                <p><strong>Nombre:</strong> {order.Nombre} {order.Apellido}</p>
                                <p><strong>Teléfono:</strong> {order.Telefono}</p>
                                {order.Email && <p><strong>Email:</strong> {order.Email}</p>}
                            </div>

                            <div className="modal-section">
                                <h3>INFO PEDIDO</h3>
                                <p><strong>Fecha:</strong> {new Date(order.FechaOrden).toLocaleString('es-CO', {dateStyle: 'short', timeStyle: 'short'})}</p>
                                <p><strong>Tienda:</strong> {order.TiendaNombre}</p>
                                {order.TelefonoWhatsApp && <p><strong>WhatsApp Tienda:</strong> {order.TelefonoWhatsApp}</p>}
                            </div>

                            <div className="modal-section">
                                <h3>ARTÍCULOS</h3>
                                {order.items && order.items.length > 0 ? (
                                    <ul className="items-list">
                                        {order.items.map((item, idx) => (
                                            <li key={idx}>
                                                <span className="item-name">{item.ProductoNombre}</span>
                                                <span className="item-qty">x{item.Cantidad}</span>
                                                <span className="item-price">${item.PrecioUnitario.toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-items">No hay artículos en este pedido.</p>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <div className="modal-total">
                                <strong>TOTAL:</strong> ${order.Total.toLocaleString()}
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={handleCopy}>
                                    <Copy size={16} /> {copied ? '¡Copiado!' : 'Copiar mensaje'}
                                </button>
                                <button 
                                    className="btn btn-primary whatsapp-btn" 
                                    onClick={handleWhatsApp}
                                    disabled={!order.Telefono}
                                >
                                    <MessageCircle size={16} /> Abrir WhatsApp
                                </button>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default OrderDetailModal;
