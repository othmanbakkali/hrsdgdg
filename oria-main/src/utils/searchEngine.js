/**
 * Advanced Bilingual Search Engine for HRS DGDG / Oria Luxury Marketplace
 * Supports Arabic (Tashkeel stripping, alef/taa marbouta/yaa normalization, Darija terms)
 * and French (Accents stripping, plural stemming, synonyms).
 */

// Strip Arabic diacritics & normalize letters
export function normalizeArabic(text) {
  if (!text) return '';
  return text
    // Remove Tashkeel (harakat / diacritics)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Alefs (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbouta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Yaa (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize Hamza variants (ؤ -> و, ئ -> ي)
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Remove tatweel / kashida (ـ)
    .replace(/ـ/g, '');
}

// Strip French & Latin accents & normalize
export function normalizeFrench(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Full text normalizer
export function normalizeSearchText(text) {
  if (!text) return '';
  let str = String(text);
  str = normalizeFrench(str);
  str = normalizeArabic(str);

  // Normalize carats and purity
  str = str.replace(/\b18\s*(?:k|karat|carat|carats|قيراط|عيار)\b/gi, '18k');
  str = str.replace(/\b24\s*(?:k|karat|carat|carats|قيراط|عيار)\b/gi, '24k');
  str = str.replace(/\b750\b/g, '18k 750');

  // Normalize grammage
  str = str.replace(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramme|grammes|غرام|غ)\b/gi, '$1g');

  // Replace punctuation/symbols with spaces, keep letters, numbers, and arabic
  str = str.replace(/[^\p{L}\p{N}g]/gu, ' ');

  // Collapse multiple spaces
  return str.replace(/\s+/g, ' ').trim();
}

// Synonyms groups table
const SYNONYM_GROUPS = [
  // Bagues
  ['bague', 'bagues', 'خاتم', 'خواتم', 'alliance', 'alliances', 'solitaire', 'solitaires', 'chevaliere', 'محبس', 'دبله', 'دبلة'],
  // Bracelets
  ['bracelet', 'bracelets', 'سوار', 'اسوارة', 'اساور', 'دملج', 'دبالج', 'براسلي', 'براسليات', 'gourmette', 'gourmettes', 'jonc', 'joncs', 'manchette'],
  // Colliers
  ['collier', 'colliers', 'سلسلة', 'سلسله', 'سلاسل', 'عقد', 'عقود', 'قلادة', 'قلاده', 'قلادات', 'تعليقة', 'تعليقه', 'تعاليق', 'pendentif', 'pendentifs', 'chaine', 'chaines', 'sautoir'],
  // Boucles
  ['boucle', 'boucles', 'حلق', 'حلقات', 'خرصات', 'حلقان', 'oreilles', 'creoles', 'dormeuses', 'puces'],
  // Parures
  ['parure', 'parures', 'طقم', 'اطقم', 'اطقمة'],
  // Or
  ['or', 'gold', 'ذهب', 'ذهبي', 'jaune', 'blanc', 'rose', '18k', '24k', '750'],
  // Diamant
  ['diamant', 'diamants', 'diamond', 'الماس', 'ماس', 'brillant'],
  // Argent
  ['argent', 'silver', 'فضة', 'فضه', 'نقرة', 'نقره', '925'],
  // Perles
  ['perle', 'perles', 'لؤلؤ', 'جوهر'],
  // Pierres précieuses
  ['emeraude', 'زمرد'],
  ['rubis', 'ياقوت'],
  ['saphir', 'زفير'],
  // Pour qui
  ['homme', 'hommes', 'رجال', 'رجالي', 'men'],
  ['femme', 'femmes', 'نساء', 'نسائي', 'women'],
  ['enfant', 'enfants', 'اطفال', 'bebe', 'صغار'],
  ['mariage', 'زواج', 'عروس', 'عرس', 'fiancailles', 'خطوبة', 'خطوبه'],
  // Type de vente
  ['seconde', 'occasion', 'vintage', 'مستعمل', 'مستعمله', 'همزة', 'همزه', 'هميزات', 'فرصة', 'فرصه', 'second_hand'],
  ['neuf', 'neuve', 'premiere', 'جديد', 'جديده', 'يد اولى', 'first_hand'],
  ['enchere', 'encheres', 'مزاد', 'مزادات', 'auction'],
  // Villes
  ['casablanca', 'casa', 'كازا', 'الدار البيضاء', 'بيضاء'],
  ['rabat', 'الرباط'],
  ['marrakech', 'kech', 'مراكش'],
  ['tanger', 'طنجة', 'طنجي'],
  ['fes', 'فاس'],
  ['agadir', 'اكادير'],
  ['meknes', 'مكناس'],
  ['oujda', 'وجدة', 'وجده'],
  ['tetouan', 'تطوان'],
  ['kenitra', 'القنيطرة', 'قنيطرة'],
  ['sale', 'سلا']
];

