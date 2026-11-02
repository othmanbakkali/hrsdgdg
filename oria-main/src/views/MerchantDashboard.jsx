import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import ProductCard from '../components/ProductCard';
import { ALL_MOROCCAN_CITIES } from '../utils/moroccanCities';

const DEFAULT_SUGGESTIONS = {
  titre_ar: [
    '💍 خاتم سوليتير ألماس 18k',
    '📿 قلادة سلسلة فاخرة 18k',
    '🔗 سوار رويال أنيق 18k',
    '✨ ميدالية ذهبية عيار 18k',
    '💎 أقراط دائرية عيار 18k',
    '👑 طقم عرائسي ملكي 18k'
  ],
  titre_fr: [
    '💍 Bague Solitaire Diamant 18K',
    '📿 Collier Chaine Forçat 18K',
    '🔗 Bracelet Gourmette Royale 18K',
    '✨ Pendentif Médaille Oria 18K',
    '💎 Boucles d\'Oreilles Créoles 18K',
    '👑 Parure Traditionnelle 18K'
  ],
  description_ar: [
    '✨ ذهب موثق عيار 18k مع الختم الرسمي المغربي.',
    '💎 حلي بلدية مغربية أصيلة.',
    '💎 حلي عصرية راقية مع تشطيب دقيق.',
    '💎 رافينتي إيطالية عيار 18k.',
    '💎 قطعة مستوردة فاخرة.',
    '💎 تحفة أثرية نادرة.',
    '💎 حلي أنتيكة كلاسيكية.'
  ],
  description_fr: [
    '✨ Or 18K certifié avec poinçon officiel marocain.',
    '💎 Joaillerie traditionnelle marocaine authentique.',
    '💎 Bijou moderne raffiné avec finition soignée.',
    '💎 Pièce italienne raffinée en or 18k.',
    '💎 Pièce importée d\'exception.',
    '💎 Chef-d\'œuvre antique rare.',
    '💎 Bijou vintage de collection.'
  ],
  prix_gramme: [750, 800, 850, 900]
};

