// Decorative transit map: glowing routes with buses travelling along them.
// Drawn like a metro diagram (45-degree bends), not a geographic map.
const ROUTES = [
  { id: 'net-a', tone: 'mint', d: 'M-40 590 H210 L350 450 H640 L790 300 H1240' },
  { id: 'net-b', tone: 'amber', d: 'M-40 170 H170 L300 300 H530 L680 450 H980 L1110 580 H1240' },
  { id: 'net-c', tone: 'cyan', d: 'M430 -40 V150 L550 270 V520 L660 630 V740' },
  { id: 'net-d', tone: 'mint', d: 'M930 -40 V110 L790 250 V430 L900 540 V740' }
];

const STATIONS: [number, number][] = [
  [210, 590], [350, 450], [640, 450], [790, 300], [170, 170], [300, 300], [530, 300], [980, 450], [1110, 580],
  [430, 150], [550, 270], [550, 520], [660, 630], [930, 110], [790, 430], [900, 540]
];

const BUSES = [
  { route: 'net-a', tone: 'mint', dur: '19s', begin: '0s' },
  { route: 'net-b', tone: 'amber', dur: '24s', begin: '-9s' },
  { route: 'net-c', tone: 'cyan', dur: '15s', begin: '-4s' },
  { route: 'net-d', tone: 'mint', dur: '17s', begin: '-11s' }
];

export default function RouteNetwork() {
  return (
    <svg className="net" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {ROUTES.map(r => (
        <g key={r.id} className={`net-route ${r.tone}`}>
          <path id={r.id} className="net-base" d={r.d} />
          <path className="net-flow" d={r.d} />
        </g>
      ))}
      {STATIONS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="net-station" cx={cx} cy={cy} r="5" />)}
      {BUSES.map(b => (
        <g key={b.route} className={`net-bus ${b.tone}`}>
          <circle className="net-halo" r="15" />
          <circle className="net-core" r="5.5" />
          <animateMotion dur={b.dur} begin={b.begin} repeatCount="indefinite">
            <mpath href={`#${b.route}`} />
          </animateMotion>
        </g>
      ))}
    </svg>
  );
}
