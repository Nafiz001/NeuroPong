// EMBER LYNX faction mark — stylized lynx silhouette inside a flame arc.

export default function EmberLynxMark({ className, size = 64 }) {
  const core = '#F97316';
  const glow = '#FBBF24';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ember Lynx"
      role="img"
    >
      <defs>
        <linearGradient id="ember-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#431407" />
          <stop offset="100%" stopColor="#0B0F1A" />
        </linearGradient>
        <radialGradient id="ember-glow" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.6" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Shield */}
      <path
        d="M32 4 L56 14 L56 34 Q56 52 32 60 Q8 52 8 34 L8 14 Z"
        fill="url(#ember-bg)"
        stroke={core}
        strokeWidth="2.2"
      />
      <path
        d="M32 4 L56 14 L56 34 Q56 52 32 60 Q8 52 8 34 L8 14 Z"
        fill="url(#ember-glow)"
      />

      {/* Flame arc behind */}
      <path
        d="M16 44 Q20 24 32 16 Q44 24 48 44 Q44 36 38 36 Q40 30 32 24 Q26 32 28 38 Q22 36 16 44 Z"
        fill={core}
        opacity="0.85"
      />

      {/* Lynx head silhouette */}
      <path
        d="M24 40 L22 30 L26 32 L28 26 L32 30 L36 26 L38 32 L42 30 L40 40 Q36 46 32 46 Q28 46 24 40 Z"
        fill={glow}
        stroke="#0B0F1A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Eyes */}
      <circle cx="29" cy="37" r="1.2" fill="#0B0F1A" />
      <circle cx="35" cy="37" r="1.2" fill="#0B0F1A" />
    </svg>
  );
}
