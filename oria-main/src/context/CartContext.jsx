import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('oria_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('oria_cart', JSON.stringify(items));
  };

  const addToCart = (product, quantity = 1) => {
    const existing = cartItems.find(item => item.id === product.id);
    let newCart = [];
    const maxStock = product.stock || 99;
    if (existing) {
      const currentQty = existing.quantite || existing.quantity || 1;
      const targetQty = Math.min(maxStock, currentQty + quantity);
      newCart = cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantite: targetQty, quantity: targetQty }
          : item
      );
    } else {
      const initialQty = Math.min(maxStock, quantity);
      newCart = [...cartItems, { ...product, quantite: initialQty, quantity: initialQty }];
    }
    saveCart(newCart);
  };

  const removeFromCart = (productId) => {
    const newCart = cartItems.filter(item => item.id !== productId);
    saveCart(newCart);
  };

  const updateQuantity = (productId, qty) => {
    const targetQty = Math.max(1, qty);
    const newCart = cartItems.map(item =>
      item.id === productId ? { ...item, quantite: targetQty, quantity: targetQty } : item
    );
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => {
    const qty = item.quantite || item.quantity || 1;
    const price = typeof item.prix === 'number' ? item.prix : (parseFloat(item.prix) || 0);
    return acc + (price * qty);
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
