// The UniShuttle logo. Master files live in /brand; keep these shapes in step with them.

const LETTERS = [
  'M0 0V22a14 14 0 0 0 28 0V14a14 14 0 0 1 28 0V36',
  'M72 0V36',
  'M115 2H98a8 8 0 0 0 0 16H106a8 8 0 0 1 0 16H89',
  'M131 -20V36M131 14a14 14 0 0 1 28 0V36',
  'M175 0V22a14 14 0 0 0 28 0V0',
  'M214 2H268M222 -14V24a12 12 0 0 0 12 12H236M250 -14V24a12 12 0 0 0 12 12H264',
  'M282 -20V36',
  'M298 18H326A14 18 0 1 0 321.9 30.7'
];

export function BrandMark({ height = 30 }: { height?: number }) {
  return (
    <svg viewBox="12 16 76 67" height={height} width={(height * 76) / 67} aria-hidden="true" style={{ flex: 'none', display: 'block' }}>
      <path d="M20 44V60a15 15 0 0 0 30 0V46a15 15 0 0 1 30 0V72" fill="none" stroke="#35f0bd" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="26" r="8.5" fill="#ffb347" />
    </svg>
  );
}

export function BrandWordmark({ height = 20, color = '#eef6f4' }: { height?: number; color?: string }) {
  return (
    <svg viewBox="-6 -26 339 68" height={height} width={(height * 339) / 68} role="img" aria-label="UniShuttle" style={{ flex: 'none', display: 'block' }}>
      <g fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        {LETTERS.map(d => <path key={d} d={d} />)}
      </g>
      <circle cx="72" cy="-17" r="7.25" fill="#ffb347" />
    </svg>
  );
}
