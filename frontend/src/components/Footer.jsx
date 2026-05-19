import React from 'react';
import './Footer.css';

const Footer = ({ selectedStore }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-info">
          <h2 className="logo">Mer<span>Carlos</span></h2>
          <p>Tu supermercado de confianza, siempre cerca de ti.</p>
        </div>
        
        {selectedStore && selectedStore.TelefonoWhatsApp && (
          <div className="footer-contact">
            <h4>Atención al Cliente</h4>
            <a 
              href={`https://wa.me/${selectedStore.TelefonoWhatsApp.replace(/\+/g, '')}?text=Hola,%20quisiera%20hacer%20una%20consulta%20a%20MerCarlos%20${selectedStore.Nombre}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-footer-link"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="whatsapp-footer-icon" />
              <span>Contáctanos por WhatsApp</span>
            </a>
          </div>
        )}
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} MerCarlos. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
