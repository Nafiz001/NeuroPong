// VOLTARI faction mark — lightning bolt inside a hex cell.

export default function VoltariMark({ className, size = 64 }) {
  const core = '#7C3AED';
  const glow = '#C084FC';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Voltari"
      role="img"
    >
      <defs>
        <linearGradient id="volt-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#0B0F1A" />
        </linearGradient>
        <radialGradient id="volt-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.7" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hex cell */}
      <polygon
        points="32,4 56,18 56,46 32,60 8,46 8,18"
        fill="url(#volt-bg)"
        stroke={core}
        strokeWidth="2.2"
      />

      {/* Inner glow */}
      <polygon
        points="32,4 56,18 56,46 32,60 8,46 8,18"
        fill="url(#volt-glow)"
      />

      {/* Lightning bolt */}
      <path
        d="M34 12 L18 34 L28 34 L24 52 L44 28 L32 28 L38 12 Z"
        fill={glow}
        stroke={core}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
