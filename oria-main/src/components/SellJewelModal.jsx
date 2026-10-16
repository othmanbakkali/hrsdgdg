import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function SellJewelModal({ isOpen, onClose, onProductPublished }) {
  const { lang, isRtl } = useLanguage();
  const { user } = useAuth();

  // Current Gold rate for live intrinsic calculation (MAD/g for 18k)
  const [goldRate18k, setGoldRate18k] = useState(1045);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type_vente: 'SECOND_HAND', // 'FIRST_HAND', 'SECOND_HAND', 'AUCTION'
    category_id: 'cat_rings',
    matiere: 'Or Jaune',
    purete: '18k',
    poids: '4.5',
    pierre: 'Diamant',
    taille: '54',
    etat: 'Excellent état',
    annee: '2024',
    prix: '5900',
    ancien_prix: '6800',
    prix_depart: '4500',
    duree_enchere: '48',
    city: user?.city || 'Casablanca',
    facture: true,
    certificat: true,
    boite: true,
    garantie: true,
    video: null,
    images: [
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80'
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showCustomWeight, setShowCustomWeight] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [videoError, setVideoError] = useState('');
  const [videoDuration, setVideoDuration] = useState(null);
  const [showHallmarkGuide, setShowHallmarkGuide] = useState(false);

  // Fetch current live gold rates
  useEffect(() => {
    fetch(`${API_URL}/gold-rates`)
      .then(res => res.json())
      .then(data => {
        if (data?.currentPrice18k) {
          setGoldRate18k(data.currentPrice18k);
        }
      })
      .catch(() => {});
  }, []);

  // Preset Catalog Samples
  const sampleJewelPresets = [
    {
      labelAr: '💍 خاتم سوليتير ألماس 18k',
      labelFr: '💍 Bague Solitaire Diamant 18K',
      category_id: 'cat_rings',
      matiere: 'Or Blanc',
      purete: '18k',
      poids: '3.8',
      pierre: 'Diamant',
      etat: 'Neuf',
      prix: '6400',
      ancien_prix: '7200',
      type_vente: 'FIRST_HAND',
      images: ['https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80']
    },
    {
      labelAr: '📿 قلادة ملكية ذهب أصفر 18k',
      labelFr: '📿 Collier Royal Or Jaune 18K',
      category_id: 'cat_necklaces',
      matiere: 'Or Jaune',
      purete: '18k',
      poids: '8.5',
      pierre: 'Aucune',
      etat: 'Excellent état',
      prix: '10200',
      ancien_prix: '11500',
      type_vente: 'SECOND_HAND',
      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80']
    },
    {
      labelAr: '🔗 سوار كارتييه فاخر 18k',
      labelFr: '🔗 Bracelet Chic Or Rose 18K',
      category_id: 'cat_bracelets',
      matiere: 'Or Rose',
      purete: '18k',
      poids: '12.0',
      pierre: 'Diamant',
      etat: 'Comme neuf',
      prix: '14800',
      ancien_prix: '16500',
      type_vente: 'SECOND_HAND',
      images: ['https://images.unsplash.com/photo-1611591475168-5e8a719003ff?w=800&auto=format&fit=crop&q=80']
    },
    {
      labelAr: '🔨 مزاد: طقم ملكي ألماس وزمرد',
      labelFr: '🔨 Enchère : Parure Émeraude & Or',
      category_id: 'cat_sets',
      matiere: 'Or Jaune',
      purete: '18k',
      poids: '24.5',
      pierre: 'Émeraude',
      etat: 'Excellent état',
      prix_depart: '25000',
      duree_enchere: '48',
      type_vente: 'AUCTION',
      images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80']
    }
  ];

  // Moroccan cities pills
  const topCities = [
    { key: 'Casablanca', ar: 'الدار البيضاء', fr: 'Casablanca' },
    { key: 'Rabat', ar: 'الرباط', fr: 'Rabat' },
    { key: 'Marrakech', ar: 'مراكش', fr: 'Marrakech' },
    { key: 'Fès', ar: 'فاس', fr: 'Fès' },
    { key: 'Tanger', ar: 'طنجة', fr: 'Tanger' },
    { key: 'Agadir', ar: 'أكادير', fr: 'Agadir' }
  ];

  // Quick weight pills
  const weightPresets = ['1.5', '2.5', '3.8', '5.0', '7.5', '10.0', '15.0', '25.0'];

  // Categories list
  const categoryOptions = [
    { id: 'cat_rings', ar: '💍 خواتم', fr: '💍 Bagues' },
    { id: 'cat_necklaces', ar: '📿 قلائد وسلاسل', fr: '📿 Colliers' },
    { id: 'cat_bracelets', ar: '🔗 أساور وبراسليات', fr: '🔗 Bracelets' },
    { id: 'cat_earrings', ar: '👂 أقراط وحلق', fr: '👂 Boucles' },
    { id: 'cat_sets', ar: '💎 أطقم كاملة', fr: '💎 Parures' },
    { id: 'cat_men', ar: '⌚ ساعات ومجوهرات رجالية', fr: '⌚ Montres & Homme' },
    { id: 'cat_boxes', ar: '🎁 هدايا وتحف', fr: '🎁 Coffrets' },
    { id: 'cat_traditional', ar: '👑 مجوهرات تقليدية', fr: '👑 Bijoux Traditionnels' },
    { id: 'cat_artisanal', ar: '🏺 قطعة تقليدية وحرفية', fr: '🏺 Pièce artisanale' }
  ];

  // Materials
  const materialOptions = [
    { id: 'Or Jaune', ar: '🟡 ذهب أصفر', fr: '🟡 Or Jaune' },
    { id: 'Or Blanc', ar: '⚪ ذهب أبيض', fr: '⚪ Or Blanc' },
    { id: 'Or Rose', ar: '🌸 ذهب وردي', fr: '🌸 Or Rose' },
    { id: 'Argent', ar: '▫️ فضة 1000', fr: '▫️ Argent 1000' },
    { id: 'Platine', ar: '✨ بلاتين', fr: '✨ Platine' }
  ];

  // Purity
  const purityOptions = [
    { id: '18k', ar: '⭐ عيار 18k (المغربي الرسمي)', fr: '⭐ 18 Carats (750‰)' },
    { id: '21k', ar: '⭐⭐ عيار 21k (875‰)', fr: '⭐⭐ 21 Carats (875‰)' },
    { id: '24k', ar: '👑 عيار 24k (ذهب خالص 999‰)', fr: '👑 24 Carats (Pur 999‰)' },
    { id: '1000', ar: '▫️ فضة خالصة 1000', fr: '▫️ Argent Massif 1000' }
  ];

  // Gemstones
  const stoneOptions = [
    { id: 'Diamant', ar: '💎 ألماس طبيعي', fr: '💎 Diamant' },
    { id: 'Émeraude', ar: '🟢 زمرد كولومبي', fr: '🟢 Émeraude' },
    { id: 'Rubis', ar: '🔴 ياقوت أحمر', fr: '🔴 Rubis' },
    { id: 'Saphir', ar: '🔵 زفير أزرق', fr: '🔵 Saphir' },
    { id: 'Perle', ar: '⚪ لؤلؤ طبيعي', fr: '⚪ Perle' },
    { id: 'Zircon', ar: '✨ زركون برّاق', fr: '✨ Zircon' },
    { id: 'Aucune', ar: '🚫 بدون أحجار (ذهب خالص)', fr: '🚫 Sans pierres (Or pur)' }
  ];

  // Condition / Etat
  const conditionOptions = [
    { id: 'Neuf', ar: '🌟 جديد تماماً بالعلبة', fr: '🌟 Neuf sous écrin' },
    { id: 'Excellent état', ar: '✨ كالجديد ممتاز', fr: '✨ Excellent état' },
    { id: 'Très bon état', ar: '👌 حالة جيدة جداً', fr: '👌 Très bon état' }
  ];

  // Sample image gallery shortcuts
  const sampleImages = [
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1611591475168-5e8a719003ff?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80'
  ];

  // Automatic AI Title & Description Generator (Zero Typing Needed!)
  const generateAITitleAndDescription = () => {
    const catName = categoryOptions.find(c => c.id === formData.category_id)?.[lang === 'ar' ? 'ar' : 'fr'] || 'Bijou';
    const cleanCat = catName.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '').trim();
    const stoneStr = formData.pierre !== 'Aucune' ? (lang === 'ar' ? `مرصع بـ ${formData.pierre}` : `serti de ${formData.pierre}`) : '';
    const weightStr = formData.poids ? `${formData.poids}g` : '';

    let generatedTitle = '';
    let generatedDesc = '';

    if (lang === 'ar') {
      generatedTitle = `${cleanCat} راقٍ من ${formData.matiere} عيار ${formData.purete} ${stoneStr} (${weightStr})`.trim();
      generatedDesc = `قطعة مجوهرات راقية مصنوعة بعناية من ${formData.matiere} عيار ${formData.purete} بوزن ${weightStr}. ${stoneStr ? 'مرصعة بأجود الأحجار الكريمة المنتقاة بدقة.' : 'تصميم نقي من الذهب الخالص.'} الحالة: ${formData.etat}. القطعة مرفقة بـ: ${formData.certificat ? 'شهادة الأصالة، ' : ''}${formData.facture ? 'فاتورة معتمدة، ' : ''}${formData.boite ? 'علبة فاخرة.' : ''} توصيل مؤمن ومضمون في جميع أنحاء المغرب.`;
    } else {
      generatedTitle = `${cleanCat} Élégant en ${formData.matiere} ${formData.purete} ${stoneStr} (${weightStr})`.trim();
      generatedDesc = `Magnifique bijou confectionné en ${formData.matiere} ${formData.purete} avec un poids de ${weightStr}. ${stoneStr ? 'Sublimé par des pierres de qualité supérieure.' : 'Design épuré et intemporel.'} État : ${formData.etat}. Fourni avec : ${formData.certificat ? 'certificat d\'authenticité, ' : ''}${formData.facture ? 'facture officielle, ' : ''}${formData.boite ? 'écrin de luxe.' : ''} Expédition rapide et sécurisée avec remise en main propre.`;
    }

    setFormData(prev => ({
      ...prev,
      titre: generatedTitle,
      description: generatedDesc
    }));

    setToastMessage(lang === 'ar' ? '✨ تم توليد العنوان والوصف الذكي تلقائياً بنجاح !' : '✨ Titre et description générés avec succès !');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Preset 1-Click Fast Fill
  const applyPreset = (preset) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        ...preset,
        titre: '',
        description: ''
      };
      return updated;
    });

    // Auto-generate title & description immediately
    setTimeout(() => {
      generateAITitleAndDescription();
    }, 50);

    setToastMessage(lang === 'ar' ? `✨ تم تطبيق نموذج ${preset.labelAr} بنجاح !` : `✨ Modèle ${preset.labelFr} appliqué !`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Calculate intrinsic gold raw value
  const numPoids = parseFloat(formData.poids) || 0;
  const rawGoldValue = Math.round(numPoids * goldRate18k);

  // Apply suggested pricing based on raw gold value
  const applySuggestedPrice = (multiplier) => {
    const suggested = Math.round(rawGoldValue * multiplier);
    if (formData.type_vente === 'AUCTION') {
      setFormData(prev => ({ ...prev, prix_depart: suggested.toString() }));
    } else {
      const oldP = Math.round(suggested * 1.15);
      setFormData(prev => ({ ...prev, prix: suggested.toString(), ancien_prix: oldP.toString() }));
    }
  };

  // Image handlers
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), reader.result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), customImageUrl.trim()]
    }));
    setCustomImageUrl('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSetPrimaryImage = (indexToPrimary) => {
    setFormData(prev => {
      const imgs = [...(prev.images || [])];
      const selected = imgs.splice(indexToPrimary, 1)[0];
      return { ...prev, images: [selected, ...imgs] };
    });
  };

  // Video handlers (10s max duration enforcement)
  const handleVideoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit early (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setVideoError(
        lang === 'ar'
          ? '⚠️ حجم ملف الفيديو كبير جداً (أقصى حد هو 50 ميغابايت).'
          : '⚠️ La vidéo est trop volumineuse (maximum 50 Mo).'
      );
      e.target.value = '';
      return;
    }

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      const duration = tempVideo.duration;

      // Strictly enforce 10 seconds limit (allowing a tiny 0.9s tolerance for phone encoder rounding)
      if (duration > 10.9) {
        setVideoError(
          lang === 'ar'
            ? `⚠️ مدة هذا الفيديو (${Math.round(duration)} ثوانٍ) تتجاوز الحد الأقصى (10 ثوانٍ). يرجى تسجيل أو اختيار مقطع لا يتعدى 10 ثوانٍ.`
            : `⚠️ La durée de la vidéo (${Math.round(duration)}s) dépasse le maximum autorisé (10 secondes). Veuillez choisir un extrait de 10s maximum.`
        );
        return;
      }

      setVideoError('');
      const cleanDuration = Math.round(duration * 10) / 10;
      setVideoDuration(cleanDuration);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormData(prev => ({
            ...prev,
            video: reader.result
          }));
          setToastMessage(
            lang === 'ar'
              ? `🎥 تم إرفاق فيديو القطعة بنجاح (${cleanDuration} ثوانٍ) !`
              : `🎥 Vidéo de la pièce ajoutée avec succès (${cleanDuration}s) !`
          );
          setTimeout(() => setToastMessage(''), 3500);
        }
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      setVideoError(
        lang === 'ar'
          ? 'تعذر قراءة صيغة الفيديو. يرجى تجربة ملف آخر (MP4/WebM/MOV).'
          : 'Format vidéo non reconnu. Veuillez essayer un autre fichier.'
      );
    };

    tempVideo.src = blobUrl;
    e.target.value = '';
  };

  const handleRemoveVideo = () => {
    setFormData(prev => ({ ...prev, video: null }));
    setVideoDuration(null);
    setVideoError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-fill title if empty
    if (!formData.titre) {
      generateAITitleAndDescription();
    }

    const effectivePrice = formData.type_vente === 'AUCTION' 
      ? (formData.prix_depart || formData.prix) 
      : (formData.prix || formData.prix_depart);

    if (!effectivePrice) {
      alert(lang === 'ar' ? 'يرجى تحديد السعر أو سعر انطلاق المزاد.' : 'Veuillez renseigner le prix.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isAuction = formData.type_vente === 'AUCTION';
      const finalTitle = formData.titre || (lang === 'ar' ? 'قطعة مجوهرات راقية' : 'Bijou d\'exception');
      const finalDesc = formData.description || finalTitle;

      const payload = {
        ...formData,
        titre: finalTitle,
        titre_ar: finalTitle,
        titre_fr: finalTitle,
        description: finalDesc,
        description_ar: finalDesc,
        description_fr: finalDesc,
        prix: parseFloat(effectivePrice),
        ancien_prix: formData.ancien_prix ? parseFloat(formData.ancien_prix) : null,
        poids: parseFloat(formData.poids || 3),
        gramme: parseFloat(formData.poids || 3),
        type_vente: isAuction ? 'SECOND_HAND' : formData.type_vente,
        disponibilite: isAuction ? 'enchere' : 'disponible',
        commercant_id: user ? user.id : 'u_particulier1',
        vendeur_nom: user ? (user.shopName || user.nom) : 'Particulier Vérifié',
        vendeur_phone: user?.phone || user?.telephone || '',
        vendeur_type: user?.role === 'commercant' ? 'bijouterie' : 'particulier',
        statut: 'Validated'
      };

      const res = await fetch(`${API_URL}/bijoux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdBijou = await res.json();

        // If auction, create auction record
        if (isAuction) {
          const durationHours = parseInt(formData.duree_enchere) || 48;
          await fetch(`${API_URL}/encheres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bijou_id: createdBijou.id,
              prix_depart: parseFloat(formData.prix_depart) || parseFloat(formData.prix),
              date_debut: new Date().toISOString(),
              date_fin: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
              increment_min: 50,
              prix_reserve: parseFloat(formData.prix_depart) || parseFloat(formData.prix)
            })
          }).catch(() => {});
        }

        setSuccessMessage(isAuction 
          ? (lang === 'ar' ? '🔨 تم إطلاق المزاد الحي بنجاح! القطعة معروضة الآن للمزايدة.' : '🔨 Enchère lancée avec succès ! Le lot est désormais en direct.')
          : (lang === 'ar' ? '✨ تهانينا! تم نشر قطعتك بنجاح في سوق المجوهرات.' : '✨ Félicitations ! Votre bijou a été publié avec succès.')
        );

        setTimeout(() => {
          if (onProductPublished) onProductPublished(createdBijou);
          setIsSubmitting(false);
          setSuccessMessage('');
          onClose();
        }, 1800);
      } else {
        const errData = await res.json();
        alert(errData.message || (lang === 'ar' ? 'حدث خطأ أثناء نشر القطعة.' : 'Erreur lors de la publication.'));
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'خطأ في الاتصال بالخادم.' : 'Erreur de connexion au serveur.');
      setIsSubmitting(false);
    }
  };

  // Live Listing Quality Score & Selling Probability
  const calculateListingScore = () => {
    let score = 0;
    const tips = [];

    // Photos
    const imgCount = (formData.images || []).length;
    if (imgCount >= 1) score += 20;
    if (imgCount >= 3) {
      score += 10;
    } else {
      tips.push(lang === 'ar' ? 'أضف صورتين إضافيتين من زوايا مختلفة لرفع ثقة المشترين' : 'Ajoutez 2 photos de plus sous différents angles');
    }

    // Video bonus (10s max)
    if (formData.video) {
      score += 15;
    } else {
      tips.push(lang === 'ar' ? '🎥 إضافة فيديو قصير (10 ثوانٍ) يرفع اهتمام المشترين بنسبة 60%' : '🎥 Une vidéo courte de 10s booste l\'intérêt des acheteurs de +60%');
    }

    // Weight
    if (parseFloat(formData.poids) > 0) {
      score += 20;
    } else {
      tips.push(lang === 'ar' ? 'حدد وزن القطعة بالغرام لحساب قيمتها بدقة' : 'Indiquez le poids en grammes');
    }

    // Certificat
    if (formData.certificat) {
      score += 20;
    } else {
      tips.push(lang === 'ar' ? 'إرفاق شهادة الأصالة يرفع سرعة البيع بنسبة 45%' : 'Le certificat d\'authenticité booste la vente de +45%');
    }

    // Facture or Boite
    if (formData.facture || formData.boite) {
      score += 10;
    }

    // Price
    const effectivePrice = formData.type_vente === 'AUCTION' ? formData.prix_depart : formData.prix;
    if (parseFloat(effectivePrice) > 0) {
      score += 10;
    }

    let levelText = '';
    let levelColor = '#ef4444';
    if (score >= 80) {
      levelText = lang === 'ar' ? 'فرصة بيع فائقة وسريعة جداً ⭐⭐⭐⭐⭐ (إعلان متكامل)' : 'Visibilité maximale & Vente très rapide ⭐⭐⭐⭐⭐';
      levelColor = '#10b981';
    } else if (score >= 50) {
      levelText = lang === 'ar' ? 'فرصة بيع جيدة ومقبولة ⭐⭐⭐⭐' : 'Bonne opportunité de vente ⭐⭐⭐⭐';
      levelColor = '#d4af37';
    } else {
      levelText = lang === 'ar' ? 'إعلان قيد الاكتمال ⭐⭐⭐' : 'Annonce en cours de finalisation ⭐⭐⭐';
      levelColor = '#f59e0b';
    }

    return { score, levelText, levelColor, tips };
  };

  const listingScore = calculateListingScore();

  const sellerWhatsappMsg = encodeURIComponent(
    lang === 'ar'
      ? 'السلام عليكم، أود مساعدة من خبير المجوهرات لتثمين قطعتي ونشرها على منصة HRSDGDG.'
      : 'Bonjour, je souhaite l\'assistance d\'un expert joaillier pour estimer et publier mon bijou sur HRSDGDG.'
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000, overflowY: 'auto', padding: '12px' }}>
      <div 
        className="modal-content sell-modal-content-assisted" 
        onClick={e => e.stopPropagation()}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Close Button */}
        <button 
          className="modal-close-btn auth-modal-close" 
          onClick={onClose} 
          title="Fermer"
          style={{ top: '16px', [isRtl ? 'left' : 'right']: '16px' }}
        >
          ✕
        </button>

        {/* Ambient Top Glow */}
        <div className="auth-card-top-glow" />

        {/* Modal Header */}
        <div className="sell-modal-header-assisted">
          <div className="section-micro-badge" style={{ margin: '0 auto 6px' }}>
            💎 {lang === 'ar' ? 'إضافة سريعة وموجهة بالكامل' : 'DÉPÔT 100% ASSISTÉ & SÉCURISÉ'}
          </div>
          <h2 className="sell-modal-title-assisted">
            {lang === 'ar' ? 'إضافة قطعة مجوهرات مع المساعد والمستشار' : 'Déposer un Bijou avec Choix Rapides'}
          </h2>
          <p className="sell-modal-subtitle-assisted">
            {lang === 'ar' 
              ? 'اختر المواصفات بنقرة واحدة دون عناء الكتابة، وسيقوم المساعد الذكي بصياغة العنوان والوصف وتقدير السعر فورياً.' 
              : 'Formulaire rapide à choix multiples : moins d\'écriture, générateur de texte et calcul automatique de la valeur or.'}
          </p>
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="auth-toast-alert gold animate-slide-down">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Success View */}
        {successMessage ? (
          <div className="sell-success-banner animate-slide-down">
            <span className="success-icon">👑</span>
            <h3>{successMessage}</h3>
            <p>{lang === 'ar' ? 'جاري تحديث الكتالوج وتوجيهك...' : 'Actualisation du catalogue en cours...'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="sell-form-assisted">

            {/* ========================================================
                A. CONCIERGE ASSISTANCE & LIVE WHATSAPP VALUATION
                ======================================================== */}
            <div className="sell-concierge-assistance-banner">
              <div className="concierge-banner-header">
                <div className="concierge-badge-wrap">
                  <span className="concierge-badge">👑 {lang === 'ar' ? 'خدمة المساعدة المباشرة' : 'Assistance Concierge Dédiée'}</span>
                  <p className="concierge-text">
                    {lang === 'ar'
                      ? 'هل تحتاج مساعدة في تصوير أو تثمين قطعتك؟ يمكنك إرسال الصور مباشرة لخبيرنا عبر واتساب للتكفل بنشرها نيابة عنك مجاناً!'
                      : 'Besoin d\'aide pour estimer ou photographier votre bijou ? Envoyez vos photos sur WhatsApp, nos experts s\'occupent du dépôt !'}
                  </p>
                </div>
                <a
                  href={`https://wa.me/212661889900?text=${sellerWhatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-seller-whatsapp-cta"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle' }}>
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.55 14.39C16.3 14.27 15.08 13.67 14.86 13.59C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.38 14.84 13.24 14.86 12.99 14.73C12.74 14.61 11.94 14.35 11 13.51C10.26 12.85 9.77 12.04 9.63 11.79C9.48 11.54 9.61 11.41 9.74 11.28C9.85 11.17 9.99 11 10.11 10.86C10.24 10.72 10.28 10.61 10.36 10.45C10.45 10.28 10.4 10.14 10.34 10.02C10.28 9.9 9.81 8.74 9.61 8.27C9.42 7.81 9.22 7.87 9.08 7.86C8.94 7.86 8.78 7.85 8.61 7.85C8.45 7.85 8.18 7.91 7.96 8.16C7.73 8.4 7.1 8.99 7.1 10.19C7.1 11.39 7.98 12.55 8.1 12.71C8.22 12.87 9.82 15.35 12.28 16.41C12.86 16.66 13.32 16.82 13.67 16.93C14.26 17.12 14.79 17.09 15.22 17.03C15.7 16.96 16.69 16.43 16.9 15.85C17.1 15.27 17.1 14.77 17.04 14.67C16.98 14.56 16.81 14.51 16.55 14.39Z" />
                  </svg>
                  <span>{lang === 'ar' ? 'استشارة خبير التثمين عبر واتساب' : 'Assistance WhatsApp Directe'}</span>
                </a>
              </div>

              {/* Live Listing Quality & Selling Probability Bar */}
              <div className="listing-score-gauge-card">
                <div className="score-top-line">
                  <span className="score-label">
                    📈 {lang === 'ar' ? 'مؤشر نجاح الإعلان وفرصة البيع السريع :' : 'Probabilité de vente rapide :'}
                  </span>
                  <span className="score-badge-val" style={{ color: listingScore.levelColor }}>
                    {listingScore.levelText} ({listingScore.score}%)
                  </span>
                </div>
                <div className="score-progress-track">
                  <div 
                    className="score-progress-bar" 
                    style={{ width: `${listingScore.score}%`, backgroundColor: listingScore.levelColor }}
                  />
                </div>
                {listingScore.tips.length > 0 && (
                  <div className="score-tip-item animate-slide-down">
                    <span>💡</span>
                    <span>{listingScore.tips[0]}</span>
                  </div>
                )}
              </div>

              {/* Toggle Moroccan Hallmark Guide */}
              <div className="hallmark-guide-trigger-row">
                <button
                  type="button"
                  className="btn-hallmark-guide"
                  onClick={() => setShowHallmarkGuide(!showHallmarkGuide)}
                >
                  🔍 {lang === 'ar' ? 'دليل دمغات الذهب الرسمية بالمغرب (عيار 18k)' : 'Guide des poinçons officiels au Maroc (18K)'}
                </button>
                {showHallmarkGuide && (
                  <div className="hallmark-guide-content animate-slide-down">
                    <p>
                      <strong>🇲🇦 {lang === 'ar' ? 'الذهب عيار 18 قيراط (750‰) :' : 'Or 18 Carats (750‰) :'}</strong>{' '}
                      {lang === 'ar'
                        ? 'هو العيار القانوني الأكثر تداولاً في المغرب، ويحمل دمغة رأس الحصان أو رقم 750 المعتمدة لدى مكتب الضمانة الجمركية بالمملكة.'
                        : 'Poinçon tête de cheval ou mention 750 officielle garantie par le Bureau de Garantie des Douanes Marocaines.'}
                    </p>
                    <p style={{ marginTop: '4px' }}>
                      <strong>🛡️ {lang === 'ar' ? 'شهادة الفحص :' : 'Certificat :'}</strong>{' '}
                      {lang === 'ar'
                        ? 'كل قطعة معروضة تخضع للمعاينة والفحص الفعلي قبل تسليم المبلغ للبائع لحماية الطرفين 100%.'
                        : 'Chaque pièce est vérifiée avant le déblocage des fonds pour une sécurité totale.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================
                1. ASSISTANT HERO BAR: 1-CLICK DEMO TEMPLATES
                ======================================================== */}
            <div className="sell-assistant-hero-box">
              <div className="assist-hero-title-row">
                <div className="assist-hero-title">
                  <span className="assist-sparkle">🤖</span>
                  <span>{lang === 'ar' ? 'نماذج جاهزة بضغطة زر واحدة (تعبئة فورية)' : 'Modèles types en 1 clic (Zéro écriture)'}</span>
                </div>
                <button
                  type="button"
                  className="btn-ai-compose-pill"
                  onClick={generateAITitleAndDescription}
                  title={lang === 'ar' ? 'توليد العنوان والوصف آلياً' : 'Générer titre et description'}
                >
                  <span>✨</span>
                  <span>{lang === 'ar' ? 'توليد العنوان والوصف تلقائياً' : 'Rédiger Titre & Description'}</span>
                </button>
              </div>

              <div className="assist-presets-chips-row">
                <span className="presets-label">{lang === 'ar' ? 'اختر قالباً سريعاً :' : 'Modèles rapides :'}</span>
                {sampleJewelPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-chip-btn"
                    onClick={() => applyPreset(p)}
                  >
                    <span>{lang === 'ar' ? p.labelAr : p.labelFr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ========================================================
                1. PHOTOS & VIDEO DU PRODUIT (10s MAX)
                ======================================================== */}
            <div className="sell-section-box">
              <div className="photos-header-row">
                <label className="sell-section-label" style={{ margin: 0 }}>
                  <span className="section-label-num">1</span>
                  <span>📸 🎥 {lang === 'ar' ? 'صور وفيديو القطعة' : 'Photos & Vidéo du Bijou'}</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {formData.video && (
                    <span className="video-limit-pill" style={{ color: '#2563eb', borderColor: '#93c5fd', background: 'rgba(59,130,246,0.1)' }}>
                      🎥 {videoDuration ? `${videoDuration}s` : '10s'}
                    </span>
                  )}
                  <span className="photo-count-pill">
                    {(formData.images || []).length} {lang === 'ar' ? 'صور' : 'photos'}
                  </span>
                </div>
              </div>

              {/* Galerie actuelle (Photos + Vidéo 10s max) */}
              {((formData.images || []).length > 0 || formData.video) && (
                <div className="sell-images-gallery-row">
                  {/* Carte Vidéo Preview */}
                  {formData.video && (
                    <div className="sell-thumb-card video-card">
                      <video 
                        src={formData.video} 
                        controls 
                        playsInline 
                        loop 
                        muted 
                        className="sell-thumb-video-elem" 
                      />
                      <span className="thumb-video-badge">▶ {videoDuration ? `${videoDuration}s` : '10s MAX'}</span>
                      <button
                        type="button"
                        className="thumb-delete-btn"
                        onClick={handleRemoveVideo}
                        title={lang === 'ar' ? 'حذف الفيديو' : 'Supprimer la vidéo'}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Cartes Photos */}
                  {(formData.images || []).map((img, idx) => (
                    <div key={idx} className={`sell-thumb-card ${idx === 0 ? 'primary' : ''}`}>
                      <img src={img} alt={`Bijou ${idx + 1}`} />
                      {idx === 0 ? (
                        <span className="thumb-primary-tag">★ {lang === 'ar' ? 'رئيسية' : 'PRINCIPALE'}</span>
                      ) : (
                        <button
                          type="button"
                          className="thumb-set-primary-btn"
                          onClick={() => handleSetPrimaryImage(idx)}
                          title="Définir comme photo principale"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        className="thumb-delete-btn"
                        onClick={() => handleRemoveImage(idx)}
                        title="Supprimer cette photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload actions */}
              <div className="upload-controls-row">
                {/* 1. Photos upload */}
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  id="sell-modal-multi-upload-v2"
                  style={{ display: 'none' }}
                  onChange={handleFilesSelected}
                />
                <label htmlFor="sell-modal-multi-upload-v2" className="btn-upload-file">
                  <span>📷</span>
                  <span>{lang === 'ar' ? 'التقاط صور أو اختيار من الهاتف' : 'Ajouter des photos'}</span>
                </label>

                {/* 2. Video 10s upload / record */}
                <input 
                  type="file" 
                  accept="video/*" 
                  capture="environment"
                  id="sell-modal-video-upload"
                  style={{ display: 'none' }}
                  onChange={handleVideoSelected}
                />
                <label htmlFor="sell-modal-video-upload" className="btn-upload-file video-cta">
                  <span>🎥</span>
                  <span>
                    {formData.video 
                      ? (lang === 'ar' ? `تغيير الفيديو (${videoDuration ? `${videoDuration}s` : '10s'})` : `Changer vidéo (${videoDuration ? `${videoDuration}s` : '10s'})`)
                      : (lang === 'ar' ? 'تصوير أو اختيار فيديو (10 ثوانٍ كحد أقصى)' : 'Filmer / Importer vidéo (10s max)')}
                  </span>
                </label>

                {/* 3. URL photo rapide */}
                <div className="url-input-wrap">
                  <input 
                    type="text"
                    placeholder={lang === 'ar' ? 'أو ضع رابط صورة...' : 'Ou collez une URL...'}
                    value={customImageUrl}
                    onChange={e => setCustomImageUrl(e.target.value)}
                    className="auth-text-input"
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  />
                  <button 
                    type="button"
                    onClick={handleAddImageUrl}
                    className="btn-add-url"
                  >
                    {lang === 'ar' ? 'إضافة' : 'Ajouter'}
                  </button>
                </div>
              </div>

              {/* Video error alert */}
              {videoError && (
                <div className="video-error-alert animate-slide-down">
                  <span>⚠️</span>
                  <span>{videoError}</span>
                </div>
              )}

              {/* Sample high quality photos to click */}
              <div className="sample-photos-row">
                <span className="sample-photos-label">
                  {lang === 'ar' ? 'صور جاهزة للتجربة الفورية :' : 'Photos d\'exemples prêtes :'}
                </span>
                <div className="sample-imgs-flex">
                  {sampleImages.map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt={`Sample ${i}`} 
                      onClick={() => {
                        if (!(formData.images || []).includes(img)) {
                          setFormData(prev => ({ ...prev, images: [...(prev.images || []), img] }));
                        }
                      }}
                      className={`sample-mini-img ${(formData.images || []).includes(img) ? 'selected' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================
                2. FORMAT DE VENTE (3 LARGE LUXURY CARDS)
                ======================================================== */}
            <div className="sell-section-box">
              <label className="sell-section-label">
                <span className="section-label-num">2</span>
                <span>{lang === 'ar' ? 'صيغة البيع والعرض' : 'Format de Vente'}</span>
              </label>

              <div className="sale-format-cards-grid">
                {/* 1. Neuf */}
                <div 
                  className={`sale-format-card ${formData.type_vente === 'FIRST_HAND' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, type_vente: 'FIRST_HAND', etat: 'Neuf' })}
                  role="button"
                >
                  <div className="card-top-indicator">
                    <span className="card-icon">✨</span>
                    <span className="card-radio">{formData.type_vente === 'FIRST_HAND' ? '●' : '○'}</span>
                  </div>
                  <div className="card-title">{lang === 'ar' ? 'قطعة جديدة تماماً' : 'Première Main (Neuf)'}</div>
                  <div className="card-desc">{lang === 'ar' ? 'غير مستعملة مع علبتها وضمان المصنع' : 'Directement de l\'atelier ou bijouterie'}</div>
                  <span className="card-tag gold">{lang === 'ar' ? 'جديد 100%' : 'Neuf'}</span>
                </div>

                {/* 2. Seconde main */}
                <div 
                  className={`sale-format-card ${formData.type_vente === 'SECOND_HAND' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, type_vente: 'SECOND_HAND', etat: 'Excellent état' })}
                  role="button"
                >
                  <div className="card-top-indicator">
                    <span className="card-icon">♻️</span>
                    <span className="card-radio">{formData.type_vente === 'SECOND_HAND' ? '●' : '○'}</span>
                  </div>
                  <div className="card-title">{lang === 'ar' ? 'مستعمل بحالة ممتازة' : 'Seconde Main (Occasion)'}</div>
                  <div className="card-desc">{lang === 'ar' ? 'ذهب موثق 18k تم فحصه بدقة' : 'Bijou vérifié avec certificat d\'authenticité'}</div>
                  <span className="card-tag emerald">{lang === 'ar' ? 'فرصة ذهبية' : 'Bonne affaire'}</span>
                </div>

                {/* 3. Auction */}
                <div 
                  className={`sale-format-card ${formData.type_vente === 'AUCTION' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, type_vente: 'AUCTION', etat: 'Très bon état' })}
                  role="button"
                >
                  <div className="card-top-indicator">
                    <span className="card-icon">🔨</span>
                    <span className="card-radio">{formData.type_vente === 'AUCTION' ? '●' : '○'}</span>
                  </div>
                  <div className="card-title">{lang === 'ar' ? 'مزاد حي ومباشر' : 'Enchère en Direct'}</div>
                  <div className="card-desc">{lang === 'ar' ? 'تنافس بين المشترين لأعلى سعر خلال فترة محددة' : 'Vente dynamique aux enchères avec chrono'}</div>
                  <span className="card-tag purple">{lang === 'ar' ? 'مزاد مباشر' : 'Live'}</span>
                </div>
              </div>
            </div>

            {/* ========================================================
                3. CATEGORIE DU BIJOU (VISUAL PILLS GRID)
                ======================================================== */}
            <div className="sell-section-box">
              <label className="sell-section-label">
                <span className="section-label-num">3</span>
                <span>{lang === 'ar' ? 'نوع وفئة المجوهرات' : 'Catégorie du Bijou'}</span>
              </label>

              <div className="sell-category-chips-grid">
                {categoryOptions.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`sell-cat-pill ${formData.category_id === cat.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, category_id: cat.id })}
                  >
                    <span>{lang === 'ar' ? cat.ar : cat.fr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ========================================================
                4. MATIERE & PURETE (CARAT CHOICES)
                ======================================================== */}
            <div className="sell-section-box">
              <label className="sell-section-label">
                <span className="section-label-num">4</span>
                <span>{lang === 'ar' ? 'المعدن والعيار' : 'Métal Précieux & Pureté'}</span>
              </label>

              {/* Matiere */}
              <div className="sub-section-row">
                <span className="sub-label">{lang === 'ar' ? 'نوع المعدن :' : 'Métal :'}</span>
                <div className="choice-pills-wrap">
                  {materialOptions.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      className={`choice-chip ${formData.matiere === m.id ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, matiere: m.id })}
                    >
                      {lang === 'ar' ? m.ar : m.fr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purete */}
              <div className="sub-section-row" style={{ marginTop: '10px' }}>
                <span className="sub-label">{lang === 'ar' ? 'العيار :' : 'Carat :'}</span>
                <div className="choice-pills-wrap">
                  {purityOptions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`choice-chip ${formData.purete === p.id ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, purete: p.id })}
                    >
                      {lang === 'ar' ? p.ar : p.fr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================
                5. POIDS & ESTIMATEUR DE VALEUR EN DIRECT
                ======================================================== */}
            <div className="sell-section-box">
              <label className="sell-section-label">
                <span className="section-label-num">5</span>
                <span>{lang === 'ar' ? 'الوزن وحاسبة قيمة الذهب' : 'Poids & Estimateur de Valeur Or'}</span>
              </label>

              {/* Quick Weight Chips */}
              <div className="choice-pills-wrap">
                {weightPresets.map(w => (
                  <button
                    key={w}
                    type="button"
                    className={`weight-chip ${formData.poids === w ? 'active' : ''}`}
                    onClick={() => {
                      setFormData({ ...formData, poids: w });
                      setShowCustomWeight(false);
                    }}
                  >
                    <span>{w}g</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`weight-chip ${showCustomWeight ? 'active' : ''}`}
                  onClick={() => setShowCustomWeight(!showCustomWeight)}
                >
                  <span>{lang === 'ar' ? '✎ وزن آخر...' : '✎ Autre poids...'}</span>
                </button>
              </div>

              {/* Custom Weight Input */}
              {showCustomWeight && (
                <div className="custom-weight-input-wrap animate-slide-down">
                  <label>{lang === 'ar' ? 'أدخل الوزن بالغرام بدقة :' : 'Poids précis en grammes :'}</label>
                  <div className="input-with-unit">
                    <input 
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={formData.poids}
                      onChange={e => setFormData({ ...formData, poids: e.target.value })}
                      placeholder="Ex: 6.85"
                      className="auth-text-input"
                    />
                    <span className="unit-badge">g (غرام)</span>
                  </div>
                </div>
              )}

              {/* Live Gold Intrinsic Value Calculator */}
              {numPoids > 0 && (
                <div className="gold-estimate-box animate-slide-down">
                  <div className="gold-estimate-header">
                    <div className="est-info">
                      <span className="est-icon">💡</span>
                      <div>
                        <div className="est-title">
                          {lang === 'ar' 
                            ? `القيمة التقديرية للذهب الصافي عيار 18k (${goldRate18k} د.م/غ) :` 
                            : `Valeur brute or 18k estimée (${goldRate18k} DH/g) :`}
                        </div>
                        <div className="est-calc-formula">
                          {numPoids} {lang === 'ar' ? 'غ' : 'g'} × {goldRate18k} {lang === 'ar' ? 'د.م' : 'DH'} = <span className="est-price-val">~{rawGoldValue.toLocaleString()} {lang === 'ar' ? 'د.م' : 'DH'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="quick-price-helper-row">
                    <span className="helper-label">{lang === 'ar' ? 'اقتراح سعر بنقرة واحدة :' : 'Appliquer un prix conseillé :'}</span>
                    <button
                      type="button"
                      className="suggest-price-btn"
                      onClick={() => applySuggestedPrice(1.0)}
                      title="Prix de l'or brut"
                    >
                      {lang === 'ar' ? 'الذهب الصافي' : 'Or brut'} (~{rawGoldValue} {lang === 'ar' ? 'د.م' : 'DH'})
                    </button>
                    <button
                      type="button"
                      className="suggest-price-btn gold"
                      onClick={() => applySuggestedPrice(1.20)}
                      title="+20% pour la façon et l'artisanat"
                    >
                      +20% {lang === 'ar' ? 'مصنعية وإتقان' : 'Façon'} (~{Math.round(rawGoldValue * 1.20)} {lang === 'ar' ? 'د.م' : 'DH'})
                    </button>
                    <button
                      type="button"
                      className="suggest-price-btn premium"
                      onClick={() => applySuggestedPrice(1.40)}
                      title="+40% pour joaillerie haut de gamme"
                    >
                      +40% {lang === 'ar' ? 'مجوهرات راقية' : 'Haute Joaillerie'} (~{Math.round(rawGoldValue * 1.40)} {lang === 'ar' ? 'د.م' : 'DH'})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================
                6. PIERRES PRECIEUSES
                ======================================================== */}
            <div className="sell-section-box">
              <label className="sell-section-label">
                <span className="section-label-num">6</span>
                <span>{lang === 'ar' ? 'الأحجار الكريمة والمرصعات' : 'Pierres Précieuses'}</span>
              </label>

              <div className="choice-pills-wrap">
                {stoneOptions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`choice-chip ${formData.pierre === s.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, pierre: s.id })}
                  >
                    {lang === 'ar' ? s.ar : s.fr}
                  </button>
                ))}
              </div>
            </div>

            {/* ========================================================
                7. ETAT & ACCESSOIRES INCLUS (CHECKABLE BADGES)
                ======================================================== */}
            <div className="sell-section-box">
              <label className="sell-section-label">
                <span className="section-label-num">7</span>
                <span>{lang === 'ar' ? 'الحالة والوثائق المرفقة' : 'État & Accessoires Inclus'}</span>
              </label>

              {/* État */}
              <div className="choice-pills-wrap" style={{ marginBottom: '12px' }}>
                {conditionOptions.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`choice-chip ${formData.etat === c.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, etat: c.id })}
                  >
                    {lang === 'ar' ? c.ar : c.fr}
                  </button>
                ))}
              </div>

              {/* Accessoires checklist */}
              <div className="accessories-badges-grid">
                <div 
                  className={`accessory-toggle-badge ${formData.certificat ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, certificat: !formData.certificat })}
                  role="button"
                >
                  <span className="check-box">{formData.certificat ? '✓' : ''}</span>
                  <span className="badge-text">📜 {lang === 'ar' ? 'شهادة الأصالة والعيار' : 'Certificat d\'authenticité'}</span>
                </div>

                <div 
                  className={`accessory-toggle-badge ${formData.facture ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, facture: !formData.facture })}
                  role="button"
                >
                  <span className="check-box">{formData.facture ? '✓' : ''}</span>
                  <span className="badge-text">🧾 {lang === 'ar' ? 'فاتورة الشراء الأصلية' : 'Facture d\'origine'}</span>
                </div>

                <div 
                  className={`accessory-toggle-badge ${formData.boite ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, boite: !formData.boite })}
                  role="button"
                >
                  <span className="check-box">{formData.boite ? '✓' : ''}</span>
                  <span className="badge-text">🎁 {lang === 'ar' ? 'العلبة الفاخرة الأصلية' : 'Écrin / Boîte de luxe'}</span>
                </div>

                <div 
                  className={`accessory-toggle-badge ${formData.garantie ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, garantie: !formData.garantie })}
                  role="button"
                >
                  <span className="check-box">{formData.garantie ? '✓' : ''}</span>
                  <span className="badge-text">🛡️ {lang === 'ar' ? 'ضمان الصائغ / الورشة' : 'Garantie atelier'}</span>
                </div>
              </div>
            </div>

            {/* ========================================================
                8. PRIX, DUREE & VILLE (CHIPS VILLES MAROCAINES)
                ======================================================== */}
            <div className="sell-section-box">
              <label className="sell-section-label">
                <span className="section-label-num">8</span>
                <span>{formData.type_vente === 'AUCTION' ? (lang === 'ar' ? 'سعر انطلاق المزاد والمدة' : 'Mise à Prix & Durée') : (lang === 'ar' ? 'السعر والمدينة' : 'Prix & Ville')}</span>
              </label>

              {formData.type_vente === 'AUCTION' ? (
                <div className="auth-two-col-grid" style={{ marginBottom: '12px' }}>
                  <div className="auth-field-group">
                    <label className="auth-field-label">
                      <span>🔨 {lang === 'ar' ? 'سعر انطلاق المزاد (د.م) *' : 'Prix de départ de l\'enchère (DH) *'}</span>
                    </label>
                    <input 
                      type="number"
                      required
                      placeholder="Ex: 5000"
                      value={formData.prix_depart}
                      onChange={e => setFormData({ ...formData, prix_depart: e.target.value, prix: e.target.value })}
                      className="auth-text-input"
                    />
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-field-label">
                      <span>⏱️ {lang === 'ar' ? 'مدة المزاد' : 'Durée de l\'enchère'}</span>
                    </label>
                    <div className="choice-pills-wrap">
                      {[
                        { val: '24', ar: '24 ساعة (فلاش)', fr: '24h Flash' },
                        { val: '48', ar: '48 ساعة (يومين)', fr: '48h (2 jours)' },
                        { val: '72', ar: '72 ساعة (3 أيام)', fr: '72h (3 jours)' },
                        { val: '168', ar: 'أسبوع كامل VIP', fr: '7 jours' }
                      ].map(d => (
                        <button
                          key={d.val}
                          type="button"
                          className={`choice-chip ${formData.duree_enchere === d.val ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, duree_enchere: d.val })}
                        >
                          {lang === 'ar' ? d.ar : d.fr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="auth-two-col-grid" style={{ marginBottom: '12px' }}>
                  <div className="auth-field-group">
                    <label className="auth-field-label">
                      <span>💰 {lang === 'ar' ? 'سعر البيع المطلوب (د.م) *' : 'Prix de vente (DH) *'}</span>
                    </label>
                    <input 
                      type="number"
                      required
                      placeholder="Ex: 4800"
                      value={formData.prix}
                      onChange={e => setFormData({ ...formData, prix: e.target.value })}
                      className="auth-text-input"
                    />
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-field-label">
                      <span>🏷️ {lang === 'ar' ? 'السعر الأصلي السابق (اختياري للتخفيض)' : 'Ancien prix (Optionnel)'}</span>
                    </label>
                    <input 
                      type="number"
                      placeholder="Ex: 5800"
                      value={formData.ancien_prix}
                      onChange={e => setFormData({ ...formData, ancien_prix: e.target.value })}
                      className="auth-text-input"
                    />
                  </div>
                </div>
              )}

              {/* City Selection with Quick Pills */}
              <div className="auth-field-group" style={{ marginTop: '8px' }}>
                <label className="auth-field-label">
                  <span>📍 {lang === 'ar' ? 'مدينة تواجد القطعة' : 'Ville de localisation'}</span>
                </label>
                <div className="quick-city-pills-row">
                  {topCities.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      className={`city-pill-btn ${formData.city === c.key ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, city: c.key })}
                    >
                      {lang === 'ar' ? c.ar : c.fr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================
                10. TITRE & DESCRIPTION (AUTO-GENERATED OR CUSTOMIZABLE)
                ======================================================== */}
            <div className="sell-section-box">
              <div className="title-desc-header-row">
                <label className="sell-section-label" style={{ margin: 0 }}>
                  <span className="section-label-num">9</span>
                  <span>📝 {lang === 'ar' ? 'عنوان القطعة ووصفها' : 'Titre & Description'}</span>
                </label>
                <button
                  type="button"
                  className="btn-ai-generate-small"
                  onClick={generateAITitleAndDescription}
                >
                  ✨ {lang === 'ar' ? 'تحديث وتوليد ذكي' : 'Régénérer automatiquement'}
                </button>
              </div>

              <div className="auth-field-group" style={{ marginBottom: '10px' }}>
                <input 
                  type="text"
                  required
                  placeholder={lang === 'ar' ? "عنوان القطعة (مثال: خاتم سوليتير ذهب 18k مرصع بألماس)..." : "Titre de la pièce..."}
                  value={formData.titre}
                  onChange={e => setFormData({ ...formData, titre: e.target.value })}
                  className="auth-text-input"
                />
              </div>

              <div className="auth-field-group">
                <textarea 
                  rows="3"
                  placeholder={lang === 'ar' ? "الوصف التفصيلي، الصياغة، النقاء، شهادة الفحص والضمان..." : "Description détaillée de la pièce..."}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="auth-text-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* SUBMIT BUTTON BAR */}
            <div className="sell-submit-bar">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-sell-cancel"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="auth-primary-submit-btn sell-submit-action-btn"
              >
                {isSubmitting ? (
                  <span className="auth-loading-spinner-wrapper">
                    <span className="auth-spinner" />
                    <span>{lang === 'ar' ? 'جاري نشر القطعة...' : 'Publication en cours...'}</span>
                  </span>
                ) : (
                  <>
                    <span>👑</span>
                    <span>
                      {formData.type_vente === 'AUCTION' 
                        ? (lang === 'ar' ? '🔨 إطلاق المزاد الحي الآن' : '🔨 Lancer l\'Enchère Immédiate') 
                        : (lang === 'ar' ? '✨ نشر القطعة في السوق فورياً' : '✨ Publier le Bijou en Direct')}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
