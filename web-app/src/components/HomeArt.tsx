'use client';
import { useT } from '../lib/useLang';
// Illustrations for the home page, drawn in SVG in the brand colours.
// They are decorative scenes, not data: anything that looks like a reading
// (arrival time, distance) is labelled as an example on the page.
//
// Colours that change between the light and dark themes come from classes
// (a-sky, a-road, ...) whose fills are set in home.css. Elements marked
// a-night only appear in the dark theme.

const INK = '#10203a';
const GREEN = '#0e7c66';
const AMBER = '#ffb347';

const Person = ({ x, y = 332, skin, shirt, pack, cap = false, scale = 1 }: { x: number; y?: number; skin: string; shirt: string; pack?: string; cap?: boolean; scale?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect className="a-leg" x="-6" y="-19" width="5" height="19" rx="2.5" />
    <rect className="a-leg" x="1" y="-19" width="5" height="19" rx="2.5" />
    {pack && <rect x="-14" y="-43" width="8" height="21" rx="4" fill={pack} />}
    <rect x="-9" y="-47" width="18" height="32" rx="8" fill={shirt} />
    <circle cx="0" cy="-57" r="9" fill={skin} />
    {cap ? (
      // a driver's peaked cap
      <>
        <path d="M-9.6 -59.5a9.6 9.6 0 0 1 19.2 0z" fill={INK} />
        <rect x="-10" y="-61" width="24" height="3.6" rx="1.8" fill={INK} />
        <circle cx="0" cy="-64.5" r="1.8" fill={AMBER} />
      </>
    ) : (
      <path d="M-9.4 -58a9.4 9.4 0 0 1 18.8 0c-5-4.6-13.8-4.6-18.8 0z" fill="#262b36" />
    )}
  </g>
);

const RoundTree = ({ x, y = 332, size = 1, light = false }: { x: number; y?: number; size?: number; light?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${size})`}>
    <rect x="-4" y="-34" width="8" height="34" rx="3" fill="#946544" />
    <g className={light ? 'a-tree2' : 'a-tree1'}>
      <circle cx="0" cy="-52" r="26" />
      <circle cx="-14" cy="-38" r="16" />
      <circle cx="15" cy="-40" r="17" />
    </g>
    <circle cx="-8" cy="-60" r="9" fill="#fff" opacity=".14" />
  </g>
);

const Palm = ({ x, y = 332, flip = false }: { x: number; y?: number; flip?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`} fill="none" strokeLinecap="round">
    <path d="M0 0C-5 -34 4 -66 12 -94" stroke="#946544" strokeWidth="9" />
    <g className="a-frond" strokeWidth="9">
      <path d="M12 -94C-12 -112 -38 -106 -54 -88" />
      <path d="M12 -94C-6 -124 -30 -134 -52 -128" />
      <path d="M12 -94C18 -128 38 -142 60 -140" />
      <path d="M12 -94C40 -114 66 -108 80 -90" />
      <path d="M12 -94C34 -96 52 -84 60 -64" />
    </g>
    <circle cx="14" cy="-90" r="6" fill={AMBER} stroke="none" />
  </g>
);

const Building = ({ x, width, height }: { x: number; width: number; height: number }) => {
  const top = 330 - height;
  const columns = Math.floor((width - 16) / 34);
  const gap = (width - columns * 20) / (columns + 1);
  return (
    <g>
      <rect className="a-bld" x={x} y={top} width={width} height={height} rx="5" />
      <rect className="a-roof" x={x - 6} y={top - 7} width={width + 12} height="11" rx="4" />
      {[0, 1].map(row => Array.from({ length: columns }, (_, i) => (
        <rect className="a-win" key={`${row}-${i}`} x={x + gap + i * (20 + gap)} y={top + 16 + row * 32} width="20" height="19" rx="4" />
      )))}
    </g>
  );
};

