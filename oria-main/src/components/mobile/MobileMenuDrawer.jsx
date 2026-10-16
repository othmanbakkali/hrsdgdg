import React, { useEffect } from 'react';
import OriaLogo from '../OriaLogo';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  saleUniverse,
  onSelectUniverse,
  selectedCategory,
  onSelectCategory,
  dealsOnly,
  onToggleDeals,
  categories = [],
  selectedCity,
  onOpenCityPicker,
  onOpenCart,
  cartCount = 0,
  onOpenChat,
  onOpenAI,
  onOpenSell,
  onOpenGoldModal,
  goldRate = { price18k: 1045, change: '+0.7%' },
  theme = 'light',
  onToggleTheme,
  user,
  onOpenAuth,
  onOpenChangePassword,
  onLogout,
  onNavigate
}) {
  const { lang, setLang, t } = useLanguage();
  const isAr = lang === 'ar';

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectNav = (action) => {
    action();
    onClose();
  };

  const defaultCategories = [
    { id: 'cat_rings', nom_ar: 'خواتم', nom_fr: 'Bagues', icon: '💍' },
    { id: 'cat_necklaces', nom_ar: 'سلاسل وقلادات', nom_fr: 'Colliers & Chaînes', icon: '📿' },
    { id: 'cat_bracelets', nom_ar: 'أساور ومخانق', nom_fr: 'Bracelets', icon: '👑' },
    { id: 'cat_earrings', nom_ar: 'أقراط وتخارص', nom_fr: 'Boucles d\'oreilles', icon: '✨' },
    { id: 'cat_watches', nom_ar: 'ساعات فاخرة', nom_fr: 'Montres de Luxe', icon: '⌚' },
    { id: 'cat_sets', nom_ar: 'أطقم ومجوهرات كاملة', nom_fr: 'Parures Complètes', icon: '💎' },
    { id: 'cat_traditional', nom_ar: 'مجوهرات تقليدية', nom_fr: 'Bijoux Traditionnels', icon: '👑' },
    { id: 'cat_artisanal', nom_ar: 'مجوهرات حرفية', nom_fr: 'Bijoux Artisanaux', icon: '🏺' },
    { id: 'cat_stones', nom_ar: 'أحجار كريمة وألماس', nom_fr: 'Diamants & Pierres', icon: '❇️' }
  ];

  const displayCategories = categories && categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="mobile-menu-overlay" onClick={onClose} dir={isAr ? 'rtl' : 'ltr'}>
      <div 
        className="mobile-menu-sheet" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'القائمة الرئيسية' : 'Menu principal'}
      >
        {/* Drawer Header */}
        <div className="mobile-menu-header">
          <div className="mobile-menu-brand">
            <OriaLogo size={24} showText={true} />
          </div>
          <button 
            className="mobile-menu-close-btn"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق القائمة' : 'Fermer le menu'}
          >
            ✕
          </button>
        </div>

        {/* Quick Strip: City & Live Gold Rate */}
        <div className="mobile-menu-quick-strip">
          <button 
            className="menu-strip-btn city-btn"
            onClick={() => handleSelectNav(onOpenCityPicker)}
            title={isAr ? 'تغيير المدينة' : 'Changer de ville'}
          >
            <span className="strip-icon">📍</span>
            <span className="strip-text">{selectedCity || (isAr ? 'كل المغرب' : 'Tout le Maroc')}</span>
            <span className="strip-chevron">▼</span>
          </button>

          <button 
            className="menu-strip-btn gold-btn"
            onClick={() => handleSelectNav(onOpenGoldModal)}
            title={isAr ? 'سعر الذهب عيار 18 قيراط' : 'Cours de l\'or 18K'}
          >
            <span className="strip-icon">🥇</span>
            <span className="strip-text">
              {isAr ? `ذهب 18K: ${goldRate.price18k ? Number(goldRate.price18k).toLocaleString('fr-FR') : '1 045'} د.م` : `Or 18K: ${goldRate.price18k ? Number(goldRate.price18k).toLocaleString('fr-FR') : '1 045'} DH`}
            </span>
            <span className="strip-badge">{goldRate.change || '+0.7%'}</span>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="mobile-menu-content">
          {/* 1. Universes Section */}
          <div className="mobile-menu-section">
            <div className="menu-section-title">
              {isAr ? 'المجموعات والتسوق' : 'Univers & Shopping'}
            </div>

            <div className="menu-nav-list">
              <button 
                className={`menu-nav-item ${saleUniverse === 'ALL' && !selectedCategory && !dealsOnly ? 'active' : ''}`}
                onClick={() => handleSelectNav(() => {
                  onSelectUniverse('ALL');
                  onSelectCategory('');
                  if (dealsOnly) onToggleDeals();
                  if (onNavigate) onNavigate('marketplace');
                })}
              >
                <div className="nav-item-icon-box">🏠</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'الرئيسية' : 'Accueil'}</span>
                  <span className="nav-item-sub">{isAr ? 'جميع المعروضات والمجوهرات' : 'Catalogue complet'}</span>
                </div>
              </button>

              <button 
                className={`menu-nav-item ${saleUniverse === 'FIRST_HAND' && !dealsOnly ? 'active' : ''}`}
                onClick={() => handleSelectNav(() => {
                  onSelectUniverse('FIRST_HAND');
                  if (dealsOnly) onToggleDeals();
                  if (onNavigate) onNavigate('marketplace');
                })}
              >
                <div className="nav-item-icon-box gold">✨</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'مجوهرات جديدة (Première Main)' : 'Bijoux Neufs'}</span>
                  <span className="nav-item-sub">{isAr ? 'صياغة فاخرة من دور المجوهرات' : 'Créations certifiées & garanties'}</span>
                </div>
                <span className="nav-item-badge new">{isAr ? 'جديد' : 'Neuf'}</span>
              </button>

              <button 
                className={`menu-nav-item ${saleUniverse === 'SECOND_HAND' && !dealsOnly ? 'active' : ''}`}
                onClick={() => handleSelectNav(() => {
                  onSelectUniverse('SECOND_HAND');
                  if (dealsOnly) onToggleDeals();
                  if (onNavigate) onNavigate('marketplace');
                })}
              >
                <div className="nav-item-icon-box green">♻️</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'مستعمل ومفحوص (Seconde Main)' : 'Occasions & Vintage'}</span>
                  <span className="nav-item-sub">{isAr ? 'قطع تم فحصها وضمان عيارها' : 'Expertisé & Poinçonné'}</span>
                </div>
                <span className="nav-item-badge second">{isAr ? 'مستعمل' : 'Occasion'}</span>
              </button>

              <button 
                className={`menu-nav-item ${saleUniverse === 'AUCTION' && !dealsOnly ? 'active' : ''}`}
                onClick={() => handleSelectNav(() => {
                  onSelectUniverse('AUCTION');
                  if (dealsOnly) onToggleDeals();
                  if (onNavigate) onNavigate('marketplace');
                })}
              >
                <div className="nav-item-icon-box red">🔨</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'مزادات حية ومباشرة' : 'Enchères en Direct'}</span>
                  <span className="nav-item-sub">{isAr ? 'زايد على أندر القطع الذهبية' : 'Ventes aux enchères exclusives'}</span>
                </div>
                <span className="nav-item-badge auction">{isAr ? 'مباشر' : 'Live'}</span>
              </button>

              <button 
                className={`menu-nav-item ${dealsOnly ? 'active' : ''}`}
                onClick={() => handleSelectNav(() => {
                  if (!dealsOnly) onToggleDeals();
                  if (onNavigate) onNavigate('marketplace');
                })}
              >
                <div className="nav-item-icon-box fire">🔥</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'عروض وتخفيضات مميزة' : 'Offres & Remises'}</span>
                  <span className="nav-item-sub">{isAr ? 'أفضل الأسعار وفرص التوفير' : 'Jusqu\'à -40%'}</span>
                </div>
                <span className="nav-item-badge deal">{isAr ? 'تخفيض' : '%'}</span>
              </button>
            </div>
          </div>

          {/* 2. Jewelry Categories Section */}
          <div className="mobile-menu-section">
            <div className="menu-section-title">
              {isAr ? 'فئات المجوهرات' : 'Catégories de Bijoux'}
            </div>

            <div className="menu-categories-grid">
              <button 
                className={`menu-cat-card ${!selectedCategory ? 'active' : ''}`}
                onClick={() => handleSelectNav(() => onSelectCategory(''))}
              >
                <span className="cat-card-icon">💎</span>
                <span className="cat-card-name">{isAr ? 'الكل' : 'Tous'}</span>
              </button>

              {displayCategories.map(cat => {
                const isSelected = selectedCategory === cat.id;
                const catName = isAr && cat.nom_ar ? cat.nom_ar : (cat.nom_fr || cat.nom);
                return (
                  <button 
                    key={cat.id}
                    className={`menu-cat-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectNav(() => onSelectCategory(isSelected ? '' : cat.id))}
                  >
                    <span className="cat-card-icon">{cat.icon || '💎'}</span>
                    <span className="cat-card-name">{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Services & Features Section */}
          <div className="mobile-menu-section">
            <div className="menu-section-title">
              {isAr ? 'خدمات ومساعد الجوهرجي' : 'Services & Assistance'}
            </div>

            <div className="menu-nav-list">
              <button 
                className="menu-nav-item highlight-sell"
                onClick={() => handleSelectNav(onOpenSell)}
              >
                <div className="nav-item-icon-box green">💰</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'بيع مجوهراتي وذهب قديم' : 'Vendre mon bijou'}</span>
                  <span className="nav-item-sub">{isAr ? 'تقييم فوري وعرض للبيع في المغرب' : 'Estimation & Rachat rapide'}</span>
                </div>
                <span className="nav-item-chevron">‹</span>
              </button>

              <button 
                className="menu-nav-item"
                onClick={() => handleSelectNav(onOpenAI)}
              >
                <div className="nav-item-icon-box gold">✨</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'المساعد الذكي للجوهرجي (AI)' : 'Concierge IA Joaillerie'}</span>
                  <span className="nav-item-sub">{isAr ? 'استشارات ذكية لاختيار القطعة المثالية' : 'Conseils personnalisés par IA'}</span>
                </div>
                <span className="nav-item-chevron">‹</span>
              </button>

              <button 
                className="menu-nav-item"
                onClick={() => handleSelectNav(onOpenGoldModal)}
              >
                <div className="nav-item-icon-box gold">📈</div>
                <div className="nav-item-info">
                  <span className="nav-item-label">{isAr ? 'سجل وحاسبة أسعار الذهب' : 'Simulateur & Cours de l\'or'}</span>
                  <span className="nav-item-sub">{isAr ? 'تتبع عيار 18 قيراط وحساب القيمة' : 'Graphiques & Historique 18K'}</span>
                </div>
                <span className="nav-item-chevron">‹</span>
              </button>
            </div>
          </div>

          {/* 4. User Account & Preferences */}
          <div className="mobile-menu-section user-section">
            <div className="menu-section-title">
              {isAr ? 'حسابي والإعدادات' : 'Mon Compte & Préférences'}
            </div>

            {user ? (
              <div className="menu-user-card">
                <div className="user-avatar-circle">👤</div>
                <div className="user-details">
                  <strong className="user-name">{user.nom || user.name}</strong>
                  <span className="user-email">{user.email}</span>
                </div>
                <div className="user-actions-row">
                  {user.role === 'admin' && (
                    <a 
                      href="/admin/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="user-quick-btn admin"
                      style={{
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid var(--primary-gold)',
                        color: 'var(--primary-gold)',
                        textDecoration: 'none',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      👑 {isAr ? 'الإدارة' : 'Administration'}
                    </a>
                  )}
                  {onNavigate && (
                    <button 
                      className="user-quick-btn"
                      onClick={() => handleSelectNav(() => onNavigate('client-dashboard'))}
                    >
                      📦 {isAr ? 'فضاء الزبون' : 'Espace Client'}
                    </button>
                  )}
                  {onNavigate && (
                    <button 
                      className="user-quick-btn merchant"
                      onClick={() => handleSelectNav(() => onNavigate('merchant-dashboard'))}
                    >
                      🏪 {isAr ? 'فضاء التاجر' : 'Espace Vendeur'}
                    </button>
                  )}
                  {onOpenChangePassword && (
                    <button 
                      className="user-quick-btn"
                      onClick={() => handleSelectNav(onOpenChangePassword)}
                      title={isAr ? 'تغيير كلمة المرور' : 'Changer de mot de passe'}
                    >
                      🔑 {isAr ? 'كلمة المرور' : 'Mot de passe'}
                    </button>
                  )}
                  {onLogout && (
                    <button 
                      className="user-quick-btn logout"
                      onClick={() => handleSelectNav(onLogout)}
                    >
                      {isAr ? 'خروج' : 'Déconnexion'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button 
                className="menu-login-cta-btn"
                onClick={() => handleSelectNav(onOpenAuth)}
              >
                <span>👤</span>
                <span>{isAr ? 'تسجيل الدخول / إنشاء حساب جديد' : 'Se connecter / S\'inscrire'}</span>
              </button>
            )}

            {/* Preferences: Theme & Language */}
            <div className="menu-preferences-row">
              <button 
                className="pref-toggle-btn theme"
                onClick={onToggleTheme}
                title={isAr ? 'تبديل المظهر' : 'Changer le thème'}
              >
                <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                <span>{isAr ? (theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري') : (theme === 'light' ? 'Mode Nuit' : 'Fond Clair')}</span>
              </button>

              <div className="pref-lang-group">
                <button 
                  className={`lang-pill ${lang === 'ar' ? 'active' : ''}`}
                  onClick={() => setLang('ar')}
                >
                  🇲🇦 العربية
                </button>
                <button 
                  className={`lang-pill ${lang === 'fr' ? 'active' : ''}`}
                  onClick={() => setLang('fr')}
                >
                  🇫🇷 FR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mobile-menu-footer">
          <span className="guarantee-badge">🇲🇦 طابع الدولة وضمان الصياغة المغربية 100%</span>
        </div>
      </div>
    </div>
  );
}
