// NeuroPong Arena wordmark. Inline SVG so it renders crisp at every size,
// color-swaps via currentColor, and ships with no external asset request.

export default function NeuroPongWordmark({ className, tone = 'light' }) {
  const wordFill = tone === 'light' ? '#F8FAFC' : '#0B0F1A';
  const accent   = '#8B5CF6';
  const subtle   = 'rgba(248, 250, 252, 0.62)';

  return (
    <svg
      className={className}
      viewBox="0 0 640 160"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NeuroPong Arena"
      role="img"
    >
      <defs>
        <linearGradient id="npw-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="55%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="npw-underline" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Synapse-accented N mark */}
      <g transform="translate(20, 28)">
        <rect x="0" y="0" width="80" height="80" rx="14" fill="none" stroke="url(#npw-grad)" strokeWidth="3" />
        <path
          d="M18 62 L18 18 L42 62 L42 18 L62 62"
          fill="none"
          stroke={wordFill}
          strokeWidth="6"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <circle cx="42" cy="40" r="4" fill={accent} />
        <path d="M42 40 L58 28" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        <circle cx="58" cy="28" r="2.5" fill={accent} />
      </g>

      {/* Wordmark */}
      <text
        x="120"
        y="78"
        fontFamily="'Space Grotesk Variable', 'Space Grotesk', system-ui, sans-serif"
        fontWeight="700"
        fontSize="58"
        letterSpacing="2"
        fill={wordFill}
      >
        NEUROPONG
      </text>

      <text
        x="122"
        y="110"
        fontFamily="'Space Grotesk Variable', 'Space Grotesk', system-ui, sans-serif"
        fontWeight="300"
        fontSize="18"
        letterSpacing="14"
        fill={subtle}
      >
        ARENA
      </text>

      {/* Accent underline */}
      <rect x="120" y="124" width="360" height="2" fill="url(#npw-underline)" />
    </svg>
  );
}
