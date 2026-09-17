import React from 'react';

export default function OriaLogo({ size = 32, showText = true, subtitle = "PREMIÈRE & SECONDE MAIN" }) {
  return (
    <div className="jewelia-logo-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
      {/* Sleek Diamond & Infinity Gold Emblem */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 3px 12px rgba(212, 175, 55, 0.4))', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="jeweliaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2C6" />
            <stop offset="35%" stopColor="#E5C158" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>
          <linearGradient id="jeweliaInnerGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="jeweliaEmeraldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Faceted Diamond Crown */}
        <polygon 
          points="50,4 88,32 50,96 12,32" 
          stroke="url(#jeweliaGoldGrad)" 
          strokeWidth="2.8" 
          fill="rgba(18, 16, 22, 0.85)"
        />

        {/* Table & Crown Facets */}
        <polygon 
          points="28,32 72,32 50,96" 
          stroke="url(#jeweliaGoldGrad)" 
          strokeWidth="1.6" 
          fill="none"
        />
        
        <polygon 
          points="50,4 28,32 50,54 72,32" 
          stroke="url(#jeweliaGoldGrad)" 
          strokeWidth="1.4" 
          fill="url(#jeweliaInnerGlow)"
        />

        {/* Second Life Eco-Loop Accent Dot (Green/Gold fusion) */}
        <circle cx="50" cy="54" r="4" fill="#FFF2C6" />
        <circle cx="82" cy="28" r="2.5" fill="#10B981" opacity="0.9" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ 
            fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif", 
            fontWeight: 800, 
            fontSize: `${size * 0.58}px`, 
            letterSpacing: '2.5px',
            background: 'linear-gradient(135deg, #FFF6D6 0%, #E5C158 40%, #D4AF37 70%, #996515 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'block'
          }}>
            HRSDGDG
          </span>
          {subtitle && (
            <span style={{ 
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", 
              fontSize: `${Math.max(size * 0.22, 7.5)}px`, 
              letterSpacing: '1.8px', 
              color: '#D4AF37', 
              opacity: 0.9,
              fontWeight: 600,
              textTransform: 'uppercase',
              marginTop: '4px'
            }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { OriaLogo as JeweliaLogo };
