interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
  showIcon?: boolean;
}

export default function Logo({ className = '', variant = 'default', showIcon = true }: LogoProps) {
  const textColor = variant === 'light' ? '#FFFFFF' : '#6e5830';
  const accentColor = variant === 'light' ? '#d4b896' : '#a68b5b';

  return (
    <svg
      viewBox="0 0 240 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Decorasm"
    >
      {showIcon && (
        <g transform="translate(4, 2)">
          {/* Diamond — outer */}
          <path
            d="M18 0L34 18L18 36L2 18Z"
            stroke={accentColor}
            strokeWidth="2"
            fill="none"
          />
          {/* Diamond — inner rotated */}
          <path
            d="M18 6L28 18L18 30L8 18Z"
            stroke={textColor}
            strokeWidth="1.2"
            fill="none"
          />
          {/* Center dot */}
          <circle cx="18" cy="18" r="2" fill={accentColor} />
        </g>
      )}

      {/* Brand name */}
      <text
        x={showIcon ? '48' : '0'}
        y="28"
        fontFamily="var(--font-playfair), 'Playfair Display', Georgia, serif"
        fontSize="24"
        fontWeight="600"
        letterSpacing="5"
        fill={textColor}
      >
        DECORASM
      </text>

      {/* Subtle underline accent */}
      <line
        x1={showIcon ? '48' : '0'}
        y1="34"
        x2={showIcon ? '228' : '180'}
        y2="34"
        stroke={accentColor}
        strokeWidth="1"
        opacity="0.6"
      />
    </svg>
  );
}
