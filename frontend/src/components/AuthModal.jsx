import React, { useState } from 'react';
import axios from 'axios';
import { X, Smartphone, User, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import './AuthModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP/Details
  const [formData, setFormData] = useState({
    telefono: '',
    code: '',
    nombre: '',
    apellido: '',
    email: '',
    codigoFidelizacion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/auth/request-otp`, { telefono: formData.telefono });
      setStep(2);
    } catch (err) {
      setError('Error enviando el código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, formData);
      onLoginSuccess(res.data);
      onClose();
    } catch (err) {
      setError('Código inválido o error en el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay auth-overlay">
      <div className="modal-content auth-content animate-fade-in">
        <div className="auth-header">
          <h2>{step === 1 ? 'Bienvenido' : 'Verifica tu cuenta'}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="auth-body">
          {error && <div className="auth-error">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="auth-form">
              <p>Ingresa tu número de celular para continuar</p>
              <div className="input-group">
                <Smartphone size={20} className="input-icon" />
                <input 
                  type="tel" 
                  name="telefono"
                  placeholder="Número de Celular" 
                  value={formData.telefono}
                  onChange={handleChange}
                  required 
                />
              </div>
              <button className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Recibir Código'}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="auth-form scrollable">
              <p>Hemos enviado un código a <strong>{formData.telefono}</strong></p>
              
              <div className="input-group">
                <ShieldCheck size={20} className="input-icon" />
                <input 
                  type="text" 
                  name="code"
                  placeholder="Código de 6 dígitos" 
                  value={formData.code}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="registration-fields">
                <p className="section-label">Completa tu perfil (Primera vez)</p>
                <div className="input-row">
                  <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input name="nombre" placeholder="Nombre" onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <input name="apellido" placeholder="Apellido" onChange={handleChange} required />
                  </div>
                </div>
                <div className="input-group">
                  <Mail size={18} className="input-icon" />
                  <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <input name="codigoFidelizacion" placeholder="Código de Fidelización (Opcional)" onChange={handleChange} />
                </div>
              </div>

              <button className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Completar Registro'}
              </button>
              <button type="button" className="btn-link" onClick={() => setStep(1)}>
                Cambiar número de celular
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