const STARS = [
  [70, 60, 2.2], [190, 34, 1.6], [300, 86, 2], [352, 30, 1.4], [540, 44, 2.2], [636, 104, 1.5], [700, 26, 1.8],
  [848, 70, 1.5], [906, 30, 2.1], [1120, 40, 1.7], [1176, 110, 2.2], [1300, 54, 1.6], [1380, 96, 2], [470, 150, 1.4], [1060, 170, 1.3]
];

// The hero scene: a UniShuttle bus pulling up to the stop outside a university.
// Everything that matters sits in the middle so phones, which crop the sides, still show it.
export function HeroScene() {
  const t = useT();
  return (
    <svg className="h-scene" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" role="img" aria-label={t("A UniShuttle bus arriving at a university bus stop")}>
      <defs>
        <radialGradient id="h-sun-glow">
          <stop className="a-glow" offset="0" />
          <stop className="a-glow" offset=".45" stopOpacity=".5" />
          <stop className="a-glow" offset="1" stopOpacity="0" />
        </radialGradient>
        <clipPath id="h-bus-shape"><rect width="264" height="76" rx="18" /></clipPath>
      </defs>

      <g className="a-night" fill="#fff">
        {STARS.map(([cx, cy, r], i) => <circle className={i % 3 === 0 ? 'h-twinkle' : undefined} key={cx} cx={cx} cy={cy} r={r} opacity={0.5 + (i % 4) * 0.15} />)}
      </g>

      {/* the sun by day, the moon by night */}
      <circle cx="1010" cy="78" r="92" fill="url(#h-sun-glow)" />
      <circle className="a-sun" cx="1010" cy="78" r="33" />
      <g className="a-night" fill="#d9d3b4" opacity=".6">
        <circle cx="998" cy="68" r="7" /><circle cx="1022" cy="88" r="5" /><circle cx="1004" cy="96" r="3.5" />
      </g>

      <g className="a-cloud">
        <g className="h-cloud slow"><ellipse cx="430" cy="96" rx="58" ry="20" /><ellipse cx="470" cy="80" rx="40" ry="25" /><ellipse cx="396" cy="84" rx="30" ry="18" /></g>
        <g className="h-cloud" opacity=".9"><ellipse cx="760" cy="56" rx="46" ry="15" /><ellipse cx="792" cy="44" rx="30" ry="19" /></g>
        <g className="h-cloud slow" opacity=".95"><ellipse cx="1250" cy="118" rx="60" ry="19" /><ellipse cx="1214" cy="104" rx="36" ry="22" /><ellipse cx="1290" cy="106" rx="30" ry="17" /></g>
        <g className="h-cloud" opacity=".85"><ellipse cx="150" cy="140" rx="52" ry="17" /><ellipse cx="184" cy="127" rx="32" ry="20" /></g>
      </g>

      {/* hills */}
      <path className="a-hill1" d="M0 296C190 214 372 238 560 280S900 198 1120 258s250-30 320 10v152H0z" />
      <path className="a-hill2" d="M0 330C240 276 430 306 650 316s370-40 790 4v100H0z" />

      {/* far left and right, seen on wide screens */}
      <RoundTree x={96} size={1.1} light />
      <Building x={170} width={104} height={70} />
      <RoundTree x={310} size={0.9} />
      <Building x={1290} width={112} height={82} />
      <RoundTree x={1250} size={1.05} light />
      <Palm x={1196} flip />

      {/* left of the campus */}
      <Building x={372} width={122} height={88} />
      <RoundTree x={344} size={0.85} light />
      <Palm x={520} />
      <RoundTree x={590} size={0.75} />

      {/* the university */}
      <Building x={1040} width={128} height={100} />
      <rect className="a-step1" x="760" y="330" width="280" height="8" />
      <rect className="a-step2" x="770" y="322" width="260" height="8" />
      <rect className="a-wall" x="784" y="214" width="232" height="108" />
      <rect className="a-trim" x="776" y="202" width="248" height="14" rx="3" />
      <path d="M766 202L900 144l134 58z" fill={GREEN} />
      <circle cx="900" cy="181" r="13" fill="#fff7ea" />
      <path d="M900 173v8l6 4" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path className="a-pole" d="M900 144V110" strokeWidth="3" strokeLinecap="round" />
      <path d="M901 111h27l-7 9 7 9h-27z" fill={AMBER} />
      {[798, 848, 938, 988].map(cx => (
        <g key={cx}>
          <rect className="a-col" x={cx} y="220" width="14" height="100" />
          <rect className="a-colcap" x={cx - 3} y="216" width="20" height="7" rx="2" />
          <rect className="a-colcap" x={cx - 3} y="315" width="20" height="7" rx="2" />
        </g>
      ))}
      {[820, 960].map(wx => (
        <g className="a-glass" key={wx}>
          <path d={`M${wx} 268v-20a10 10 0 0 1 20 0v20z`} />
          <rect x={wx} y="282" width="20" height="24" rx="4" />
        </g>
      ))}
      <path d="M882 322v-44a18 18 0 0 1 36 0v44z" fill="#0a6151" />
      <circle cx="910" cy="300" r="2.4" fill={AMBER} />
      <RoundTree x={1192} size={0.8} />

      {/* pavement, road, grass */}
      <rect className="a-pave" y="330" width="1440" height="11" />
      <rect className="a-road" y="340" width="1440" height="59" />
      <path d="M0 369.5h1440" stroke="#fff" strokeOpacity=".8" strokeWidth="4" strokeDasharray="34 26" />
      <rect className="a-grass" y="398" width="1440" height="22" />
      {[60, 210, 388, 548, 742, 916, 1090, 1262, 1396].map((fx, i) => (
        <circle key={fx} cx={fx} cy={408 + (i % 3) * 3} r="3.2" fill={i % 2 ? '#fff' : AMBER} />
      ))}

      {/* the bus stop and the students waiting */}
      <path className="a-pole" d="M1008 332V258" strokeWidth="5" strokeLinecap="round" />
      <rect x="992" y="238" width="32" height="32" rx="9" fill={AMBER} />
      <rect x="1000" y="247" width="16" height="11" rx="3" fill="none" stroke={INK} strokeWidth="2.4" />
      <path d="M1002 262v2M1014 262v2" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <Person x={1036} skin="#f1c6a2" shirt="#ff8f6b" pack="#3b82c4" />
      <Person x={1064} skin="#b97f58" shirt="#5aa9e6" pack={AMBER} />

      {/* the bus */}
      <g transform="translate(500 262)">
        <g className="h-bus">
          <ellipse cx="132" cy="90" rx="130" ry="6" fill="#000" opacity=".2" />
          <g className="h-bus-body">
            <path className="a-night" d="M260 52L392 34v56L260 68z" fill="#ffe08a" opacity=".22" />
            <g clipPath="url(#h-bus-shape)">
              <rect width="264" height="76" fill="#14b88f" />
              <rect width="264" height="9" fill="#fff" opacity=".3" />
              <rect y="47" width="264" height="29" fill={GREEN} />
              <rect y="44" width="264" height="5" fill={AMBER} />
            </g>
            <g className="a-buswin">
              {[16, 64, 112, 160].map(wx => <rect key={wx} x={wx} y="13" width="40" height="25" rx="7" />)}
              <path d="M212 13h26a14 14 0 0 1 14 14v11h-40z" />
            </g>
            {[36, 84, 180].map(hx => <circle key={hx} cx={hx} cy="31" r="7" fill={INK} opacity=".3" />)}
            <rect x="255" y="53" width="7" height="11" rx="3" fill="#ffe08a" />
            <rect x="2" y="53" width="6" height="11" rx="3" fill="#ff7b72" />
            <g transform="translate(120 52) scale(.3)" fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round">
              <path d="M8 28V44a15 15 0 0 0 30 0V30a15 15 0 0 1 30 0V56" />
            </g>
            <circle cx="60" cy="76" r="16" fill="#1b2738" /><circle cx="60" cy="76" r="6.5" fill="#cfd8e3" />
            <circle cx="204" cy="76" r="16" fill="#1b2738" /><circle cx="204" cy="76" r="6.5" fill="#cfd8e3" />
          </g>

          {/* live location pin riding above the bus */}
          <g transform="translate(132 -32)">
            <circle className="h-pulse" r="20" fill="#35f0bd" opacity=".5" />
            <path d="M0 28C-13 12-16 4-16-4a16 16 0 1 1 32 0c0 8-3 16-16 32z" fill={GREEN} />
            <circle cy="-4" r="6" fill="#fff" />
            <rect x="24" y="-17" width="58" height="26" rx="13" fill="#fff" stroke="#c5eee0" strokeWidth="1.5" />
            <circle cx="37" cy="-4" r="4" fill="#12b48c" />
            <text x="59" y="1" textAnchor="middle" fontSize="13" fontWeight="800" fill={GREEN} style={{ letterSpacing: '.06em' }}>{t("LIVE")}</text>
          </g>
        </g>
      </g>
    </svg>
  );
}

