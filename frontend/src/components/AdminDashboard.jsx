import React from 'react';
import axios from 'axios';
import { LayoutGrid, Database, Upload, FileText, Image, LogOut } from 'lucide-react';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

/** Decode role from JWT stored in localStorage */
function getAdminRole() {
    const token = localStorage.getItem('adminToken');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || null; // 'ADM' | 'PED' | 'EDI'
    } catch { return null; }
}

const ROLE_PERMISSIONS = {
    ADM: ['prices', 'orders', 'bulkProducts', 'productImages'],
    PED: ['prices', 'orders', 'bulkProducts'],
    EDI: ['prices', 'bulkProducts', 'productImages'],
};

const NAV_ITEMS = [
    { id: 'prices',     label: 'Carga Masiva',     icon: Database,  roles: ['ADM', 'PED', 'EDI'] },
    { id: 'bulkProducts', label: 'Carga Masiva\nMaestro', icon: Upload,  roles: ['ADM', 'PED', 'EDI'] },
    { id: 'orders',     label: 'Pedidos',           icon: FileText,  roles: ['ADM', 'PED']       },
    { id: 'productImages', label: 'Imágenes\nProductos', icon: Image,  roles: ['ADM', 'EDI']       },
];

const VIEW_TITLES = {
    prices:     { title: 'Carga Masiva de Precios',     desc: 'Actualiza los precios de una tienda subiendo un archivo CSV.' },
    bulkProducts: { title: 'Carga Masiva — Maestro de Productos', desc: 'Carga nuevos productos o actualiza existentes desde un archivo CSV.' },
    orders:     { title: 'Gestión de Pedidos',            desc: 'Consulta y actualiza el estado de los pedidos.' },
    productImages: { title: 'Imágenes de Productos', desc: 'Sube y gestiona las fotos de catálogo de tus productos.' },
};

const AdminDashboard = ({ activeView = 'prices', onViewChange, children, onLogout }) => {
    const role = getAdminRole();
    const allowed = role ? (ROLE_PERMISSIONS[role] || []) : [];

    return (
        <div className="admin-layout animate-fade-in">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <LayoutGrid size={24} className="text-secondary" />
                    <h2>MerCarlos Admin</h2>
                </div>
                <nav className="admin-nav">
                    {NAV_ITEMS.filter(item => allowed.includes(item.id)).map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => onViewChange(item.id)}
                        >
                            {React.createElement(item.icon, { size: 20 })}
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <button className="admin-logout" onClick={onLogout}>
                    <LogOut size={20} /> Cerrar Sesión
                </button>
            </aside>

            <main className="admin-main">
                {activeView && VIEW_TITLES[activeView] && (
                    <header className="admin-topbar">
                        <h1>{VIEW_TITLES[activeView].title}</h1>
                        <p>{VIEW_TITLES[activeView].desc}</p>
                    </header>
                )}
                <section className="admin-section">
                    {children}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