export default function MerchantDashboard({ onOpenSellModal, onOpenChangePassword }) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'orders', 'add-product', 'sales-history', 'verifications'
  const [stats, setStats] = useState({ totalSales: 0, totalCommission: 0, netEarnings: 0, itemsSold: 0 });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [salesHistory, setSalesHistory] = useState([]);

  // Multi-image and translation states for the Add Product form
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [productLangTab, setProductLangTab] = useState('ar'); // 'ar' or 'fr'
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateSuccessMsg, setTranslateSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);
  const [videoError, setVideoError] = useState('');

  // New product form (mirrors admin product modal)
  const [productForm, setProductForm] = useState({
    type_vente: 'direct', // 'direct' or 'enchere'
    images: [],
    video: null,
    titre_ar: '',
    description_ar: '',
    titre_fr: '',
    description_fr: '',
    titre: '',
    description: '',
    gramme: '4.5',
    prix_gramme: '',
    prix: '',
    prix_depart: '',
    duree: 24,
    category_id: 'cat_rings',
    city: user?.city || 'Casablanca',
    adresse: '',
    etat: 'Neuf',
    matiere: 'Or',
    composants_poids: {
      collier: '',
      bracelet: '',
      bague: '',
      boucles: ''
    }
  });

  const isFetchingRef = useRef(false);

  const fetchMerchantData = async () => {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      // Stats
      const statRes = await fetch(`${API_URL}/stats/merchant/${user.id}`);
      if (statRes.ok) {
        const statData = await statRes.json();
        setStats(statData);
      }

      // Products (include merchant's products even if sold)
      const prodRes = await fetch(`${API_URL}/bijoux?commercant=${user.id}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // Categories
      const catRes = await fetch(`${API_URL}/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // Orders
      const ordRes = await fetch(`${API_URL}/commandes?merchant_id=${user.id}`);
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData);
      }

      // Sales History (for administrative & merchant tracking)
      const salesRes = await fetch(`${API_URL}/sales-history?vendeur_id=${user.id}`);
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSalesHistory(salesData);
      }

      // Platform Configuration & Suggestions
      try {
        const cfgRes = await fetch(`${API_URL}/config`);
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          if (cfg && cfg.product_suggestions) {
            setProductSuggestions({
              ...DEFAULT_SUGGESTIONS,
              ...cfg.product_suggestions
            });
          }
        }
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching merchant data:', err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchMerchantData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMerchantData();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Image compressor (converts to lightweight JPEG data URL max 1200px)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
      const compressed = await compressImage(file);
      if (compressed) {
        setProductForm(prev => ({
          ...prev,
          images: [...(prev.images || []), compressed]
        }));
      }
    }
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    const isVideo = /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(trimmed) || trimmed.startsWith('data:video/');
    if (isVideo) {
      setProductForm(prev => ({
        ...prev,
        video: trimmed
      }));
      setVideoDuration('10');
      setVideoError('');
    } else {
      setProductForm(prev => ({
        ...prev,
        images: [...(prev.images || []), trimmed]
      }));
    }
    setCustomImageUrl('');
  };

  // Video 10s max handlers
  const handleVideoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setVideoError('⚠️ حجم ملف الفيديو كبير جداً (أقصى حد هو 50 ميغابايت).');
      e.target.value = '';
      return;
    }

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      const duration = tempVideo.duration;

      if (duration > 10.9) {
        setVideoError(`⚠️ مدة هذا الفيديو (${Math.round(duration)} ثوانٍ) تتجاوز الحد الأقصى المسموح به (10 ثوانٍ). يرجى اختيار مقطع لا يتعدى 10 ثوانٍ.`);
        return;
      }

      setVideoError('');
      const cleanDuration = Math.round(duration * 10) / 10;
      setVideoDuration(cleanDuration);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setProductForm(prev => ({
            ...prev,
            video: reader.result
          }));
        }
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      setVideoError('تعذر قراءة صيغة الفيديو. يرجى تجربة ملف آخر (MP4/WebM/MOV).');
    };

    tempVideo.src = blobUrl;
    e.target.value = '';
  };

  const handleRemoveVideo = () => {
    setProductForm(prev => ({ ...prev, video: null }));
    setVideoDuration(null);
    setVideoError('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setProductForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSetPrimaryImage = (indexToPrimary) => {
    setProductForm(prev => {
      const imgs = [...(prev.images || [])];
      const selected = imgs.splice(indexToPrimary, 1)[0];
      return {
        ...prev,
        images: [selected, ...imgs]
      };
    });
  };

  // Auto-translate between Arabic and French
  const handleAutoTranslateProduct = async (sourceLang = productLangTab) => {
    const title = sourceLang === 'fr'
      ? (productForm.titre_fr || productForm.titre || '')
      : (productForm.titre_ar || '');
    const desc = sourceLang === 'fr'
      ? (productForm.description_fr || productForm.description || '')
      : (productForm.description_ar || '');

    if (!title.trim() && !desc.trim()) {
      alert('يرجى ملء العنوان أو الوصف أولاً لبدء الترجمة التلقائية.');
      return;
    }

    setIsTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'fr' : 'ar';
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sourceLang,
          targets: [targetLang],
          fields: {
            title,
            description: desc
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translations) {
          setProductForm(prev => {
            const updated = { ...prev };
            if (data.translations.ar) {
              if (data.translations.ar.title) updated.titre_ar = data.translations.ar.title;
              if (data.translations.ar.description) updated.description_ar = data.translations.ar.description;
            }
            if (data.translations.fr) {
              if (data.translations.fr.title) {
                updated.titre_fr = data.translations.fr.title;
                if (!updated.titre) updated.titre = data.translations.fr.title;
              }
              if (data.translations.fr.description) {
                updated.description_fr = data.translations.fr.description;
                if (!updated.description) updated.description = data.translations.fr.description;
              }
            }
            return updated;
          });
          setTranslateSuccessMsg('✓ تمت الترجمة التلقائية بنجاح!');
          setTimeout(() => setTranslateSuccessMsg(''), 4000);
        }
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const switchProductLangTab = (targetTab) => {
    const prevTab = productLangTab;
    setProductLangTab(targetTab);

    const prevTitle = prevTab === 'fr' ? (productForm.titre_fr || productForm.titre || '') : (productForm.titre_ar || '');
    const prevDesc = prevTab === 'fr' ? (productForm.description_fr || productForm.description || '') : (productForm.description_ar || '');
    const targetTitle = targetTab === 'fr' ? (productForm.titre_fr || productForm.titre || '') : (productForm.titre_ar || '');
    const targetDesc = targetTab === 'fr' ? (productForm.description_fr || productForm.description || '') : (productForm.description_ar || '');

    if ((prevTitle.trim() || prevDesc.trim()) && (!targetTitle.trim() && !targetDesc.trim())) {
      handleAutoTranslateProduct(prevTab);
    }
  };

  // Calcul automatique du prix: prix du gramme * gramme
  const handleGrammeChange = (val) => {
    setProductForm(prev => {
      const g = parseFloat(val);
      const pg = parseFloat(prev.prix_gramme);
      let newPrix = prev.prix;
      let newPrixDepart = prev.prix_depart;

      if (!isNaN(g) && g > 0 && !isNaN(pg) && pg > 0) {
        const total = Math.round(g * pg);
        if (prev.type_vente === 'enchere') {
          newPrixDepart = total;
        } else {
          newPrix = total;
        }
      }
      return {
        ...prev,
        gramme: val,
        prix: newPrix,
        prix_depart: newPrixDepart
      };
    });
  };

  const handlePrixGrammeChange = (val) => {
    setProductForm(prev => {
      const pg = parseFloat(val);
      const g = parseFloat(prev.gramme);
      let newPrix = prev.prix;
      let newPrixDepart = prev.prix_depart;

      if (!isNaN(pg) && pg > 0 && !isNaN(g) && g > 0) {
        const total = Math.round(g * pg);
        if (prev.type_vente === 'enchere') {
          newPrixDepart = total;
        } else {
          newPrix = total;
        }
      }
      return {
        ...prev,
        prix_gramme: val,
        prix: newPrix,
        prix_depart: newPrixDepart
      };
    });
  };

  const handleTotalPriceChange = (val) => {
    setProductForm(prev => {
      const p = parseFloat(val);
      const g = parseFloat(prev.gramme);
      let newPrixGramme = prev.prix_gramme;
      if (!isNaN(p) && p > 0 && !isNaN(g) && g > 0) {
        newPrixGramme = (p / g).toFixed(2);
      }
      return {
        ...prev,
        prix: val,
        prix_depart: prev.type_vente === 'enchere' ? val : prev.prix_depart,
        prix_gramme: newPrixGramme
      };
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const isAuction = productForm.type_vente === 'enchere';
    const effectivePrice = isAuction ? productForm.prix_depart : productForm.prix;
    const finalTitle = productForm.titre_ar || productForm.titre_fr || productForm.titre;

    if (!finalTitle || !effectivePrice) {
      alert('يرجى ملء عنوان القطعة والسعر.');
      return;
    }

    if (!productForm.images || productForm.images.length === 0) {
      alert('يرجى إضافة صورة واحدة على الأقل للقطعة (عبر رفع الملفات أو الرابط).');
      return;
    }

    setIsSubmitting(true);
    try {
      let cleanComposants = null;
      if (productForm.category_id === 'cat_sets' && productForm.composants_poids) {
        cleanComposants = {};
        for (const [key, val] of Object.entries(productForm.composants_poids)) {
          if (val && parseFloat(val) > 0) {
            cleanComposants[key] = parseFloat(val);
          }
        }
        if (Object.keys(cleanComposants).length === 0) cleanComposants = null;
      }

      const payload = {
        ...productForm,
        titre: finalTitle,
        titre_ar: productForm.titre_ar || finalTitle,
        titre_fr: productForm.titre_fr || finalTitle,
        description: productForm.description_ar || productForm.description_fr || productForm.description || '',
        description_ar: productForm.description_ar || productForm.description || '',
        description_fr: productForm.description_fr || productForm.description || '',
        prix: parseFloat(effectivePrice),
        gramme: parseFloat(productForm.gramme || 0),
        poids: parseFloat(productForm.gramme || 0),
        composants_poids: cleanComposants,
        type_vente: isAuction ? 'SECOND_HAND' : (productForm.etat === 'Neuf' ? 'FIRST_HAND' : 'SECOND_HAND'),
        disponibilite: isAuction ? 'enchere' : 'disponible',
        stock: 1,
        city: productForm.city || user.city || 'Casablanca',
        adresse: productForm.adresse || '',
        images: productForm.images,
        image: productForm.images[0],
        video: productForm.video || null,
        commercant_id: user.id,
        vendeur_nom: user.shopName || user.nom,
        vendeur_phone: user.phone || user.telephone || '',
        vendeur_type: 'bijouterie',
        statut: 'Validated'
      };

      const res = await fetch(`${API_URL}/bijoux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdBijou = await res.json();

        if (isAuction) {
          const durationHours = parseInt(productForm.duree) || 48;
          await fetch(`${API_URL}/encheres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bijou_id: createdBijou.id,
              prix_depart: parseFloat(productForm.prix_depart || productForm.prix),
              date_debut: new Date().toISOString(),
              date_fin: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
              increment_min: 50,
              prix_reserve: parseFloat(productForm.prix_depart || productForm.prix)
            })
          });
        }

        alert(isAuction ? '🔨 تم إنشاء ونشر المزاد المباشر بنجاح!' : '✨ تمت إضافة قطعة المجوهرات ونشرها بنجاح في المتجر!');

        // Reset form
        setProductForm({
          type_vente: 'direct',
          images: [],
          video: null,
          titre_ar: '',
          description_ar: '',
          titre_fr: '',
          description_fr: '',
          titre: '',
          description: '',
          gramme: '4.5',
          prix_gramme: '',
          prix: '',
          prix_depart: '',
          duree: 24,
          category_id: 'cat_rings',
          city: user?.city || 'Casablanca',
          adresse: '',
          etat: 'Neuf',
          matiere: 'Or',
          composants_poids: { collier: '', bracelet: '', bague: '', boucles: '' }
        });

        fetchMerchantData();
        setActiveTab('listings');
      } else {
        const errData = await res.json();
        alert(errData.message || 'حدث خطأ أثناء حفظ القطعة.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsSold = async (productId) => {
    if (!confirm('تأكيد تسجيل هذه القطعة كـ «مباعة» ؟\n\nوفقاً لنظام المنصة، ستظل القطعة ظاهرة مع شارة «مباع» لمدة 12 ساعة قبل إخفائها تلقائياً من الكتالوج العام.')) return;
    try {
      const res = await fetch(`${API_URL}/bijoux/${productId}/vendre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_phone: 'Vente directe boutique',
          canal: 'Direct'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✓ تم تأكيد البيع بنجاح! القطعة الآن مؤشرة كـ «مباعة» وستُحفظ في السجل التجاري.');
        fetchMerchantData();
      } else {
        alert(data.message || 'تعذر تسجيل القطعة كمباعة.');
      }
    } catch (err) {
      console.error('Error marking as sold:', err);
      alert('خطأ في الاتصال بالشبكة.');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/commandes/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchMerchantData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('هل أنت متأكد من حذف هذه القطعة من الكتالوج ؟')) return;
    try {
      await fetch(`${API_URL}/bijoux/${productId}`, { method: 'DELETE' });
      fetchMerchantData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div dir="rtl" style={{ maxWidth: '1440px', margin: '0 auto', padding: '36px 24px 60px', textAlign: 'right' }}>
      {/* 1. SELLER HEADER */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.8rem' }}>🏪</span>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-white)' }}>
              {user?.shopName || user?.nom || 'دار المجوهرات'}
            </h2>

            <span style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              ✓ تاجر معتمد وموثق
            </span>
          </div>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            فضاء التاجر المهني • إدارة الكتالوج، طلبيات الزبائن وتتبع المبيعات
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onOpenChangePassword && (
            <button
              onClick={onOpenChangePassword}
              className="btn-jewelia-secondary"
              style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              title="تغيير كلمة المرور"
            >
              🔐 كلمة المرور
            </button>
          )}

          <button
            onClick={() => setActiveTab('sales-history')}
            className="btn-jewelia-secondary"
            style={{ padding: '10px 20px', fontSize: '0.88rem' }}
          >
            📜 سجل المبيعات
          </button>

          <button
            onClick={() => setActiveTab('add-product')}
            className="btn-jewelia-primary"
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            ➕ إضافة قطعة مجوهرات
          </button>
        </div>
      </div>

      {/* 2. KPIS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            إجمالي المبيعات
          </span>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {stats.totalSales?.toLocaleString()} درهم
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: 600 }}>
            حجم المعاملات المنجزة
          </span>
        </div>

        {/* INDICATEUR ARGENT (REVENUS NETS) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            صافي الأرباح (المدخول الصافي)
          </span>
          <h3 style={{ fontSize: '1.75rem', color: '#10b981', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {stats.netEarnings?.toLocaleString()} درهم
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
            الرصيد المتاح • تاجر موثق
          </span>
        </div>

        {/* ARTICLES VENDUS & TRACABILITE */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              القطع المباعة
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-gold)' }}>✓ نشط</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {salesHistory.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', fontFamily: 'var(--font-sans)' }}>معاملة</span>
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '6px' }}>
            يتم حفظ وأرشفة القطع تلقائياً بعد البيع
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            الطلبيات الواردة
          </span>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {orders.length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-gold)' }}>
            ⭐ تقييم التاجر 4.9/5
          </span>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-gold)', marginBottom: '28px', overflowX: 'auto', paddingBottom: '6px' }}>
        {[
          { id: 'listings', label: '💎 معروضاتي في المتجر', count: products.length },
          { id: 'orders', label: '📦 الطلبيات الواردة', count: orders.length },
          { id: 'add-product', label: '➕ إضافة قطعة مجوهرات', count: null },
          { id: 'sales-history', label: '📜 سجل المبيعات', count: salesHistory.length, highlight: true },
          { id: 'verifications', label: '🛡️ التوثيق والشهادات', count: products.filter(p => p.type_vente === 'SECOND_HAND').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id
                ? (tab.highlight ? 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(179,135,40,0.15) 100%)' : 'rgba(179, 135, 40, 0.12)')
                : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary-gold)' : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              color: activeTab === tab.id ? 'var(--primary-gold)' : 'var(--text-gray)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-smooth)'
            }}
          >
            {tab.label} {tab.count !== null && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* TAB 1: LISTING */}
      {activeTab === 'listings' && (
        <div>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-gold)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '14px' }}>💍</span>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-white)', marginBottom: '8px' }}>
                لا توجد أي قطع مجوهرات معروضة حالياً
              </h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '20px' }}>
                ابدأ الآن بإضافة وعرض إبداعاتك ومجوهراتك الفاخرة للزبائن.
              </p>
              <button onClick={() => setActiveTab('add-product')} className="btn-jewelia-primary">
                ➕ إضافة أول قطعة مجوهرات
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {products.map(p => {
                const isSold = p.etat === 'Vendu';
                return (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <ProductCard product={p} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {isSold ? (
                        <div style={{ padding: '8px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ✓ تم البيع {p.sold_at ? `(${new Date(p.sold_at).toLocaleDateString('ar-MA')})` : ''}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkAsSold(p.id)}
                          style={{ padding: '8px 10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                          title="تسجيل القطعة كمباعة (تظل 12 ساعة ثم تؤرشف)"
                        >
                          🏷️ تسجيل كـ مباع
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        style={{ padding: '8px 10px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                      >
                        🗑️ حذف القطعة
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-gold)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '14px' }}>📦</span>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-white)', marginBottom: '8px' }}>
                لا توجد أي طلبيات في الانتظار
              </h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                ستظهر طلبيات الزبائن وتفاصيل الشراء هنا بمجرد تأكيد طلباتهم.
              </p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '22px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-gold)' }}>
                      طلب رقم #{order.id}
                    </span>
                    <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem', marginRight: '12px' }}>
                      الزبون : <strong style={{ color: 'var(--text-white)' }}>{order.client_nom}</strong> (<span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>{order.client_telephone}</span>) • {order.client_ville}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-gray)' }}>الحالة :</span>
                    <select
                      value={order.statut}
                      onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                      style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', color: 'var(--text-white)', borderRadius: '6px', fontSize: '0.84rem', outline: 'none' }}
                    >
                      <option value="Confirmed">مؤكدة (Confirmed)</option>
                      <option value="In Preparation">قيد التجهيز (In Preparation)</option>
                      <option value="Shipped">تم الشحن 🚚 (Shipped)</option>
                      <option value="Delivered">تم التوصيل ✓ (Delivered)</option>
                      <option value="Cancelled">ملغاة (Cancelled)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <span>{item.titre} (x{item.quantite})</span>
                      <strong style={{ color: 'var(--primary-gold)' }}>{(item.prix * item.quantite).toLocaleString()} درهم</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ADD PRODUCT (EXACTEMENT COMME LE BLOC D'ADMINISTRATION) */}
      {activeTab === 'add-product' && (
        <div style={{ maxWidth: '650px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ color: 'var(--primary-gold)', marginBottom: '22px', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', textAlign: 'center' }}>
            قطعة مجوهرات جديدة
          </h3>

          <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 1. PHOTOS DU BIJOU (MULTI-PHOTOS AVEC COMPRESSION) */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1.5px dashed var(--primary-gold)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-white)' }}>
                  <span style={{ fontSize: '1.2rem' }}>📷🎥</span>
                  <span>صور وفيديو القطعة (أضف صور أو فيديو 10 ثوانٍ كحد أقصى)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '12px', border: '1px solid var(--border-gold)' }}>
                    {(productForm.images || []).length} صورة
                  </span>
                  {productForm.video && (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '12px', border: '1px solid #10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      🎥 فيديو ({videoDuration ? `${videoDuration}s` : '10s max'})
                    </span>
                  )}
                </div>
              </div>

              {/* معرض الصور والفيديو المصغرة */}
              {((productForm.images || []).length > 0 || productForm.video) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {/* معاينة الفيديو إذا كان مرفقاً */}
                  {productForm.video && (
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid #10b981',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.45)',
                        background: '#07090b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <video
                        src={productForm.video}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        playsInline
                        loop
                        controls={false}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: 'rgba(16, 185, 129, 0.95)',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        ▶ {videoDuration ? `${videoDuration}s` : '10s'}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        title="حذف الفيديو"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(220, 38, 38, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {productForm.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: idx === 0 ? '2.5px solid var(--primary-gold)' : '1px solid var(--border-gold)',
                        boxShadow: idx === 0 ? '0 0 8px rgba(212, 175, 55, 0.35)' : 'none',
                        background: '#07090b'
                      }}
                    >
                      <img
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* شارة الصورة الرئيسية */}
                      {idx === 0 ? (
                        <span style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                          color: '#000',
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          padding: '2px 4px',
                          borderRadius: '4px'
                        }}>
                          ★ الرئيسية
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          title="تعيين كصورة رئيسية"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                        >
                          ★ تعيين
                        </button>
                      )}

                      {/* زر الحذف */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="حذف هذه الصورة"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(220, 38, 38, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* أزرار اختيار الملفات، تصوير/رفع الفيديو، وإضافة الرابط */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="merchant-multi-photo-input"
                  style={{ display: 'none' }}
                  onChange={handleFilesSelected}
                />
                <label
                  htmlFor="merchant-multi-photo-input"
                  className="btn-jewelia-primary"
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '7px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    margin: 0
                  }}
                >
                  📁 اختيار صورة أو عدة صور
                </label>

                {/* زر رفع فيديو 10 ثوانٍ كحد أقصى */}
                <input
                  type="file"
                  accept="video/*"
                  id="merchant-video-upload-input"
                  style={{ display: 'none' }}
                  onChange={handleVideoSelected}
                />
                <label
                  htmlFor="merchant-video-upload-input"
                  className="btn-jewelia-secondary"
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '7px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    margin: 0,
                    background: productForm.video ? 'rgba(16, 185, 129, 0.2)' : undefined,
                    borderColor: productForm.video ? '#10b981' : undefined,
                    color: productForm.video ? '#10b981' : undefined
                  }}
                >
                  🎥 {productForm.video ? 'تغيير فيديو القطعة (10s max)' : 'فيديو القطعة (10s max)'}
                </label>

                <div style={{ display: 'flex', flex: 1, minWidth: '220px', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="أو الصق رابط صورة/فيديو..."
                    value={customImageUrl}
                    onChange={e => setCustomImageUrl(e.target.value)}
                    className="filter-select-control"
                    style={{ fontSize: '0.82rem', padding: '6px 10px', margin: 0 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="btn-jewelia-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    ➕ إضافة
                  </button>
                </div>
              </div>

              {/* تنبيه خطأ الفيديو إن وجد */}
              {videoError && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  background: 'rgba(220, 38, 38, 0.15)',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
                  <span>{videoError}</span>
                </div>
              )}
            </div>

            {/* 3. MULTILINGUAL CONTENT SECTION (CONTENU EN 3 LANGUES) */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1.5px solid var(--primary-gold)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                {/* التبديل بين اللغات */}
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => switchProductLangTab('ar')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: productLangTab === 'ar' ? 'var(--primary-gold)' : 'transparent',
                      color: productLangTab === 'ar' ? '#000' : 'var(--text-gray)'
                    }}
                  >
                    🇲🇦 العربية {productForm.titre_ar ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchProductLangTab('fr')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: productLangTab === 'fr' ? 'var(--primary-gold)' : 'transparent',
                      color: productLangTab === 'fr' ? '#000' : 'var(--text-gray)'
                    }}
                  >
                    🇫🇷 Français {productForm.titre_fr ? '✓' : ''}
                  </button>
                </div>

                {/* زر الترجمة التلقائية الذكية */}
                <button
                  type="button"
                  onClick={() => handleAutoTranslateProduct(productLangTab)}
                  disabled={isTranslating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                    color: '#07090b',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: isTranslating ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                  }}
                  title="ترجمة تلقائية للمحتوى فوراً"
                >
                  {isTranslating ? '⏳ جاري الترجمة...' : '✨ ترجمة تلقائية (عربي ⇄ فرنسي)'}
                </button>
              </div>

              {translateSuccessMsg && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  color: '#10b981',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>✓</span> {translateSuccessMsg}
                </div>
              )}

              {/* حقول اللغة العربية */}
              {productLangTab === 'ar' && (
                <div dir="rtl">
                  <div style={{ marginBottom: '14px' }}>
                    <label className="filter-label" style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right', marginBottom: '6px' }}>
                      <span>العنوان باللغة العربية 🇲🇦</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>مطلوب</span>
                    </label>
                    <input
                      type="text"
                      className="filter-select-control"
                      dir="rtl"
                      placeholder="مثال: خاتم سوليتير ألماس ذهب أبيض 18 قيراط"
                      value={productForm.titre_ar}
                      onChange={e => setProductForm({ ...productForm, titre_ar: e.target.value })}
                    />
                    {/* اقتراحات سريعة للعنوان */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1f' }}>⚡ اقتراحات :</span>
                      {(productSuggestions.titre_ar || DEFAULT_SUGGESTIONS.titre_ar).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, titre_ar: sug })}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #d4af37',
                            borderRadius: '14px',
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#8a6410',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="filter-label" style={{ textAlign: 'right', marginBottom: '6px', display: 'block' }}>الوصف باللغة العربية 🇲🇦</label>
                    <textarea
                      className="filter-select-control"
                      rows="3"
                      dir="rtl"
                      placeholder="وصف تفصيلي للقطعة باللغة العربية..."
                      value={productForm.description_ar}
                      onChange={e => setProductForm({ ...productForm, description_ar: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                    {/* اقتراحات سريعة للوصف */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1f' }}>⚡ أضف للوصف :</span>
                      {(productSuggestions.description_ar || DEFAULT_SUGGESTIONS.description_ar).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({
                            ...productForm,
                            description_ar: productForm.description_ar ? `${productForm.description_ar} • ${sug}` : sug
                          })}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '14px',
                            padding: '5px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* حقول اللغة الفرنسية */}
              {productLangTab === 'fr' && (
                <div dir="ltr" style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <label className="filter-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Titre en Français 🇫🇷</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Obligatoire</span>
                    </label>
                    <input
                      type="text"
                      className="filter-select-control"
                      placeholder="ex: Bague Solitaire Diamant Or Blanc 18K"
                      value={productForm.titre_fr}
                      onChange={e => setProductForm({ ...productForm, titre_fr: e.target.value, titre: e.target.value })}
                    />
                    {/* Suggestions Titre */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1f' }}>⚡ Suggestions :</span>
                      {(productSuggestions.titre_fr || DEFAULT_SUGGESTIONS.titre_fr).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, titre_fr: sug, titre: sug })}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #d4af37',
                            borderRadius: '14px',
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#8a6410',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="filter-label" style={{ marginBottom: '6px', display: 'block' }}>Description en Français 🇫🇷</label>
                    <textarea
                      className="filter-select-control"
                      rows="3"
                      placeholder="Description détaillée du bijou en français..."
                      value={productForm.description_fr}
                      onChange={e => setProductForm({ ...productForm, description_fr: e.target.value, description: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                    {/* Suggestions Description */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1f' }}>⚡ Insérer dans le texte :</span>
                      {(productSuggestions.description_fr || DEFAULT_SUGGESTIONS.description_fr).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({
                            ...productForm,
                            description_fr: productForm.description_fr ? `${productForm.description_fr} • ${sug}` : sug,
                            description: productForm.description_fr ? `${productForm.description_fr} • ${sug}` : sug
                          })}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '14px',
                            padding: '5px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. POIDS, PRIX DU GRAMME ET PRIX TOTAL CALCULÉ (الوزن، سعر الغرام وحساب سعر القطعة) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                  الوزن (غ / g) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  placeholder="مثال: 4.5"
                  className="filter-select-control"
                  value={productForm.gramme}
                  onChange={e => handleGrammeChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                  سعر الغرام (درهم / غ)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="مثال: 850"
                  className="filter-select-control"
                  value={productForm.prix_gramme || ''}
                  onChange={e => handlePrixGrammeChange(e.target.value)}
                />
                {/* اقتراحات سريعة لسعر الغرام */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {(productSuggestions.prix_gramme || DEFAULT_SUGGESTIONS.prix_gramme).map(pg => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => handlePrixGrammeChange(pg)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #d4af37',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#8a6410',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}
                    >
                      {pg} {lang === 'ar' ? 'د.م' : 'DH'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                  سعر القطعة (درهم / MAD) *
                </label>
                <input
                  type="number"
                  min="100"
                  placeholder="مثال: 6400"
                  className="filter-select-control"
                  value={productForm.prix}
                  onChange={e => handleTotalPriceChange(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* مؤشر الحساب التلقائي لسعر القطعة: سعر الغرام × الوزن */}
            {(parseFloat(productForm.gramme) > 0 && parseFloat(productForm.prix_gramme) > 0) && (
              <div style={{
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid var(--primary-gold)',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '0.88rem',
                color: 'var(--primary-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <span style={{ fontSize: '1.2rem' }}>🧮</span>
                <span>
                  <strong>سعر القطعة المحسوب : </strong>
                  {productForm.gramme} غرام × {productForm.prix_gramme} درهم/غ = <strong style={{ color: '#fff', fontSize: '1.05rem', textDecoration: 'underline' }}>{Math.round(parseFloat(productForm.gramme) * parseFloat(productForm.prix_gramme)).toLocaleString()} درهم</strong>
                </span>
              </div>
            )}

            {/* 5. الفئة وقائمة المدن المغربية */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block' }}>فئة المجوهرات *</label>
                <select
                  className="filter-select-control"
                  value={productForm.category_id}
                  onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                  required
                >
                  <option value="">-- اختر الفئة --</option>
                  {categories && categories.length > 0 ? (
                    categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '💎'} {c.nom_ar || c.nom_fr || c.nom}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="cat_rings">💍 خواتم (Bagues)</option>
                      <option value="cat_necklaces">📿 قلادات وسلاسل (Colliers)</option>
                      <option value="cat_bracelets">🔗 أساور (Bracelets)</option>
                      <option value="cat_earrings">👂 أقراط وحلق (Boucles d'oreilles)</option>
                      <option value="cat_sets">💎 أطقم كاملة (Parures)</option>
                      <option value="cat_men">⌚ مجوهرات رجالية (Bijoux Homme)</option>
                      <option value="cat_boxes">🎁 علب وهدايا فاخرة (Coffrets)</option>
                      <option value="cat_traditional">👑 مجوهرات تقليدية (Traditionnels)</option>
                      <option value="cat_artisanal">🏺 قطعة أثرية نادرة (Pièce antique)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block' }}>المدينة *</label>
                <select
                  className="filter-select-control"
                  value={productForm.city || 'Casablanca'}
                  onChange={e => setProductForm({ ...productForm, city: e.target.value })}
                  required
                >
                  {ALL_MOROCCAN_CITIES.map(city => (
                    <option key={city.key} value={city.key}>
                      {`${city.ar} (${city.fr})`}
                    </option>
                  ))}
                  <option value="Autre">مدينة أخرى</option>
                </select>
              </div>
            </div>

            {/* 6. حالة القطعة (ÉTAT DU BIJOU) */}
            <div style={{ marginBottom: '4px' }}>
              <label className="filter-label" style={{ marginBottom: '8px', display: 'block' }}>حالة القطعة</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { value: 'Neuf', label: '✨ جديد' },
                  { value: 'Occasion', label: '🏷️ مستعمل ممتازة' },
                  { value: 'Artisanal', label: '🏺 قطعة أثرية' }
                ].map(item => {
                  const isActive = (productForm.etat || 'Neuf') === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, etat: item.value })}
                      style={{
                        padding: '10px 4px',
                        minHeight: '46px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: isActive ? '1.5px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.12)',
                        background: isActive ? 'rgba(212, 175, 55, 0.16)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? 'var(--primary-gold)' : 'var(--text-gray)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* تفاصيل وزن مكونات الطقم إذا كانت الفئة أطقم (Parures) */}
            {productForm.category_id === 'cat_sets' && (
              <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed var(--primary-gold)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary-gold)', marginBottom: '4px' }}>
                  💎 تفصيل وزن مكونات الطقم (اختياري)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)', marginBottom: '12px' }}>
                  سجل الوزن الفردي لكل عنصر لتوفير أقصى قدر من الشفافية للمشترين.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>قلادة (غ)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="14.5"
                      value={productForm.composants_poids?.collier || ''}
                      onChange={e => setProductForm({
                        ...productForm,
                        composants_poids: { ...productForm.composants_poids, collier: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>سوار (غ)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="8.2"
                      value={productForm.composants_poids?.bracelet || ''}
                      onChange={e => setProductForm({
                        ...productForm,
                        composants_poids: { ...productForm.composants_poids, bracelet: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>خاتم (غ)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="4.1"
                      value={productForm.composants_poids?.bague || ''}
                      onChange={e => setProductForm({
                        ...productForm,
                        composants_poids: { ...productForm.composants_poids, bague: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>أقراط (غ)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="5.0"
                      value={productForm.composants_poids?.boucles || ''}
                      onChange={e => setProductForm({
                        ...productForm,
                        composants_poids: { ...productForm.composants_poids, boucles: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* زر الحفظ والنشر */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-jewelia-primary"
              style={{ marginTop: '10px', padding: '12px 24px', fontSize: '1rem', fontWeight: 800 }}
            >
              {isSubmitting ? '⏳ جاري الحفظ والنشر...' : '✨ حفظ ونشر القطعة في المتجر'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: HISTORIQUE DES VENTES & TRACABILITE */}
      {activeTab === 'sales-history' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
            <div>
              <div className="hero-pill-badge" style={{ background: 'rgba(212, 175, 55, 0.15)', borderColor: 'var(--primary-gold)', color: 'var(--primary-gold)', marginBottom: '8px' }}>
                📜 السجل التجاري للمبيعات
              </div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', margin: 0 }}>
                سجل المبيعات والصفقات المكتملة
              </h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem', margin: '4px 0 0' }}>
                تتبع دقيق لجميع القطع المباعة في المتجر. يتم الاحتفاظ بها لأرشفة معاملات التاجر وتوثيقها.
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase' }}>إجمالي حجم المبيعات</span>
              <div style={{ fontSize: '1.6rem', color: 'var(--primary-gold)', fontWeight: 800 }}>
                {salesHistory.reduce((sum, s) => sum + (Number(s.prix_vente) || 0), 0).toLocaleString()} درهم
              </div>
            </div>
          </div>

          {salesHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-gold)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📦</span>
              <h4 style={{ color: 'var(--text-white)', fontSize: '1.1rem', marginBottom: '6px' }}>لا توجد أي مبيعات مسجلة حتى الآن</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>
                عند بيع أي قطعة أو تسجيلها كمباعة، ستتم أرشفة كامل معلوماتها (المرجع، السعر، التاريخ ورقم العملية) هنا.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-gold)', color: 'var(--text-gray)' }}>
                    <th style={{ padding: '12px 14px' }}>مرجع القطعة</th>
                    <th style={{ padding: '12px 14px' }}>اسم القطعة</th>
                    <th style={{ padding: '12px 14px' }}>التاجر</th>
                    <th style={{ padding: '12px 14px' }}>سعر البيع</th>
                    <th style={{ padding: '12px 14px' }}>التاريخ والوقت</th>
                    <th style={{ padding: '12px 14px' }}>الحالة</th>
                    <th style={{ padding: '12px 14px' }}>رقم المعاملة</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((s, idx) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-white)' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--primary-gold)', fontWeight: 700 }}>
                        {s.reference || s.article_id || 'ORIA-ART'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {s.titre || s.article_nom}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-gray)' }}>
                        {s.vendeur_nom || 'متجر معتمد'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--primary-gold)' }}>
                        {(Number(s.prix_vente) || 0).toLocaleString()} درهم
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-gray)', fontSize: '0.82rem' }}>
                        {s.sold_at ? new Date(s.sold_at).toLocaleString('ar-MA') : 'مؤكد'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          ✓ مباع
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--text-gray)', fontSize: '0.78rem' }}>
                        {s.transaction_id || `TRX-${s.id || idx}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUTHENTIFICATION */}
      {activeTab === 'verifications' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '30px', boxShadow: 'var(--shadow-card)' }}>
          <div className="hero-pill-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', color: '#0891b2' }}>
            🛡️ مختبر الخبرة والتوثيق المعتمد
          </div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-white)', marginBottom: '10px' }}>
            متابعة توثيق وفحص القطع الخاصة بك
          </h3>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '24px' }}>
            تحصل كل قطعة مجوهرات مستعملة على شهادة رقمية موثقة بعد الفحص والتأكد من نقاء الذهب والأحجار الكريمة.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.filter(p => p.type_vente === 'SECOND_HAND').map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ color: 'var(--text-white)' }}>{p.titre}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '2px' }}>
                    الحالة : {p.etat} • السنة : {p.annee || '2026'} • الشهادة : {p.certificat ? 'متوفرة' : 'قيد الفحص'}
                  </div>
                </div>

                <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #10b981' }}>
                  ✓ {p.authentifie || 'تم التوثيق'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
