import React from 'react';

export default function OriaLogo({ size = 30, showText = true, subtitle = "ADMINISTRATION" }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.35))', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="adminGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE5A3" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6314" />
          </linearGradient>
          <linearGradient id="adminInnerGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFF8DB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <polygon 
          points="50,5 64,22 85,22 76,43 95,50 76,57 85,78 64,78 50,95 36,78 15,78 24,57 5,50 24,43 15,22 36,22" 
          stroke="url(#adminGoldGrad)" 
          strokeWidth="2.5" 
          fill="rgba(20, 16, 12, 0.6)"
        />
        
        <polygon 
          points="50,18 80,50 50,82 20,50" 
          stroke="url(#adminGoldGrad)" 
          strokeWidth="1.5" 
          fill="none"
        />

        <polygon 
          points="50,18 62,50 50,82 38,50" 
          stroke="url(#adminGoldGrad)" 
          strokeWidth="1" 
          fill="url(#adminInnerGlow)"
        />

        <circle cx="50" cy="50" r="3" fill="#FFF8DB" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ 
            fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif", 
            fontWeight: 800, 
            fontSize: `${size * 0.58}px`, 
            letterSpacing: '2.5px',
            background: 'linear-gradient(135deg, #FFF0B8 0%, #D4AF37 50%, #A67C1E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'block'
          }}>
            ORIA
          </span>
          {subtitle && (
            <span style={{ 
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", 
              fontSize: `${Math.max(size * 0.22, 7.5)}px`, 
              letterSpacing: '2px', 
              color: '#D4AF37', 
              opacity: 0.85,
              fontWeight: 600,
              textTransform: 'uppercase',
              marginTop: '3px'
            }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
