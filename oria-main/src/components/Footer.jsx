import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';

export default function Footer({ onNavigate, user }) {
  const { t, lang, isRtl } = useLanguage();
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

  const content = {
    fr: {
      tagline: "Première marketplace de haute joaillerie marocaine et d'enchères certifiées. Chaque pièce est poinçonnée et authentifiée par les maîtres joailliers agréés du Royaume.",
      collectionsTitle: "Collections & Joyaux",
      rings: "Bagues & Solitaires",
      necklaces: "Colliers & Pendentifs",
      bracelets: "Bracelets & Manchettes",
      earrings: "Boucles d'Oreilles",
      watches: "Montres d'Exception",
      auctions: "Enchères Privées VIP",
      servicesTitle: "Services & Garanties",
      hallmark: "Poinçon d'État Officiel",
      delivery: "Livraison Blindée 24/48h",
      sizeGuide: "Guide des Tailles & Carats",
      buyback: "Expertise & Rachat d'Or",
      concierge: "Service Conciergerie VIP",
      newsletterTitle: "Le Cercle Privé Oria",
      newsletterDesc: "Recevez en avant-première les alertes cours de l'or, invitations aux ventes privées et nouvelles collections d'artisans.",
      emailPlaceholder: "Votre adresse email...",
      joinBtn: "Rejoindre",
      subSuccess: "✨ Bienvenue dans le Cercle Privé Oria !",
      contactTitle: "Conciergerie & Horaires",
      address: "Boulevard d'Anfa, Casablanca, Maroc",
      phone: "+212 (0) 5 22 48 00 00",
      hours: "Lun - Sam : 09h00 - 20h00",
      paymentsTitle: "Paiements Sécurisés & Partenaires",
      copyright: "Copyright © 2026 ORIA Haute Joaillerie. Tous droits réservés.",
      legal: "Mentions Légales",
      privacy: "Politique de Confidentialité",
      terms: "Conditions Générales de Vente"
    },
    ar: {
      tagline: "أول منصة مغربية للمجوهرات الراقية والمزادات المعتمدة. كل قطعة مجوهرات مدموغة ومضمونة من قبل أمهر الصاغة المعتمدين في المملكة المغربية.",
      collectionsTitle: "المجموعات والجواهر",
      rings: "خواتم وسوليتير",
      necklaces: "قلادات وعقود",
      bracelets: "أساور ومحابس",
      earrings: "أقراط وحلق",
      watches: "ساعات فاخرة",
      auctions: "مزادات خاصة VIP",
      servicesTitle: "الخدمات والضمانات",
      hallmark: "الدمغة الرسمية للدولة",
      delivery: "شحن مؤمن 24/48 ساعة",
      sizeGuide: "دليل المقاسات والعيارات",
      buyback: "تقييم وشراء الذهب",
      concierge: "خدمة العملاء الخاصة VIP",
      newsletterTitle: "النادي الخاص أوريا",
      newsletterDesc: "احصل على تنبيهات أسعار الذهب الفورية ودعوات المزادات الحصرية والمجموعات الجديدة قبل الجميع.",
      emailPlaceholder: "بريدك الإلكتروني...",
      joinBtn: "انضمام",
      subSuccess: "✨ مرحباً بك في النادي الخاص أوريا !",
      contactTitle: "التواصل وساعات العمل",
      address: "شارع أنفا، الدار البيضاء، المغرب",
      phone: "+212 (0) 5 22 48 00 00",
      hours: "الإثنين - السبت : 09:00 - 20:00",
      paymentsTitle: "طرق الدفع الآمنة والشركاء",
      copyright: "جميع الحقوق محفوظة © 2026 أوريا للمجوهرات الراقية.",
      legal: "الإشعارات القانونية",
      privacy: "سياسة الخصوصية",
      terms: "الشروط العامة للبيع"
    },
    en: {
      tagline: "Morocco's premier marketplace for certified fine jewelry and live auctions. Every masterpiece is officially hallmarked and authenticated by master jewellers.",
      collectionsTitle: "Collections & Jewels",
      rings: "Rings & Solitaires",
      necklaces: "Necklaces & Pendants",
      bracelets: "Bracelets & Bangles",
      earrings: "Earrings",
      watches: "Luxury Watches",
      auctions: "VIP Live Auctions",
      servicesTitle: "Services & Guarantees",
      hallmark: "Official State Hallmark",
      delivery: "Armored Insured Delivery",
      sizeGuide: "Size & Karat Guide",
      buyback: "Gold Valuation & Appraisal",
      concierge: "VIP Concierge Service",
      newsletterTitle: "The Oria Private Circle",
      newsletterDesc: "Receive instant gold market updates, VIP auction previews and artisan collection drops.",
      emailPlaceholder: "Your email address...",
      joinBtn: "Join",
      subSuccess: "✨ Welcome to the Oria Private Circle!",
      contactTitle: "Concierge & Inquiries",
      address: "Boulevard d'Anfa, Casablanca, Morocco",
      phone: "+212 (0) 5 22 48 00 00",
      hours: "Mon - Sat: 09:00 - 20:00",
      paymentsTitle: "Secure Payments & Partners",
      copyright: "Copyright © 2026 ORIA Fine Jewelry. All rights reserved.",
      legal: "Legal Notice",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions"
    }
  };

  const f = content[lang] || content.fr;

  return (
    <footer className="oria-modern-footer">
      {/* Top Gold Border Accent */}
      <div className="footer-top-glow"></div>

      <div className="footer-container">
        {/* Main 4-Column Grid */}
        <div className="footer-main-grid">
          
          {/* Column 1: Brand & Manifesto */}
          <div className="footer-brand-column">
            <div className="footer-logo-wrapper" onClick={() => onNavigate('store')} style={{ cursor: 'pointer' }}>
              <OriaLogo size={32} subtitle="HAUTE JOAILLERIE" />
            </div>
            <p className="footer-brand-text">
              {f.tagline}
            </p>
            
            {/* Trust & Guarantee Badges */}
            <div className="footer-trust-chips">
              <span className="trust-chip">🇲🇦 Poinçon d'État</span>
              <span className="trust-chip">🔒 100% Sécurisé</span>
              <span className="trust-chip">💎 Certifié FMB</span>
            </div>
          </div>

          {/* Column 2: Collections */}
          <div className="footer-nav-column">
            <h4 className="footer-heading">{f.collectionsTitle}</h4>
            <ul className="footer-nav-list">
              <li><a href="#marketplace" onClick={(e) => { e.preventDefault(); onNavigate('store'); }}>{f.rings}</a></li>
              <li><a href="#marketplace" onClick={(e) => { e.preventDefault(); onNavigate('store'); }}>{f.necklaces}</a></li>
              <li><a href="#marketplace" onClick={(e) => { e.preventDefault(); onNavigate('store'); }}>{f.bracelets}</a></li>
              <li><a href="#marketplace" onClick={(e) => { e.preventDefault(); onNavigate('store'); }}>{f.earrings}</a></li>
              <li><a href="#marketplace" onClick={(e) => { e.preventDefault(); onNavigate('store'); }}>{f.watches}</a></li>
              <li><a href="#auctions" onClick={(e) => { e.preventDefault(); onNavigate('store'); }} style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>🔥 {f.auctions}</a></li>
            </ul>
          </div>

          {/* Column 3: Services & Guarantees */}
          <div className="footer-nav-column">
            <h4 className="footer-heading">{f.servicesTitle}</h4>
            <ul className="footer-nav-list">
              <li><a href="#" onClick={(e) => e.preventDefault()}>{f.hallmark}</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>{f.delivery}</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>{f.sizeGuide}</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>{f.buyback}</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>{f.concierge}</a></li>
              {user && (
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }} style={{ color: 'var(--light-gold)' }}>
                    👤 {t('dashboard')}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Private Circle / Newsletter & Contact */}
          <div className="footer-newsletter-column">
            <h4 className="footer-heading">👑 {f.newsletterTitle}</h4>
            <p className="footer-newsletter-desc">
              {f.newsletterDesc}
            </p>

            <form onSubmit={handleSubscribe} className="footer-newsletter-form">
              <input 
                type="email" 
                placeholder={f.emailPlaceholder}
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                required
                className="footer-input"
              />
              <button type="submit" className="footer-submit-btn">
                {f.joinBtn}
              </button>
            </form>
            {isSubscribed && <p className="footer-sub-success">{f.subSuccess}</p>}

            {/* Direct Contact Info */}
            <div className="footer-contact-info">
              <div className="footer-contact-item">
                <span className="contact-icon">📍</span>
                <span>{f.address}</span>
              </div>
              <div className="footer-contact-item">
                <span className="contact-icon">📞</span>
                <span style={{ color: 'var(--light-gold)', fontWeight: 600 }}>{f.phone}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Payment & Certification Row */}
        <div className="footer-middle-bar">
          <div className="footer-payments">
            <span className="payments-label">{f.paymentsTitle} :</span>
            <div className="payment-icons-row">
              <span className="payment-badge">💳 Carte Bancaire CMI</span>
              <span className="payment-badge">VISA</span>
              <span className="payment-badge">Mastercard</span>
              <span className="payment-badge">💵 Paiement à la Livraison</span>
              <span className="payment-badge">🛡️ Sécurité SSL 256-Bit</span>
            </div>
          </div>

          {/* Social Icons */}
          <div className="footer-social-links">
            <a href="#" className="social-pill" title="Instagram" onClick={e => e.preventDefault()}>Instagram</a>
            <a href="#" className="social-pill" title="Facebook" onClick={e => e.preventDefault()}>Facebook</a>
            <a href="#" className="social-pill" title="WhatsApp VIP" onClick={e => e.preventDefault()}>WhatsApp VIP</a>
          </div>
        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="footer-bottom-bar">
          <p className="footer-copy-text">{f.copyright}</p>
          <div className="footer-legal-links">
            <a href="#" onClick={e => e.preventDefault()}>{f.legal}</a>
            <span>•</span>
            <a href="#" onClick={e => e.preventDefault()}>{f.privacy}</a>
            <span>•</span>
            <a href="#" onClick={e => e.preventDefault()}>{f.terms}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
