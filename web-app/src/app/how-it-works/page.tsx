import Link from 'next/link';
import PublicShell from '../../components/PublicShell';
import { RoadBand } from '../../components/HomeArt';
import { rules, getCommissionPercent } from '../../lib/business';
import { getT } from '../../lib/i18n-server';

export const metadata = {
  title: 'How it works | UniShuttle',
  description:
    'How UniShuttle works for students and bus drivers: seat requests, daily rides, attendance polls, monthly fares, live tracking and more.'
};

const studentSteps = [
  { title: 'Register', text: 'Sign up with your name, university, pickup point and an emergency contact.' },
  { title: 'Choose a bus', text: 'Look through the checked buses. Each one shows its route, pickup time, seats and monthly fare.' },
  { title: 'Ask for a seat', text: 'Send a seat request. You will see when the driver accepts or turns it down.' },
  { title: 'Travel', text: 'Answer the driver’s “Coming tomorrow?” polls, read their notices and follow the bus on the map.' }
];

const driverSteps = [
  { title: 'Register your bus', text: 'Add your NIC, driving licence, vehicle registration, bus photo, bank details, route, times and fares.' },
  { title: 'Get checked', text: 'An admin checks your documents. Your app updates the moment you are approved.' },
  { title: 'Accept students', text: 'Accept or turn down seat and daily ride requests, and keep your passenger list.' },
  { title: 'Run your route', text: 'Send attendance polls, post notices and share your live location while you drive.' }
];

const Steps = ({ steps }: { steps: { title: string; text: string }[] }) => (
  <div className="h-steps plain">
    {steps.map(step => (
      <div className="h-step" key={step.title}>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
      </div>
    ))}
  </div>
);

export default async function HowItWorksPage() {
  const t = await getT();
  const commissionPercent = await getCommissionPercent();
  const due = t('{n}th', { n: rules.fareDueDay });
  const translated = (steps: { title: string; text: string }[]) => steps.map(s => ({ title: t(s.title), text: t(s.text) }));

  return (
    <PublicShell>
      <section className="h-page-head">
        <div className="h-wrap">
          <span className="h-kicker">{t("How it works")}</span>
          <h1>{t("How UniShuttle works")}</h1>
          <p>
            {t("Students and drivers can use the UniShuttle app or this website. Here is what each of them can do, and how fares work.")}
          </p>
        </div>
        <RoadBand />
      </section>

      {/* ---------------- students ---------------- */}
      <section className="h-section" id="students">
        <div className="h-wrap">
          <div className="h-head">
            <span className="h-kicker">{t("For students")}</span>
            <h2>{t("Getting a seat and travelling")}</h2>
          </div>
          <Steps steps={translated(studentSteps)} />

          <div className="h-cards two" style={{ marginTop: 40 }}>
            <div className="h-card">
              <h3>{t("Daily rides")}</h3>
              <p>
                {t("Need the bus for just one day? Book a daily ride for a date: round trip, to university only, or from university only. You pay the driver's daily fare in cash when you travel.")}
              </p>
            </div>
            <div className="h-card">
              <h3>{t("Live tracking")}</h3>
              <p>
                {t("When the driver starts sharing their location, your map shows the bus moving. If you open the map later, you still see where it was last.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- fares ---------------- */}
      <section className="h-section tint" id="fares">
        <div className="h-wrap">
          <div className="h-head">
            <span className="h-kicker">{t("Fares and payments")}</span>
            <h2>{t('Monthly fares are due by the {day}', { day: due })}</h2>
            <p>
              {t("Each driver sets their own monthly and daily fares. Pay your driver in cash and they record it. Paying by card is coming soon.")}
            </p>
          </div>

          <div className="h-cards three">
            <div className="h-card">
              <span className="h-tag">{t('From the {day}', { day: t('{n}th', { n: rules.reminderFromDay }) })}</span>
              <h3>{t("Reminders")}</h3>
              <p>{t("If this month's fare is still unpaid, the app reminds you to pay before the {day}.", { day: due })}</p>
            </div>
            <div className="h-card">
              <span className="h-tag amber">{t('After the {day}', { day: due })}</span>
              <h3>{t("Account frozen")}</h3>
              <p>
                {t("An unpaid account is frozen: you can't ask for seats or answer polls. Hand the fare to your driver and it unfreezes as soon as they mark it paid.")}
              </p>
            </div>
            <div className="h-card">
              <span className="h-tag">{t("Joined late?")}</span>
              <h3>{t("Late in the month")}</h3>
              <p>
                {t("If your seat was approved after the {day}, you still owe that month's fare, but your account isn't frozen for it.", { day: due })}
              </p>
            </div>
          </div>

          <div className="h-note">
            <strong>{t("Not travelling this month?")}</strong> {t("Your driver can mark you as “not travelling”. Your account is then frozen for that month only and unfreezes by itself next month, or as soon as your driver marks the fare paid. An approved daily ride also unlocks your account for that day.")}
          </div>
        </div>
      </section>

      {/* ---------------- drivers ---------------- */}
      <section className="h-section" id="drivers">
        <div className="h-wrap">
          <div className="h-head">
            <span className="h-kicker">{t("For drivers")}</span>
            <h2>{t("Running your bus service")}</h2>
          </div>
          <Steps steps={translated(driverSteps)} />

          <div className="h-cards two" style={{ marginTop: 40 }}>
            <div className="h-card">
              <h3>{t("Fare tracker")}</h3>
              <ul className="h-ticks">
                <li>{t("See every passenger as paid, unpaid or not travelling, month by month")}</li>
                <li>{t("Mark cash payments yourself")}</li>
                <li>{t("Download a list of who is coming on each trip")}</li>
              </ul>
            </div>
            <div className="h-card">
              <span className="h-tag amber">{t("Coming soon")}</span>
              <h3>{t("Wallet and payouts")}</h3>
              <ul className="h-ticks">
                <li>{t("Card payments from students go into your wallet")}</li>
                <li>
                  {commissionPercent > 0
                    ? t('UniShuttle keeps {pct}% of fares', { pct: commissionPercent })
                    : t("You keep all of your fares")}
                </li>
                <li>{t("Ask for a payout. It is paid once an admin approves it")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- admin ---------------- */}
      <section className="h-section tint">
        <div className="h-wrap h-center">
          <div className="h-head" style={{ marginBottom: 28 }}>
            <span className="h-kicker">{t("Behind the scenes")}</span>
            <h2>{t("The UniShuttle team")}</h2>
            <p>
              {t("Our admins check every driver, look after student and driver accounts, keep an eye on fares and answer messages sent through this website.")}
            </p>
          </div>
          <div className="h-actions">
            <Link href="/signup" className="h-btn primary">{t("Create an account")}</Link>
            <Link href="/contact" className="h-btn plain">{t("Contact us")}</Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