// Pre-normalize synonyms groups for fast lookup
const NORMALIZED_GROUPS = SYNONYM_GROUPS.map(group => 
  group.map(word => normalizeSearchText(word))
);

/**
 * Returns expanded synonym tokens for a single word
 */
export function expandWordSynonyms(word) {
  const normWord = normalizeSearchText(word);
  if (!normWord || normWord.length < 2) return [normWord];

  const results = new Set([normWord]);

  for (const group of NORMALIZED_GROUPS) {
    if (group.some(item => item === normWord || item.includes(normWord) || normWord.includes(item))) {
      group.forEach(syn => results.add(syn));
    }
  }

  return Array.from(results);
}

/**
 * Parses user query to extract explicit price max or gram weight constraints
 */
export function parseQueryConstraints(rawQuery) {
  let cleaned = rawQuery || '';
  let maxPrice = null;
  let targetGram = null;

  // Max price patterns: "moins de 5000", "< 5000", "اقل من 5000", "تحت 5000", "max 5000"
  const priceRegex = /(?:moins de|<|أقل من|اقل من|تحت|max)\s*(\d+[\s\d]*)/i;
  const priceMatch = cleaned.match(priceRegex);
  if (priceMatch) {
    const rawVal = priceMatch[1].replace(/\s+/g, '');
    maxPrice = parseFloat(rawVal);
    cleaned = cleaned.replace(priceMatch[0], ' ');
  }

  // Gram weight pattern: "10g", "12.5g", "15 غ", "8 غرام"
  const gramRegex = /(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramme|grammes|غرام|غ)\b/i;
  const gramMatch = cleaned.match(gramRegex);
  if (gramMatch) {
    targetGram = parseFloat(gramMatch[1].replace(',', '.'));
    cleaned = cleaned.replace(gramMatch[0], ' ');
  }

  // Remove common filler words: "dh", "درهم", "pour", "من أجل", "de"
  cleaned = cleaned.replace(/\b(?:dh|dhs|درهم|pour|de|en|avec|في|من|مع)\b/gi, ' ');

  return {
    cleanedQuery: cleaned.trim(),
    maxPrice,
    targetGram
  };
}

/**
 * Checks whether a product matches the search query intelligently
 */
export function matchProduct(product, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return true;

  const { cleanedQuery, maxPrice, targetGram } = parseQueryConstraints(rawQuery);

  // 1. Check max price constraint
  if (maxPrice !== null && !isNaN(maxPrice)) {
    if (product.prix && product.prix > maxPrice) {
      return false;
    }
  }

  // 2. Check target gram weight constraint (within ±1.5g margin if explicit gram typed)
  if (targetGram !== null && !isNaN(targetGram)) {
    const pGram = parseFloat(product.gramme || product.poids);
    if (!isNaN(pGram)) {
      if (Math.abs(pGram - targetGram) > 2.0 && !String(pGram).includes(String(targetGram))) {
        return false;
      }
    }
  }

  // If no remaining search words, match passes price/gram filter!
  if (!cleanedQuery) return true;

  // 3. Build comprehensive normalized searchable text for the product
  const searchableText = normalizeSearchText([
    product.titre_fr,
    product.titre,
    product.titre_ar,
    product.titre_en,
    product.description_fr,
    product.description,
    product.description_ar,
    product.description_en,
    product.matiere,
    product.pierre,
    product.style,
    product.occasion,
    product.pour_qui,
    product.etat,
    product.city,
    product.vendeur_nom,
    product.type_vente === 'SECOND_HAND' ? 'seconde main occasion مستعمل vintage' : '',
    product.type_vente === 'FIRST_HAND' ? 'premiere main neuf جديد' : '',
    product.type_vente === 'AUCTION' || product.disponibilite === 'enchere' ? 'enchere مزاد' : '',
    product.carats ? `${product.carats} 18k ذهب` : '',
    product.gramme ? `${product.gramme}g ${product.gramme} غرام` : '',
    product.poids ? `${product.poids}g ${product.poids} غرام` : '',
    product.prix ? `${product.prix}` : ''
  ].filter(Boolean).join(' '));

  // 4. Tokenize the query
  const queryTokens = normalizeSearchText(cleanedQuery).split(/\s+/).filter(t => t.length > 0);

  // 5. Every query token (or any of its synonyms) must match the searchable text
  return queryTokens.every(token => {
    // If token is very short (1 char), ignore unless it's a digit
    if (token.length < 2 && !/\d/.test(token)) return true;

    // Check direct substring
    if (searchableText.includes(token)) return true;

    // Check expanded synonyms
    const synonyms = expandWordSynonyms(token);
    return synonyms.some(syn => syn && syn.length >= 2 && searchableText.includes(syn));
  });
}
