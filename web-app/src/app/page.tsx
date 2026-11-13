import Link from 'next/link';
import HomeNav from '../components/HomeNav';
import { BrandMark, BrandWordmark } from '../components/Brand';
import { DriverArt, HeroScene, PhoneTracking, StudentArt } from '../components/HomeArt';
import { business, getCommissionPercent } from '../lib/business';
import { homeFontVariables } from '../lib/fonts';
import './home.css';

export const metadata = {
  title: 'UniShuttle: university bus travel in Sri Lanka',
  description:
    'UniShuttle connects university students with private bus operators in Sri Lanka. Request a seat, answer attendance polls, pay your fare to your driver and track your bus live.'
};

// The key must match THEME_KEY in components/HomeNav.tsx.
const THEME_SCRIPT = `try{if(localStorage.getItem('us-home-theme')==='dark')document.currentScript.parentElement.setAttribute('data-theme','dark')}catch(e){}`;

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const icons = {
  student: <><path d="M3 9.500L12 5l9 4.500-9 4.500z" /><path d="M7 11.800V16c1.500 1.400 3.200 2 5 2s3.500-.6 5-2v-4.200" /><path d="M21 9.500V14" /></>,
  wheel: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.500" /><path d="M12 14.500V21M9.700 11.200L3.600 9M14.300 11.200L20.400 9" /></>,
  shield: <><path d="M12 3l8 3.500v5c0 4.600-3.200 8.600-8 9.500-4.800-.9-8-4.900-8-9.500v-5z" /><path d="M9 12l2.200 2.200L15.200 10" /></>,
  pin: <><path d="M12 21c-4.500-5-7-8.300-7-11.500a7 7 0 0114 0c0 3.200-2.500 6.500-7 11.500z" /><circle cx="12" cy="9.500" r="2.500" /></>,
  cash: <><rect x="2.500" y="6" width="19" height="12" rx="2.500" /><circle cx="12" cy="12" r="2.800" /><path d="M6 9.500v5M18 9.500v5" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4.500 20c1-3.600 4-5.500 7.500-5.500s6.500 1.900 7.500 5.500" /></>,
  bus: <><rect x="4" y="4" width="16" height="13" rx="3" /><path d="M4 11h16M8 17v2.500M16 17v2.500M8 14h.010M16 14h.010" /></>,
  poll: <><path d="M9 11.500l2.500 2.500L20 6" /><path d="M20 12.500V18a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" /></>,
  list: <><rect x="4" y="3.500" width="16" height="17" rx="2.500" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  calendar: <><rect x="3.500" y="5" width="17" height="15.500" rx="2.500" /><path d="M3.500 10h17M8 3v4M16 3v4" /><path d="M9.500 15l1.800 1.800 3.400-3.600" /></>,
  bell: <><path d="M6 16.500V11a6 6 0 0112 0v5.500l1.500 2h-15z" /><path d="M10 21h4" /></>
};

const steps = [
  { icon: icons.profile, title: 'Sign up', text: 'Create your account with your university and pickup point.' },
  { icon: icons.bus, title: 'Pick your bus', text: 'Choose a verified bus and ask for a seat. The driver accepts it.' },
  { icon: icons.cash, title: 'Pay your driver', text: 'Hand your fare to the driver in cash. They mark it as paid.' },
  { icon: icons.pin, title: 'Track and ride', text: 'See your bus on the map and know when it will arrive.' }
];

const features = [
  { icon: icons.bus, tone: 'green', title: 'Find a bus', text: 'See verified buses going to your university, with pickup time and monthly fare.' },
  { icon: icons.pin, tone: 'blue', title: 'Live tracking', text: 'Watch the bus move on the map once your driver starts the trip.' },
  { icon: icons.poll, tone: 'amber', title: 'Coming tomorrow?', text: 'Drivers ask with one tap. Students answer, so nobody waits for no reason.' },
  { icon: icons.list, tone: 'green', title: 'Fare tracker', text: 'Drivers see who has paid, who has not and who is not travelling this month.' },
  { icon: icons.calendar, tone: 'blue', title: 'Daily rides', text: 'Need the bus for just one day? Book a single ride.' },
  { icon: icons.bell, tone: 'amber', title: 'Notices', text: 'Drivers send one message and every passenger sees it.' }
];

