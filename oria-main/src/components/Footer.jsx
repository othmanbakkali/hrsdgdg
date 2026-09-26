import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';
import PWAInstallButton from '../pwa/PWAInstallButton';

export default function Footer({ onNavigate, user }) {
  const { lang, isRtl } = useLanguage();
  const isAr = lang === 'ar';
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
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>
                {isAr ? 'مجوهرات جديدة معتمدة' : 'Première Main Certifiée'}
              </h4>
              <p style={{ fontSize: '0.8rem' }}>
                {isAr ? 'مجوهرات جديدة مباشرة من الصاغة مع طابع رسمي' : 'Bijoux neufs direct bijouteries avec poinçon officiel'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>♻️</span>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>
                {isAr ? 'مجوهرات مستعملة مفحوصة' : 'Seconde Main Expertisée'}
              </h4>
              <p style={{ fontSize: '0.8rem' }}>
                {isAr ? 'فحص أحجار كريمة أصلي ومصدر مضمون 100%' : 'Authentification gemmologique & traçabilité garantie'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>🚚</span>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>
                {isAr ? 'توصيل مصفح وآمن' : 'Livraison Sécurisée'}
              </h4>
              <p style={{ fontSize: '0.8rem' }}>
                {isAr ? 'شحن مؤمن وتتبع فوري خلال 24/48 ساعة' : 'Envoi blindé et suivi en temps réel sous 24/48h'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>🛡️</span>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '2px' }}>
                {isAr ? 'دفع آمن ومحمي' : 'Paiement Protégé'}
              </h4>
              <p style={{ fontSize: '0.8rem' }}>
                {isAr ? 'الدفع عند الاستلام أو بطاقة بنكية مشفرة 100%' : 'Paiement à la livraison ou CB 100% chiffré'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '60px 30px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
        {/* Brand Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <OriaLogo size={36} showText={true} />
          <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-gray)' }}>
            {isAr ? (
              <><strong>HRSDGDG</strong> هي المنصة الذكية الأولى المخصصة للمجوهرات الجديدة والمستعملة في المغرب. اعثروا على القطعة التي تعبر عنكم بين تشكيلاتنا الفريدة.</>
            ) : (
              <><strong>HRSDGDG</strong> est la première marketplace intelligente dédiée aux bijoux neufs et de seconde main. Trouvez la pièce qui vous ressemble parmi nos collections uniques.</>
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid var(--border-gold)', color: 'var(--light-gold)' }}>
              {isAr ? '🇲🇦 الدار البيضاء • الرباط • مراكش' : '🇲🇦 Casablanca • Rabat • Marrakech'}
            </span>
            <PWAInstallButton variant="nav-item" />
          </div>
        </div>

        {/* Universes Links */}
        <div>
          <h4 style={{ color: 'var(--light-gold)', fontSize: '0.95rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isAr ? 'أقسامنا' : 'Nos Univers'}
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', padding: 0 }}>
            <li><a href="#first-hand" onClick={() => onNavigate && onNavigate('first-hand')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>{isAr ? '✨ مجوهرات جديدة (يد أولى)' : '✨ Première Main (Neuf)'}</a></li>
            <li><a href="#second-hand" onClick={() => onNavigate && onNavigate('second-hand')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>{isAr ? '♻️ مجوهرات مستعملة (فرصة)' : '♻️ Seconde Main (Occasion)'}</a></li>
            <li><a href="#deals" onClick={() => onNavigate && onNavigate('deals')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>{isAr ? '🔥 عروض وتخفيضات' : '🔥 Bonnes Affaires'}</a></li>
            <li><a href="#sell" onClick={() => onNavigate && onNavigate('sell')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>{isAr ? '💎 بيع مجوهراتي' : '💎 Vendre mon bijou'}</a></li>
            <li><a href="#finder" onClick={() => onNavigate && onNavigate('finder')} style={{ color: 'var(--text-light-gray)', textDecoration: 'none' }}>{isAr ? '🔍 المساعد الذكي' : '🔍 Trouver mon bijou'}</a></li>
          </ul>
        </div>

        {/* Categories Links */}
        <div>
          <h4 style={{ color: 'var(--light-gold)', fontSize: '0.95rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isAr ? 'الفئات' : 'Catégories'}
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', padding: 0 }}>
            <li><span style={{ color: 'var(--text-light-gray)' }}>{isAr ? '💍 خواتم وسولتير' : '💍 Bagues & Solitaires'}</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>{isAr ? '📿 قلادات وسلاسل' : '📿 Colliers & Pendentifs'}</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>{isAr ? '🔗 أساور وأغلال' : '🔗 Bracelets & Joncs'}</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>{isAr ? '👂 أقراط' : '👂 Boucles d\'oreilles'}</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>{isAr ? '💎 أطقم كاملة' : '💎 Parures complètes'}</span></li>
            <li><span style={{ color: 'var(--text-light-gray)' }}>{isAr ? '⌚ مجوهرات وساعات رجالية' : '⌚ Bijoux Homme'}</span></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 style={{ color: 'var(--light-gold)', fontSize: '0.95rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isAr ? 'النادي الخاص HRSDGDG' : 'Le Cercle Privé HRSDGDG'}
          </h4>
          <p style={{ fontSize: '0.85rem', marginBottom: '14px', color: 'var(--text-gray)' }}>
            {isAr ? 'احصلوا حصرياً على تنبيهات بأندر قطع المجوهرات المستعملة وأحدث التشكيلات الفاخرة.' : 'Recevez en avant-première les alertes pépites seconde main et les nouvelles créations joaillières.'}
          </p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="email"
              required
              placeholder={isAr ? 'بريدكم الإلكتروني...' : 'Votre email...'}
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              className="filter-number-input"
              style={{ padding: '10px 14px' }}
            />
            <button type="submit" className="btn-jewelia-primary" style={{ padding: '10px' }}>
              {isAr ? 'الانضمام إلى النادي' : 'Rejoindre le Cercle'}
            </button>
            {isSubscribed && (
              <span style={{ color: '#10b981', fontSize: '0.8rem' }}>
                {isAr ? '✨ مرحباً بكم في نادي HRSDGDG !' : '✨ Bienvenue dans le Cercle HRSDGDG !'}
              </span>
            )}
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '20px 30px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-gray)' }}>
        {isAr ? (
          <>حقوق النشر © 2026 HRSDGDG — المنصة الرائدة للمجوهرات الفاخرة Première & Seconde Main. جميع الحقوق محفوظة.</>
        ) : (
          <>Copyright © 2026 HRSDGDG — Marketplace de Joaillerie & Bijoux Première & Seconde Main. Tous droits réservés.</>
        )}
      </div>
    </footer>
  );
}
