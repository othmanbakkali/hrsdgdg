import React from 'react';
import ProductCard from '../ProductCard';

export default function MobileProductCard({
  product,
  onSelectProduct,
  viewMode = 'grid', // 'grid' (2 columns) or 'list' (1 column feed)
  onToggleCompare,
  isCompared = false,
  onOpenChatWithSeller
}) {
  return (
    <ProductCard 
      product={product}
      onSelectProduct={onSelectProduct}
      onOpenChatWithSeller={onOpenChatWithSeller}
      viewMode={viewMode}
      isMobile={true}
    />
  );
}
