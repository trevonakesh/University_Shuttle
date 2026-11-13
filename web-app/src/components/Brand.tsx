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

// `tone` is the background the mark sits on: the light version uses the
// deeper green and amber so it stays readable on white.
export function BrandMark({ height = 30, tone = 'dark' }: { height?: number; tone?: 'light' | 'dark' }) {
  return (
    <svg viewBox="12 16 76 67" height={height} width={(height * 76) / 67} aria-hidden="true" style={{ flex: 'none', display: 'block' }}>
      <path d="M20 44V60a15 15 0 0 0 30 0V46a15 15 0 0 1 30 0V72" fill="none" stroke={tone === 'dark' ? '#35f0bd' : '#0e7c66'} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="26" r="8.5" fill={tone === 'dark' ? '#ffb347' : '#e8912f'} />
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

// The logo animation as a loading indicator: the bus drives the route and hops
// onto its stop, on a short loop. Drawn in SVG so it needs no extra download.
const LOOP = '1.7s';
const WAVE_LENGTH = 150.25;
const EASE = '.65 0 .35 1';

export function BrandLoader({ label, size = 54, tone = 'light' }: { label?: string; size?: number; tone?: 'light' | 'dark' }) {
  const line = tone === 'dark' ? '#35f0bd' : '#0e7c66';
  const dot = tone === 'dark' ? '#ffb347' : '#e8912f';
  return (
    <div className="brand-loader" role="status" aria-label={label ?? 'Loading'}>
      <svg viewBox="12 16 76 67" height={size} width={(size * 76) / 67} aria-hidden="true">
        <g className="bl-anim">
          <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.86;.97;1" dur={LOOP} repeatCount="indefinite" />
          <path d="M80 72V46a15 15 0 0 0 -30 0V60a15 15 0 0 1 -30 0V44" fill="none" stroke={line} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${WAVE_LENGTH} 190`} strokeDashoffset={WAVE_LENGTH}>
            <animate attributeName="stroke-dashoffset" values={`${WAVE_LENGTH};0;0`} keyTimes="0;.6;1" calcMode="spline" keySplines={`${EASE};0 0 1 1`} dur={LOOP} repeatCount="indefinite" />
          </path>
          <circle r="8.5" fill={dot}>
            <animateMotion path="M80 72V46a15 15 0 0 0 -30 0V60a15 15 0 0 1 -30 0V44V26" keyPoints="0;.893;1;1" keyTimes="0;.6;.74;1" calcMode="spline" keySplines={`${EASE};.3 0 .2 1;0 0 1 1`} dur={LOOP} repeatCount="indefinite" />
          </circle>
        </g>
        <g className="bl-still">
          <path d="M20 44V60a15 15 0 0 0 30 0V46a15 15 0 0 1 30 0V72" fill="none" stroke={line} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="26" r="8.5" fill={dot} />
        </g>
      </svg>
      {label && <span>{label}</span>}
    </div>
  );
}

// Full-screen logo on the first page of a visit. Runs from an inline script so
// it appears before React starts, and only hides the element (never removes
// it) so React can still take over the page.
const PAGE_LOADER_SCRIPT = `(function(){var e=document.getElementById('page-loader');if(!e)return;try{if(sessionStorage.getItem('us-seen')){e.style.display='none';return}sessionStorage.setItem('us-seen','1')}catch(_){}var s=Date.now(),hidden=false,hide=function(){if(hidden)return;hidden=true;setTimeout(function(){e.classList.add('done');setTimeout(function(){e.style.display='none'},450)},Math.max(0,1300-(Date.now()-s)))};if(document.readyState==='complete')hide();else{addEventListener('load',hide,{once:true});setTimeout(hide,3500)}})()`;

export function PageLoader() {
  return (
    <>
      <div id="page-loader" className="page-loader" suppressHydrationWarning>
        <BrandLoader tone="dark" size={104} />
      </div>
      <script dangerouslySetInnerHTML={{ __html: PAGE_LOADER_SCRIPT }} />
    </>
  );
}
