import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, CheckCircle, AlertCircle, ChevronDown, LogOut } from 'lucide-react';
import './AdminOrders.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const STATUS_CONFIG = {
    'Recibido':    { icon: Clock,  color: 'status-received',  bg: '#fef3c7', fg: '#92400e' },
    'Alistamiento':{ icon: Clock,  color: 'status-prepping',  bg: '#dbeafe', fg: '#1e40af' },
    'Despachado':  { icon: Package, color: 'status-despatch', bg: '#f3e8ff', fg: '#6b21a8' },
    'Entregado':   { icon: CheckCircle, color: 'status-delivered', bg: '#d1fae5', fg: '#065f46' },
    'Cancelado':   { icon: AlertCircle, color: 'status-cancelled', bg: '#fee2e2', fg: '#991b1b' },
};

const ALL_TRANSITIONS = ['Recibido', 'Alistamiento', 'Despachado', 'Entregado', 'Cancelado'];

const AdminOrdersView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await axios.get(`${API_URL}/api/admin/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data || []);
        } catch (err) {
            console.error('Error fetching admin orders', err);
        } finally { setLoading(false); }
    };

    const handleStatusChange = async (orderId, newStatusName) => {
        if (newStatusName === 'Cancelado' && !window.confirm(`¿Estás seguro de que deseas cancelar el pedido #${orderId}?`)) {
            fetchOrders(); // reset select to current value
            return;
        }
        setUpdatingId(orderId);
        const token = localStorage.getItem('adminToken');
        try {
            await axios.post(`${API_URL}/api/admin/orders/${orderId}/status`,
                { statusName: newStatusName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchOrders();
        } catch (err) {
            alert(err.response?.data || 'Error al actualizar el estado.');
        } finally { setUpdatingId(null); }
    };

    if (loading) return <div className="loading-state">Cargando pedidos...</div>;

    return (
        <div className="admin-orders-view animate-fade-in">
            <div className="orders-table-wrapper">
                <table className="admin-orders-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Tienda</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan={6} className="empty-row">No hay pedidos registrados.</td></tr>
                        ) : orders.map(order => {
                            const sc = STATUS_CONFIG[order.StatusNombre] || STATUS_CONFIG.Recibido;
                            const IconCmp = sc.icon;
                            const isCancelled = order.StatusNombre === 'Cancelado';
                            return (
                                <tr key={order.OrdenID} className={isCancelled ? 'row-cancelled' : ''}>
                                    <td className="cell-id">#{order.OrdenID}</td>
                                    <td>Cliente {order.ClienteID}</td>
                                    <td>{order.TiendaNombre || `Tienda ${order.TiendaID}`}</td>
                                    <td>${order.Total?.toLocaleString?.() || order.Total}</td>
                                    <td>
                                        <span className={`adm-status-badge adm-status-${sc.color}`} style={{ backgroundColor: sc.bg, color: sc.fg }}>
                                            <IconCmp size={14} /> {order.StatusNombre}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="status-dropdown-wrapper">
                                            <select
                                                className="status-select"
                                                value={order.StatusNombre}
                                                onChange={e => handleStatusChange(order.OrdenID, e.target.value)}
                                                disabled={updatingId === order.OrdenID}
                                            >
                                                {ALL_TRANSITIONS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            {updatingId === order.OrdenID && (
                                                <span className="spinner-tiny">⟳</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrdersView;
