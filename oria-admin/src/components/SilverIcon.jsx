import React from 'react';

export default function SilverIcon({ size = 18, className = '', style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label="Argent 1000"
    >
      <defs>
        <linearGradient id="silverBarGradAdmin" x1="2" y1="5" x2="22" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="60%" stopColor="#94A3B8" />
          <stop offset="85%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="silverTopFacetAdmin" x1="6" y1="6" x2="18" y2="11" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* 3D Ingot / Bullion Bar Base */}
      <path 
        d="M4 17.5L7.2 6.5H16.8L20 17.5H4Z" 
        fill="url(#silverBarGradAdmin)" 
        stroke="#CBD5E1" 
        strokeWidth="1.2" 
        strokeLinejoin="round" 
      />
      {/* Top Bevel Highlight */}
      <path 
        d="M7.2 6.5H16.8L15 10H9L7.2 6.5Z" 
        fill="url(#silverTopFacetAdmin)" 
        stroke="#FFFFFF" 
        strokeWidth="0.5" 
      />
      {/* Left and Right Bevel Lines */}
      <path d="M4 17.5L9 10" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.8" />
      <path d="M20 17.5L15 10" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.6" />
      <path d="M9 10H15L17.5 17.5H6.5L9 10Z" fill="#E2E8F0" fillOpacity="0.3" />
      {/* Hallmark Stamp: "Ag 1000" */}
      <text 
        x="12" 
        y="15.2" 
        textAnchor="middle" 
        fontSize="4.5" 
        fontWeight="900" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fill="#1E293B" 
        letterSpacing="0.4"
      >
        Ag 1000
      </text>
    </svg>
  );
}
