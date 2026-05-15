import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, CheckCircle, ChevronRight, ShoppingBag } from 'lucide-react';
import './OrdersView.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Cargando tus pedidos...</div>;

  return (
    <div className="orders-container animate-fade-in">
      <div className="orders-header">
        <Package size={28} className="text-primary" />
        <h2>Mis Pedidos</h2>
      </div>

      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map(order => (
            <div key={order.OrdenID} className="order-card card">
              <div className="order-main-info">
                <div className="order-icon-bg">
                  <ShoppingBag size={24} />
                </div>
                <div className="order-meta">
                  <div className="order-id-row">
                    <span className="order-id">Pedido #{order.OrdenID}</span>
                    <span className={`status-badge status-${order.StatusID}`}>
                      {order.StatusNombre}
                    </span>
                  </div>
                  <p className="order-date">{new Date(order.FechaOrden).toLocaleDateString()} - {new Date(order.FechaOrden).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              
              <div className="order-footer">
                <div className="order-total">
                  <span>Total</span>
                  <strong>${order.Total.toLocaleString()}</strong>
                </div>
                <button className="btn btn-outline" onClick={() => console.log('View order items')}>
                  Ver Detalle
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-orders">
            <Package size={64} className="placeholder-icon" />
            <p>Aún no has realizado pedidos.</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
              Empezar a comprar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersView;
