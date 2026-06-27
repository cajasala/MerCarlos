import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import './Cart.css';

const Cart = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemove, onCheckout }) => {
  if (!isOpen) return null;

  const defaultImage = `${import.meta.env.BASE_URL}default-product.svg`;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultImage;
  };

  const total = cartItems.reduce((acc, item) => {
    const price = item.EsPromocion ? item.PrecioPromocion : item.PrecioRegular;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <div className="cart-overlay animate-fade-in">
      <div className="cart-container animate-slide-in">
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingBag size={24} />
            <h2>Tu Canastilla</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={64} className="empty-icon" />
              <p>Tu canastilla está vacía</p>
              <button className="btn btn-primary" onClick={onClose}>Ir a comprar</button>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.ProductoID} className="cart-item">
                  <img 
                    src={item.ImagenURL || defaultImage} 
                    alt={item.Nombre} 
                    className="cart-item-img" 
                    onError={handleImageError}
                  />
                  <div className="cart-item-info">
                    <h4>{item.Nombre}</h4>
                    <p className="cart-item-unit">{item.DisplayPrecioPorUnidad}</p>
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button onClick={() => onUpdateQuantity(item.ProductoID, item.quantity - 1)} disabled={item.quantity <= 1}>
                          <Minus size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.ProductoID, item.quantity + 1)}>
                          <Plus size={16} />
                        </button>
                      </div>
                      <button className="remove-btn" onClick={() => onRemove(item.ProductoID)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">
                    ${((item.EsPromocion ? item.PrecioPromocion : item.PrecioRegular) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="total-section">
              <span>Total a pagar</span>
              <span className="total-amount">${total.toLocaleString()}</span>
            </div>
            <button className="btn btn-secondary btn-lg btn-checkout" onClick={onCheckout}>
              Continuar al pago
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