export default async function HomePage() {
  const commissionPercent = await getCommissionPercent();
  const address = business.address;

  return (
    <div className={`home ${homeFontVariables}`} suppressHydrationWarning>
      {/* Applies a remembered dark-mode choice before the page is drawn, so it never flashes light first. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <HomeNav />

      <main>
        {/* ---------------- hero ---------------- */}
        <section className="h-hero">
          <div className="h-wrap h-hero-text">
            <span className="h-pill"><i />For students and bus drivers in Sri Lanka</span>
            <h1>Your university bus, <em>made easy</em>.</h1>
            <p className="h-lead">
              Find a bus, book your seat and see where it is on the map.
              Drivers keep their passengers and fares in one simple place.
            </p>
            <div className="h-actions">
              <Link href="/signup" className="h-btn primary"><Icon>{icons.student}</Icon>I&apos;m a student</Link>
              <Link href="/signup?role=driver" className="h-btn amber"><Icon>{icons.wheel}</Icon>I&apos;m a driver</Link>
            </div>
            <p className="h-signin">Already have an account? <Link href="/login">Sign in</Link></p>
          </div>
          <HeroScene />
        </section>

        <div className="h-strip">
          <div className="h-wrap h-strip-inner">
            <div className="h-strip-item"><Icon>{icons.shield}</Icon>Every driver is checked first</div>
            <div className="h-strip-item"><Icon>{icons.pin}</Icon>See your bus live on the map</div>
            <div className="h-strip-item"><Icon>{icons.cash}</Icon>Pay your driver in cash</div>
          </div>
        </div>

        {/* ---------------- who are you ---------------- */}
        <section className="h-section">
          <div className="h-wrap">
            <div className="h-head">
              <span className="h-kicker">Start here</span>
              <h2>Who are you?</h2>
              <p>Pick one and we&apos;ll set you up in a few minutes.</p>
            </div>

            <div className="h-paths">
              <article className="h-path student">
                <StudentArt />
                <div className="h-path-body">
                  <h3>I&apos;m a student</h3>
                  <ul className="h-ticks">
                    <li>Find a bus that goes to your university</li>
                    <li>Ask for a seat and get a reply from the driver</li>
                    <li>See where your bus is and when it arrives</li>
                  </ul>
                  <Link href="/signup" className="h-btn primary">Create student account</Link>
                </div>
              </article>

              <article className="h-path driver">
                <DriverArt />
                <div className="h-path-body">
                  <h3>I&apos;m a driver</h3>
                  <ul className="h-ticks">
                    <li>Get students for your bus, at the fare you set</li>
                    <li>See who has paid this month at a glance</li>
                    <li>
                      {commissionPercent > 0
                        ? `We keep ${commissionPercent}% of fares. The rest is yours`
                        : 'You keep all of your fares'}
                    </li>
                  </ul>
                  <Link href="/signup?role=driver" className="h-btn amber">Register my bus</Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ---------------- live tracking ---------------- */}
        <section className="h-section tint">
          <div className="h-wrap">
            <div className="h-track">
              <div className="h-phone-wrap">
                <PhoneTracking />
                <span className="h-example">Example screen</span>
              </div>
              <div>
                <span className="h-kicker">Live tracking</span>
                <h2>No more guessing where the bus is</h2>
                <p>
                  When your driver starts the trip, your bus shows up on the map
                  and moves as it drives. You see how far away it is and when it
                  will reach you.
                </p>
                <ul className="h-ticks">
                  <li>Works on the website and in the app</li>
                  <li>Only students travelling on the bus can see it</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- steps ---------------- */}
        <section className="h-section tint" style={{ paddingTop: 20 }}>
          <div className="h-wrap">
            <div className="h-head">
              <span className="h-kicker">How it works</span>
              <h2>Four easy steps</h2>
            </div>
            <div className="h-steps">
              {steps.map(step => (
                <div className="h-step" key={step.title}>
                  <div className="h-step-icon"><Icon>{step.icon}</Icon></div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: 30 }}>
              <Link href="/how-it-works" className="h-link">Read the full guide</Link>
            </p>
          </div>
        </section>

        {/* ---------------- features ---------------- */}
        <section className="h-section">
          <div className="h-wrap">
            <div className="h-head">
              <span className="h-kicker">What you get</span>
              <h2>Everything for the daily ride</h2>
            </div>
            <div className="h-features">
              {features.map(feature => (
                <div className="h-feature" key={feature.title}>
                  <div className={`h-feature-icon ${feature.tone}`}><Icon>{feature.icon}</Icon></div>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-soon"><b>Coming soon</b>Pay your fare by card in the app.</div>
          </div>
        </section>

        {/* ---------------- closing ---------------- */}
        <section className="h-section" style={{ paddingTop: 0 }}>
          <div className="h-wrap">
            <div className="h-cta">
              <h2>Ready when your bus is</h2>
              <p>It&apos;s free to join and takes a few minutes.</p>
              <div className="h-actions">
                <Link href="/signup" className="h-btn amber">Create an account</Link>
                <Link href="/contact" className="h-btn onDark">Talk to us</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="h-footer">
        <div className="h-wrap">
          <div className="h-footer-grid">
            <div>
              <div className="h-footer-brand">
                <BrandMark height={30} />
                <BrandWordmark height={20} />
              </div>
              <p>University bus travel in Sri Lanka, made simple for students and drivers.</p>
            </div>
            <div>
              <h4>Site</h4>
              <div className="h-footer-links">
                <Link href="/how-it-works">How it works</Link>
                <Link href="/contact">Contact us</Link>
              </div>
            </div>
            <div>
              <h4>Your account</h4>
              <div className="h-footer-links">
                <Link href="/login">Sign in</Link>
                <Link href="/signup">Create an account</Link>
              </div>
            </div>
            <div>
              <h4>Get in touch</h4>
              <div className="h-footer-links">
                <a href={`mailto:${business.email}`}>{business.email}</a>
                <a href={`tel:${business.phoneHref}`}>{business.phone}</a>
                <span>{address.line1}<br />{address.city}, {address.country}</span>
              </div>
            </div>
          </div>
          <div className="h-footer-bottom">© {new Date().getFullYear()} {business.name}. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
