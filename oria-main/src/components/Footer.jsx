import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';
import PWAInstallButton from '../pwa/PWAInstallButton';

export default function Footer({ onNavigate, user }) {
  const { t, isRtl } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 5000);
      setNewsletterEmail('');
    }
  };

  return (
    <footer style={{ background: '#09090d', borderTop: '1px solid var(--border-gold)', marginTop: '80px', color: 'var(--text-gray)' }}>
      {/* Guarantees Ribbon */}
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '30px 20px', background: 'rgba(18, 18, 26, 0.6)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>✨</span>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>Première Main Certifiée</h4>
              <p style={{ fontSize: '0.8rem' }}>Bijoux neufs direct bijouteries avec poinçon officiel</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>♻️</span>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>Seconde Main Expertisée</h4>
              <p style={{ fontSize: '0.8rem' }}>Authentification gemmologique & traçabilité garantie</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>🚚</span>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>Livraison Sécurisée</h4>
              <p style={{ fontSize: '0.8rem' }}>Envoi blindé et suivi en temps réel sous 24/48h</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>🛡️</span>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>Paiement Protégé</h4>
              <p style={{ fontSize: '0.8rem' }}>Paiement à la livraison ou CB 100% chiffré</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '60px 30px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
        {/* Brand Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <OriaLogo size={36} showText={true} subtitle="PREMIÈRE & SECONDE MAIN" />
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-gray)' }}>
            <strong>ORIA</strong> est la première marketplace intelligente dédiée aux bijoux neufs et de seconde main. Trouvez la pièce qui vous ressemble parmi nos collections uniques.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid var(--border-gold)', color: 'var(--light-gold)' }}>
              🇲🇦 Casablanca • Rabat • Marrakech
            </span>
            <PWAInstallButton variant="nav-item" />
          </div>
        </div>

        {/* Universes Links */}
        <div>
          <h4 style={{ color: 'var(--light-gold)', fontSize: '0.95rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Nos Univers
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
            <li><a href="#first-hand" onClick={() => onNavigate && onNavigate('first-hand')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>✨ Première Main (Neuf)</a></li>
            <li><a href="#second-hand" onClick={() => onNavigate && onNavigate('second-hand')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>♻️ Seconde Main (Occasion)</a></li>
            <li><a href="#deals" onClick={() => onNavigate && onNavigate('deals')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>🔥 Bonnes Affaires</a></li>
            <li><a href="#sell" onClick={() => onNavigate && onNavigate('sell')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>💎 Vendre mon bijou</a></li>
            <li><a href="#finder" onClick={() => onNavigate && onNavigate('finder')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>🔍 Trouver mon bijou</a></li>
          </ul>
        </div>

        {/* Categories Links */}
        <div>
          <h4 style={{ color: 'var(--light-gold)', fontSize: '0.95rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Catégories
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
            <li><span style={{ color: 'var(--text-light-gray)' }}>💍 Bagues & Solitaires</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>📿 Colliers & Pendentifs</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>🔗 Bracelets & Joncs</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>👂 Boucles d'oreilles</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>💎 Parures complètes</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>⌚ Bijoux Homme</span></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 style={{ color: 'var(--light-gold)', fontSize: '0.95rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Le Cercle Privé JEWELIA
          </h4>
          <p style={{ fontSize: '0.85rem', marginBottom: '14px', color: 'var(--text-gray)' }}>
            Recevez en avant-première les alertes pépites seconde main et les nouvelles créations joaillières.
          </p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="email"
              required
              placeholder="Votre email..."
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              className="filter-number-input"
              style={{ padding: '10px 14px' }}
            />
            <button type="submit" className="btn-jewelia-primary" style={{ padding: '10px' }}>
              Rejoindre le Cercle
            </button>
            {isSubscribed && (
              <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✨ Bienvenue dans le Cercle JEWELIA !</span>
            )}
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px 30px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-gray)' }}>
        Copyright © 2026 JEWELIA — Marketplace de Joaillerie & Bijoux. Tous droits réservés.
      </div>
    </footer>
  );
}