// A thin road scene for the top of the inner pages: hills, a few trees and
// buildings, and a small UniShuttle bus. Night version comes from the theme.
export function RoadBand() {
  return (
    <svg className="h-band" viewBox="0 0 1440 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path className="a-hill1" d="M0 80C220 34 420 52 640 70s420-50 800 4v56H0z" />
      <path className="a-hill2" d="M0 98C260 70 520 88 760 92s420-26 680 0v38H0z" />
      <g transform="translate(0 -230)">
        <RoundTree x={150} size={0.7} light />
        <Building x={220} width={92} height={56} />
        <RoundTree x={360} size={0.6} />
        <Palm x={1020} />
        <Building x={1080} width={100} height={64} />
        <RoundTree x={1230} size={0.75} light />
      </g>
      <rect className="a-pave" y="100" width="1440" height="5" />
      <rect className="a-road" y="104" width="1440" height="20" />
      <path d="M0 114h1440" stroke="#fff" strokeOpacity=".8" strokeWidth="3" strokeDasharray="26 20" />
      <rect className="a-grass" y="123" width="1440" height="7" />
      <g transform="translate(672 64)">
        <g className="h-bus-body">
          <path className="a-night" d="M86 22l60-8v26l-60-4z" fill="#ffe08a" opacity=".22" />
          <rect width="86" height="40" rx="11" fill="#14b88f" />
          <rect y="24" width="86" height="16" rx="0" fill={GREEN} /><rect y="28" width="86" height="12" rx="6" fill={GREEN} />
          <rect y="22" width="86" height="3" fill={AMBER} />
          <g className="a-buswin"><rect x="7" y="6" width="17" height="13" rx="4" /><rect x="28" y="6" width="17" height="13" rx="4" /><rect x="49" y="6" width="17" height="13" rx="4" /><rect x="70" y="6" width="12" height="13" rx="4" /></g>
          <circle cx="20" cy="41" r="7" fill="#1b2738" /><circle cx="66" cy="41" r="7" fill="#1b2738" />
        </g>
      </g>
    </svg>
  );
}

