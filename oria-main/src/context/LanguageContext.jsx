import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  ar: {
    appTitle: "HRSDGDG للمجوهرات الفاخرة",
    slogan: "اعثروا على المجوهرات التي تعبر عنكم.",
    heroTitle: "أسلوبكم. مجوهراتكم. قصتكم.",
    heroSubtitle: "اكتشفوا مجوهرات جديدة ومستعملة معتمدة ومختارة بعناية من كبار الصاغة.",
    heroCtaAll: "استكشف المجوهرات",
    heroCtaSecondHand: "استكشف المجوهرات المستعملة",
    heroCtaSell: "♻️ بيع مجوهراتي",
    
    // Universes
    universeFirstHandTitle: "✨ مجوهرات جديدة",
    universeFirstHandSubtitle: "مجوهرات أصلية مباشرة من كبار الصاغة والمحلات",
    universeFirstHandBtn: "اكتشف الجديد",
    universeFirstHandDesc: "محلات وماركات وصناع معتمدون مع ضمان وفاتورة رسمية.",
    
    universeSecondHandTitle: "♻️ مجوهرات مستعملة",
    universeSecondHandSubtitle: "قطع فريدة ونادرة تستحق حياة ثانية",
    universeSecondHandBtn: "اكتشف المستعمل",
    universeSecondHandDesc: "من أفراد وهواة جمع معتمدة ومفحوصة بنسبة 100%.",
    
    firstHand: "✨ مجوهرات جديدة",
    secondHand: "♻️ مجوهرات مستعملة",
    allJewels: "جميع المجوهرات",
    deals: "🔥 عروض وتخفيضات",
    secondHandDeals: "💎 فرص ذهبية مستعملة",
    shops: "🏪 المتاجر والبائعون",
    findJewel: "🔍 المساعد الذكي",
    sellJewel: "♻️ بيع مجوهراتي",
    comparator: "⚖️ مقارنة المجوهرات",
    
    home: "الرئيسية",
    search: "البحث",
    cart: "السلة",
    account: "حسابي",
    favorites: "المفضلة",
    messages: "الرسائل",
    orders: "طلباتي",
    dashboard: "لوحة التحكم",
    currency: "د.م",
    grams: "غ",
    purity: "العيار",
    stock: "المخزون",
    city: "المدينة",
    category: "الفئة",
    material: "المعدن",
    stone: "الحجر",
    size: "المقاس",
    year: "السنة",
    condition: "الحالة",
    verifiedJewel: "🛡️ مجوهرات مفحوصة",
    price: "السعر",
    weight: "الوزن",
    merchant: "البائع",
    availability: "التوفر",
    available: "متوفر",
    outOfStock: "نفذ",
    searchPlaceholder: "🔍 ابحث عن مجوهرات (مثال: خاتم ذهب، قلادة أقل من 2000 درهم...)",
    allCategories: "جميع الفئات",
    filterTitle: "تصفية النتائج",
    resetFilters: "إعادة ضبط",
    noProducts: "لا توجد مجوهرات تطابق معاييرك.",
    detailsButton: "عرض التفاصيل",
    addToCart: "إضافة إلى السلة",
    buyNow: "شراء فوري",
    contactMerchant: "تواصل مع البائع",
    
    condNew: "جديد",
    condLikeNew: "كالجديد تماماً",
    condExcellent: "حالة ممتازة",
    condVeryGood: "حالة جيدة جداً",
    condGood: "حالة جيدة",
    condRestore: "يحتاج صيانة",
    
    whyThisJewel: "✨ لماذا هذه القطعة ؟",
    completeLook: "💎 أكملوا إطلالتكم",
    createLook: "تنسيق الطقم",
    addLookToCart: "إضافة الطقم كاملاً للسلة",
    originalInvoice: "فاتورة أصلية",
    authenticityCert: "شهادة أصالة",
    originalBox: "علبة أصلية",
    warranty: "الضمان",
    secureDelivery: "توصيل مصفح وسريع 24/48س",
    
    yourCart: "سلة التسوق",
    cartEmpty: "سلة التسوق فارغة",
    firstHandItems: "✨ منتجات جديدة",
    secondHandItems: "♻️ منتجات مستعملة",
    subtotal: "المجموع الفرعي",
    deliveryFee: "التوصيل",
    freeDelivery: "مجاني",
    cartTotal: "المجموع الإجمالي",
    checkoutButton: "إتمام الطلب",
    checkoutTitle: "تأكيد الطلب",
    stepShipping: "1. العنوان والشحن",
    stepPayment: "2. طريقة الدفع",
    stepConfirmation: "3. التأكيد",
    clientName: "الاسم الكامل",
    clientPhone: "رقم الهاتف",
    clientAddress: "العنوان بالتفصيل",
    clientCity: "المدينة",
    paymentMethod: "طريقة الأداء",
    payCashOnDelivery: "الدفع عند الاستلام (كاش)",
    payCard: "بطاقة بنكية",
    payTransfer: "تحويل بنكي",
    confirmOrder: "تأكيد وإرسال الطلب",
    orderSuccess: "تهانينا ! تم تأكيد طلبكم بنجاح.",
    orderNumber: "رقم الطلب",
    trackOrder: "تتبع مسار الطلب",
    
    track1: "تم تأكيد الطلب",
    track2: "إعداد ومراقبة الجودة",
    track3: "الشحن الآمن",
    track4: "التسليم",
    
    customerReviews: "تقييمات وآراء المشترين",
    leaveReview: "إضافة تقييم",
    submitReview: "نشر التقييم",
    rating: "التقييم",
    comment: "التعليق",
    reviewSuccess: "شكراً ! تم حفظ تقييمكم.",
    
    finderTitle: "المساعد الذكي لاختيار المجوهرات",
    finderSubtitle: "أجب عن 5 أسئلة وسيقترح عليك النظام أفضل القطع المناسبة لذوقك وميزانيتك.",
    finderStep1: "لمن تبحث عن المجوهرات ؟",
    finderStep2: "ما هي المناسبة ؟",
    finderStep3: "ما هو أسلوبك المفضل ؟",
    finderStep4: "ما هي ميزانيتك القصوى ؟",
    finderStep5: "ما هو نوع الشراء المفضل ؟",
    finderResultsTitle: "الترشيحات المناسبة لك",
    finderMatch: "نسبة التطابق",
    
    sellTitle: "امنحوا مجوهراتكم حياة ثانية",
    sellSubtitle: "بيعوا مجوهراتكم بأمان تام مع خدمة الفحص والضمان.",
    
    loginTitle: "تسجيل الدخول - HRSDGDG",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    loginButton: "دخول",
    logoutButton: "خروج",
    roleLabel: "نوع الحساب",
    visitor: "زائر",
    client: "زبون",
    merchantMode: "صائغ / تاجر",
    adminMode: "المشرف",
    linkCopied: "تم نسخ الرابط !"
  },
  fr: {
    appTitle: "HRSDGDG",
    slogan: "Trouvez le bijou qui vous ressemble.",
    heroTitle: "Votre style. Votre bijou. Votre histoire.",
    heroSubtitle: "Découvrez des bijoux neufs et de seconde main sélectionnés pour vous.",
    heroCtaAll: "Découvrir les bijoux",
    heroCtaSecondHand: "Explorer la seconde main",
    heroCtaSell: "♻️ Vendre mon bijou",
    
    // Universes
    universeFirstHandTitle: "✨ PREMIÈRE MAIN",
    universeFirstHandSubtitle: "Des bijoux neufs, directement des professionnels",
    universeFirstHandBtn: "Découvrir le neuf",
    universeFirstHandDesc: "Bijouteries, marques et maîtres artisans avec garantie constructeur et facture.",
    
    universeSecondHandTitle: "♻️ SECONDE MAIN",
    universeSecondHandSubtitle: "Des bijoux uniques qui méritent une seconde vie",
    universeSecondHandBtn: "Découvrir l'occasion",
    universeSecondHandDesc: "Particuliers & collectionneurs avec authentification certifiée et état vérifié.",
    
    firstHand: "✨ Première main",
    secondHand: "♻️ Seconde main",
    allJewels: "Tous les bijoux",
    deals: "🔥 Bonnes Affaires",
    secondHandDeals: "💎 Bonnes affaires seconde main",
    shops: "🏪 Boutiques & Vendeurs",
    findJewel: "🔍 Trouver mon bijou",
    sellJewel: "♻️ Vendre mon bijou",
    comparator: "⚖️ Comparateur",
    
    // Navigation & General
    home: "Accueil",
    search: "Recherche",
    cart: "Panier",
    account: "Mon compte",
    favorites: "Favoris",
    messages: "Messages",
    orders: "Mes commandes",
    dashboard: "Mon Espace",
    currency: "DH",
    grams: "g",
    purity: "Pureté",
    stock: "Stock",
    city: "Ville",
    category: "Catégorie",
    material: "Matière",
    stone: "Pierre",
    size: "Taille",
    year: "Année",
    condition: "État",
    verifiedJewel: "🛡️ Bijou vérifié",
    price: "Prix",
    weight: "Poids",
    merchant: "Vendeur",
    availability: "Disponibilité",
    available: "Disponible",
    outOfStock: "Rupture de stock",
    searchPlaceholder: "🔍 Rechercher un bijou (ex: bague or femme, collier vintage < 2000 DH...)",
    allCategories: "Toutes les catégories",
    filterTitle: "Filtres",
    resetFilters: "Réinitialiser",
    noProducts: "Aucun bijou ne correspond à vos critères de recherche.",
    detailsButton: "Voir la fiche",
    addToCart: "Ajouter au panier",
    buyNow: "Acheter maintenant",
    contactMerchant: "Contacter le vendeur",
    
    // Conditions
    condNew: "Neuf",
    condLikeNew: "Comme neuf",
    condExcellent: "Excellent état",
    condVeryGood: "Très bon état",
    condGood: "Bon état",
    condRestore: "À restaurer",
    
    // Trust & Details
    whyThisJewel: "✨ Pourquoi ce bijou ?",
    completeLook: "💎 Complétez votre look",
    createLook: "Créer mon look",
    addLookToCart: "Ajouter le look complet au panier",
    originalInvoice: "Facture originale",
    authenticityCert: "Certificat d'authenticité",
    originalBox: "Boîte originale",
    warranty: "Garantie",
    secureDelivery: "Livraison sécurisée 24/48h",
    
    // Cart & Checkout
    yourCart: "Votre Panier",
    cartEmpty: "Votre panier est vide",
    firstHandItems: "✨ PREMIÈRE MAIN",
    secondHandItems: "♻️ SECONDE MAIN",
    subtotal: "Sous-total",
    deliveryFee: "Frais de livraison",
    freeDelivery: "Gratuit",
    cartTotal: "Total à payer",
    checkoutButton: "Valider la commande",
    checkoutTitle: "Finalisation de commande",
    stepShipping: "1. Livraison",
    stepPayment: "2. Paiement",
    stepConfirmation: "3. Confirmation",
    clientName: "Nom complet",
    clientPhone: "Téléphone",
    clientAddress: "Adresse de livraison",
    clientCity: "Ville",
    paymentMethod: "Mode de règlement",
    payCashOnDelivery: "Paiement à la livraison (Espèces)",
    payCard: "Carte bancaire (CMI / Visa / Mastercard)",
    payTransfer: "Virement bancaire",
    confirmOrder: "Confirmer et commander",
    orderSuccess: "Merci pour votre commande !",
    orderNumber: "N° de commande",
    trackOrder: "Suivre mon colis",
    
    track1: "Commande confirmée",
    track2: "Contrôle qualité & Préparation",
    track3: "Expédition sécurisée",
    track4: "Livraison effectuée",
    
    customerReviews: "Avis Clients",
    leaveReview: "Donner mon avis",
    submitReview: "Publier l'avis",
    rating: "Note",
    comment: "Votre commentaire",
    reviewSuccess: "Votre avis a été enregistré !",
    
    finderTitle: "Trouvez le bijou parfait en 30 secondes",
    finderSubtitle: "Répondez à 5 questions et laissez notre algorithme vous recommander les pièces idéales.",
    finderStep1: "Pour qui cherchez-vous ce bijou ?",
    finderStep2: "Quelle est l'occasion ?",
    finderStep3: "Quel est votre style préféré ?",
    finderStep4: "Quel est votre budget maximum ?",
    finderStep5: "Type de bijou recherché ?",
    finderResultsTitle: "Vos bijoux recommandés",
    finderMatch: "Score d'affinité",
    
    sellTitle: "Donnez une seconde vie à vos bijoux",
    sellSubtitle: "Vendez vos bijoux en toute sécurité avec authentification certifiée et paiement garanti.",
    
    loginTitle: "Connexion HRSDGDG",
    email: "Adresse Email",
    password: "Mot de passe",
    loginButton: "Se connecter",
    logoutButton: "Déconnexion",
    roleLabel: "Mode d'accès",
    visitor: "Visiteur",
    client: "Client",
    merchantMode: "Vendeur / Bijouterie",
    adminMode: "Administration",
    linkCopied: "Lien copié dans le presse-papiers !"
  }
};

