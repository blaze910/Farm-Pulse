export function FarmlandIllustration({ className }) {
  return (
    <svg
      viewBox="0 0 1200 520"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      {/* sky glow / sun */}
      <circle cx="1040" cy="90" r="120" fill="var(--color-risk-moderate)" opacity="0.16" />
      <circle cx="1040" cy="90" r="46" fill="var(--color-risk-moderate)" opacity="0.35" />

      {/* distant hills */}
      <path d="M0 300 Q150 250 320 290 T650 270 T1000 300 T1200 280 V520 H0 Z" fill="var(--color-primary)" opacity="0.08" />
      <path d="M0 340 Q200 300 420 330 T760 320 T1200 340 V520 H0 Z" fill="var(--color-primary)" opacity="0.12" />

      {/* mid field band */}
      <path d="M0 390 Q180 360 400 385 T820 375 T1200 390 V520 H0 Z" fill="var(--color-primary)" opacity="0.18" />

      {/* foreground furrows — evenly spaced crop rows */}
      <g opacity="0.5">
        {Array.from({ length: 34 }).map((_, i) => {
          const x = i * 38 - 20;
          return (
            <path
              key={i}
              d={`M${x} 520 Q${x + 26} 460 ${x + 14} 410`}
              stroke="var(--color-primary)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity={0.35 + (i % 4) * 0.08}
            />
          );
        })}
      </g>

      {/* small farmhouse silhouette */}
      <g transform="translate(150,340)" opacity="0.55">
        <rect x="0" y="26" width="70" height="42" rx="2" fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="2" />
        <path d="M-8 28 L35 -4 L78 28 Z" fill="var(--color-primary)" opacity="0.6" />
        <rect x="30" y="42" width="14" height="26" fill="var(--color-border)" />
      </g>
    </svg>
  );
}