// A phone showing the live tracking screen, with the bus moving along its route.
const ROUTE = 'M58 356C58 300 96 290 128 262S150 196 196 180s52-48 40-84';

export function PhoneTracking() {
  const t = useT();
  const bus = (
    <g>
      <circle r="15" fill={GREEN} stroke="#fff" strokeWidth="3" />
      <rect x="-7" y="-5.5" width="14" height="9" rx="2.5" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M-4.5 6v1.5M4.5 6v1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
  return (
    <svg className="h-phone" viewBox="0 0 300 560" role="img" aria-label={t("Example of the live tracking screen on a phone")}>
      <defs><clipPath id="h-screen"><rect x="16" y="16" width="268" height="528" rx="30" /></clipPath></defs>
      <rect className="a-phone" width="300" height="560" rx="44" />
      <g clipPath="url(#h-screen)">
        <rect x="16" y="16" width="268" height="528" fill="#eaf6f1" />
        {/* map */}
        <path d="M16 150h268M16 300h268M100 16v528M214 16v528" stroke="#fff" strokeWidth="18" />
        <path d="M16 230h268M160 16v528" stroke="#fff" strokeWidth="9" />
        <rect x="112" y="162" width="40" height="60" rx="6" fill="#d3ecdf" />
        <rect x="226" y="312" width="58" height="96" rx="6" fill="#c2e9d6" />
        <rect x="24" y="312" width="64" height="40" rx="6" fill="#d9e9f6" />
        <path d="M16 452c60-22 110 16 168-6s70-14 100-8v106H16z" fill="#cfe8fb" />
        {/* route */}
        <path d={ROUTE} fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round" />
        <path d={ROUTE} fill="none" stroke="#12b48c" strokeWidth="7" strokeLinecap="round" />
        {/* your stop and the university */}
        <g transform="translate(58 356)"><circle r="10" fill={AMBER} stroke="#fff" strokeWidth="3" /></g>
        <g transform="translate(236 96)">
          <path d="M0 24C-11 10-14 3-14-4a14 14 0 1 1 28 0c0 7-3 14-14 28z" fill={INK} />
          <path d="M-6 -1l6-4 6 4M-4.5 -1v5h9v-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* bus: moving when motion is allowed, parked on the route otherwise */}
        <g className="h-motion">
          <animateMotion path={ROUTE} dur="9s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.85;1" calcMode="linear" />
          {bus}
        </g>
        <g className="h-still" transform="translate(150 196)">{bus}</g>

        {/* top bar */}
        <rect x="16" y="16" width="268" height="62" fill="#fff" />
        <text x="34" y="55" fontSize="17" fontWeight="800" fill={INK}>{t("Live Tracking")}</text>
        <rect x="208" y="36" width="58" height="26" rx="13" fill="#e6faf3" />
        <circle cx="222" cy="49" r="4" fill="#12b48c" />
        <text x="243" y="54" textAnchor="middle" fontSize="12" fontWeight="800" fill={GREEN}>{t("LIVE")}</text>

        {/* arrival card */}
        <rect x="30" y="424" width="240" height="104" rx="20" fill="#fff" />
        <text x="50" y="456" fontSize="13" fontWeight="700" fill="#74839a">{t("Arrives in")}</text>
        <text x="50" y="496" fontSize="34" fontWeight="800" fill={GREEN}>8<tspan fontSize="18" dx="5">{t('min')}</tspan></text>
        <text x="250" y="456" textAnchor="end" fontSize="13" fontWeight="700" fill="#74839a">{t("Distance")}</text>
        <text x="250" y="492" textAnchor="end" fontSize="22" fontWeight="800" fill={INK}>{t("3.2 km")}</text>
      </g>
      <rect x="112" y="26" width="76" height="8" rx="4" fill={INK} opacity=".12" />
    </svg>
  );
}

// A student checking the bus on their phone at the stop.
export function StudentArt() {
  return (
    <svg className="h-spot" viewBox="0 0 360 170" aria-hidden="true">
      <rect className="a-spot-sky" width="360" height="170" />
      <g className="a-night" fill="#fff"><circle cx="40" cy="26" r="1.8" /><circle cx="150" cy="18" r="1.5" /><circle cx="222" cy="40" r="1.8" opacity=".7" /><circle cx="340" cy="92" r="1.4" /></g>
      <circle className="a-sun" cx="300" cy="46" r="22" />
      <g className="a-cloud"><ellipse cx="96" cy="44" rx="34" ry="12" /><ellipse cx="118" cy="36" rx="22" ry="14" /></g>
      <path className="a-hill2" d="M0 138c70-26 140-8 200-14s110-16 160-2v48H0z" />
      <rect className="a-road" y="150" width="360" height="20" />
      <path d="M0 160h360" stroke="#fff" strokeOpacity=".8" strokeWidth="3" strokeDasharray="22 16" />
      <RoundTree x={318} y={150} size={0.8} light />
      <path className="a-pole" d="M70 150V70" strokeWidth="5" strokeLinecap="round" />
      <rect x="54" y="50" width="32" height="32" rx="9" fill={AMBER} />
      <rect x="62" y="59" width="16" height="11" rx="3" fill="none" stroke={INK} strokeWidth="2.4" />
      <Person x={140} y={150} scale={1.55} skin="#b97f58" shirt="#5aa9e6" pack={AMBER} />
      {/* phone in hand, with the bus on it */}
      <rect x="156" y="92" width="20" height="32" rx="5" fill={INK} stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
      <rect x="159" y="96" width="14" height="22" rx="2" fill="#e6faf3" />
      <circle cx="166" cy="107" r="4" fill="#12b48c" />
      <path className="a-dash" d="M186 84c26-30 62-34 92-16" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />
      <g transform="translate(226 96)">
        <rect width="86" height="44" rx="12" fill="#14b88f" />
        <rect y="26" width="86" height="12" fill={GREEN} /><rect y="32" width="86" height="12" rx="6" fill={GREEN} />
        <g className="a-buswin"><rect x="8" y="8" width="18" height="14" rx="4" /><rect x="30" y="8" width="18" height="14" rx="4" /><rect x="52" y="8" width="26" height="14" rx="4" /></g>
        <circle cx="20" cy="46" r="8" fill="#1b2738" /><circle cx="66" cy="46" r="8" fill="#1b2738" />
      </g>
    </svg>
  );
}

// A driver with the month's passenger list ticked off.
export function DriverArt() {
  const rows = [
    { y: 50, color: '#12b48c', tick: true },
    { y: 78, color: '#12b48c', tick: true },
    { y: 106, color: AMBER, tick: false }
  ];
  return (
    <svg className="h-spot" viewBox="0 0 360 170" aria-hidden="true">
      <rect className="a-spot-warm" width="360" height="170" />
      <g className="a-night" fill="#fff"><circle cx="130" cy="24" r="1.6" /><circle cx="20" cy="84" r="1.5" opacity=".7" /><circle cx="346" cy="16" r="1.6" /></g>
      <circle className="a-sun" cx="56" cy="44" r="20" />
      <path className="a-spot-hill" d="M0 140c80-22 150-6 210-12s100-12 150-4v46H0z" />
      <rect className="a-road" y="150" width="360" height="20" />
      <path d="M0 160h360" stroke="#fff" strokeOpacity=".8" strokeWidth="3" strokeDasharray="22 16" />
      <Person x={104} y={150} scale={1.55} skin="#f1c6a2" shirt={GREEN} cap />
      {/* the passenger list */}
      <g transform="translate(176 22)">
        <rect width="150" height="122" rx="14" fill="#fff" />
        <rect x="14" y="14" width="74" height="9" rx="4.5" fill={INK} opacity=".8" />
        {rows.map(r => (
          <g key={r.y}>
            <circle cx="26" cy={r.y} r="9" fill={r.color} />
            {r.tick
              ? <path d={`M21.5 ${r.y}l3.2 3.2 5.6-6`} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              : <path d={`M26 ${r.y - 4}v5`} stroke={INK} strokeWidth="2.4" strokeLinecap="round" />}
            <rect x="44" y={r.y - 5} width={r.tick ? 62 : 48} height="9" rx="4.5" fill="#dfe6ee" />
            <rect x="116" y={r.y - 5} width="20" height="9" rx="4.5" fill={r.tick ? '#c5eee0' : '#ffe2b5'} />
          </g>
        ))}
      </g>
    </svg>
  );
}