export const translateCityToArabic = (city) => {
  if (!city) return 'الدار البيضاء';
  const c = String(city).trim().toLowerCase();
  if (c.includes('casa') || c.includes('dar') || c.includes('بيضاء')) return 'الدار البيضاء';
  if (c.includes('rabat') || c.includes('رباط')) return 'الرباط';
  if (c.includes('marrak') || c.includes('مراكش')) return 'مراكش';
  if (c.includes('fès') || c.includes('fes') || c.includes('فاس')) return 'فاس';
  if (c.includes('tang') || c.includes('طنجة')) return 'طنجة';
  if (c.includes('agad') || c.includes('أكادير') || c.includes('اكادير')) return 'أكادير';
  if (c.includes('mekn') || c.includes('مكناس')) return 'مكناس';
  if (c.includes('oujd') || c.includes('وجدة')) return 'وجدة';
  if (c.includes('tétou') || c.includes('tetouan') || c.includes('تطوان')) return 'تطوان';
  if (c.includes('kéni') || c.includes('kenitra') || c.includes('قنيطرة')) return 'القنيطرة';
  if (c.includes('essaou') || c.includes('صويرة')) return 'الصويرة';
  if (c.includes('el jadida') || c.includes('jadida') || c.includes('جديدة')) return 'الجديدة';
  if (c.includes('safi') || c.includes('آسفي') || c.includes('اسفي')) return 'آسفي';
  if (c.includes('nador') || c.includes('ناظور')) return 'الناظور';
  if (c.includes('beni mellal') || c.includes('بني ملال')) return 'بني ملال';
  if (c.includes('laâyoune') || c.includes('laayoune') || c.includes('عيون')) return 'العيون';
  if (c.includes('dakhla') || c.includes('داخلة')) return 'الداخلة';
  if (c.includes('salé') || c.includes('sale') || c.includes('سلا')) return 'سلا';
  if (c.includes('mohamm') || c.includes('محمدية')) return 'المحمدية';
  if (c.includes('khouribga') || c.includes('خريبكة')) return 'خريبكة';
  if (c.includes('ouarzazate') || c.includes('ورزازات')) return 'ورزازات';
  if (c.includes('taza') || c.includes('تازة')) return 'تازة';
  if (c.includes('berrechid') || c.includes('برشيد')) return 'برشيد';
  if (c.includes('taroudant') || c.includes('تارودانت')) return 'تارودانت';
  if (c.includes('errachidia') || c.includes('الرشيدية')) return 'الرشيدية';
  if (c.includes('larache') || c.includes('العرائش')) return 'العرائش';
  if (c.includes('guelmim') || c.includes('كلميم')) return 'كلميم';
  if (c.includes('khemisset') || c.includes('الخميسات')) return 'الخميسات';
  if (c.includes('tiznit') || c.includes('تيزنيت')) return 'تيزنيت';
  if (c.includes('berkane') || c.includes('بركان')) return 'بركان';
  if (c.includes('al hoceima') || c.includes('الحسيمة')) return 'الحسيمة';
  if (c.includes('autre') || c.includes('other')) return 'مدينة أخرى';
  return city;
};

export const formatCurrency = (amount, lang = 'ar') => {
  if (amount === undefined || amount === null || amount === '') return lang === 'ar' ? 'غير محدد' : 'N/A';
  const num = Number(amount);
  const formatted = isNaN(num) ? amount : num.toLocaleString('fr-FR');
  const unit = lang === 'ar' ? 'د.م' : 'MAD';
  return `${formatted} ${unit}`;
};

export const formatGrammage = (gramme, lang = 'ar') => {
  if (gramme === undefined || gramme === null || gramme === '' || Number(gramme) <= 0) {
    return lang === 'ar' ? 'غير محدد' : 'Non renseigné';
  }
  const unit = lang === 'ar' ? 'غ' : 'g';
  return `${gramme} ${unit}`;
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('jewelia-lang-ar');
    return saved === 'fr' ? 'fr' : 'ar';
  });

  const setLang = (newLang) => {
    const validLang = (newLang === 'fr' || newLang === 'ar') ? newLang : 'ar';
    setLangState(validLang);
    localStorage.setItem('jewelia-lang-ar', validLang);
  };

  useEffect(() => {
    localStorage.setItem('jewelia-lang-ar', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations['ar']?.[key] || key;
  };

  const isRtl = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

