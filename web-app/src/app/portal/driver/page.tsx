'use client';
import { BrandLoader } from '../../../components/Brand';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { portalFetch, getPortalUser } from '../../../lib/portalApi';
import { useT } from '../../../lib/useLang';

interface StudentInfo {
  name: string;
  pickupPoint: string | null;
  phone: string | null;
}

interface DriverPoll {
  id: number;
  date: string;
  question: string;
  option1: string;
  option2: string;
  createdAt: string;
  stats: {
    option1Count: number;
    option2Count: number;
  };
  option1Students: StudentInfo[];
  option2Students?: StudentInfo[];
}

export default function DriverDashboardPage() {
  const t = useT();
  const [fareData, setFareData] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [seatRequests, setSeatRequests] = useState<any[]>([]);
  const [dailyRides, setDailyRides] = useState<any[]>([]);
  const [polls, setPolls] = useState<DriverPoll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [pollTab, setPollTab] = useState<'COMING' | 'NOT_COMING'>('COMING');
  const [loading, setLoading] = useState(true);

  const user = getPortalUser();
  const profile = user?.profile || {};

  useEffect(() => {
    Promise.all([
      portalFetch('/api/fares/driver').then(r => r.json()).catch(() => null),
      portalFetch('/api/payments/wallet').then(r => r.json()).catch(() => null),
      portalFetch('/api/requests/driver').then(r => r.json()).catch(() => []),
      portalFetch('/api/daily-rides/driver').then(r => r.json()).catch(() => []),
      portalFetch('/api/polls/driver').then(r => r.json()).catch(() => ({ polls: [] })),
    ]).then(([fares, wal, requests, rides, pollRes]) => {
      setFareData(fares);
      setWallet(wal);
      setSeatRequests(Array.isArray(requests) ? requests : (requests?.requests ?? []));
      setDailyRides(Array.isArray(rides) ? rides : (rides?.dailyRides ?? []));

      const pollList: DriverPoll[] = pollRes?.polls || [];
      setPolls(pollList);

      // Pick today's or tomorrow's poll or latest poll
      if (pollList.length > 0) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

        const match = pollList.find(p => p.date === today) || pollList.find(p => p.date === tomorrow) || pollList[0];
        setSelectedPollId(match.id);
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activePoll = useMemo(() => {
    if (!polls || polls.length === 0) return null;
    return polls.find(p => p.id === selectedPollId) || polls[0];
  }, [polls, selectedPollId]);

  if (loading) return <BrandLoader label={t("Loading driver dashboard…")} />;

  const summary = fareData?.summary || { total: 0, paid: 0, unpaid: 0, exempt: 0, expected: 0, collected: 0 };
  const pendingSeats = seatRequests.filter(r => r.status === 'PENDING');
  const pendingRides = dailyRides.filter(r => r.status === 'PENDING');
  const collectionPct = summary.expected > 0 ? Math.round((summary.collected / summary.expected) * 100) : 0;

  // Poll metrics
  const comingCount = activePoll?.stats?.option1Count ?? 0;
  const notComingCount = activePoll?.stats?.option2Count ?? 0;
  const totalPollVotes = comingCount + notComingCount;
  const comingPct = totalPollVotes > 0 ? Math.round((comingCount / totalPollVotes) * 100) : 0;
  const notComingPct = totalPollVotes > 0 ? (100 - comingPct) : 0;

  const comingList = activePoll?.option1Students ?? [];
  const notComingList = activePoll?.option2Students ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>
            {t('Welcome back, {name}', { name: profile.fullName || t('Driver') })} 👋
          </h1>
          <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>
            {profile.busRegNumber ? `${t('Bus')}: ${profile.busRegNumber} • ` : ''}
            {profile.routeName ? `${t('Route')}: ${profile.routeName} • ` : ''}
            {t("Monthly Ledger:")} <strong>{fareData?.month || t("Current Month")}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/portal/driver/fares" className="p-btn primary sm">
            {t("Manage Fares →")}
          </Link>
          <Link href="/portal/driver/notices" className="p-btn outline sm">
            {t("+ Post Notice / Poll")}
          </Link>
        </div>
      </div>

      {/* Action alerts if there are pending items */}
      {(pendingSeats.length > 0 || pendingRides.length > 0) && (
        <div className="p-alert amber" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>{t("Action Required:")}</strong>{' '}
            {[
              pendingSeats.length > 0 && t(pendingSeats.length > 1 ? '{n} pending seat applications' : '{n} pending seat application', { n: pendingSeats.length }),
              pendingRides.length > 0 && t(pendingRides.length > 1 ? '{n} pending daily ride requests' : '{n} pending daily ride request', { n: pendingRides.length })
            ].filter(Boolean).join(' · ')}
          </div>
          <Link href="/portal/driver/requests" style={{ fontWeight: 700, textDecoration: 'underline' }}>
            {t("Review Requests →")}
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="p-stats">
        <div className="p-stat">
          <div className="p-stat-label">{t("Wallet Balance")}</div>
          <div className="p-stat-val green">
            {t("LKR")} {(wallet?.balance ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            <Link href="/portal/driver/wallet" style={{ color: 'var(--green-ink)', fontWeight: 600 }}>{t("Request Payout →")}</Link>
          </div>
        </div>

        <div className="p-stat">
          <div className="p-stat-label">{t("Assigned Students")}</div>
          <div className="p-stat-val blue">
            {summary.total}
            {profile.capacity && (
              <span style={{ fontSize: '15px', color: 'var(--ink-faint)', fontWeight: 500 }}> / {profile.capacity} {t("seats")}</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t('{paid} paid • {unpaid} unpaid', { paid: summary.paid, unpaid: summary.unpaid })}
          </div>
        </div>

        <div className="p-stat">
          <div className="p-stat-label">{t("Collection Rate")}</div>
          <div className={`p-stat-val ${collectionPct >= 80 ? 'green' : collectionPct >= 50 ? 'amber' : 'red'}`}>
            {collectionPct}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t('LKR {a} of {b}', { a: summary.collected.toLocaleString(), b: summary.expected.toLocaleString() })}
          </div>
        </div>

        <div className="p-stat">
          <div className="p-stat-label">{t("Pending Requests")}</div>
          <div className={`p-stat-val ${pendingSeats.length + pendingRides.length > 0 ? 'amber' : 'green'}`}>
            {pendingSeats.length + pendingRides.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t('{seats} seat • {daily} daily', { seats: pendingSeats.length, daily: pendingRides.length })}
          </div>
        </div>
      </div>

      {/* ── TODAY'S ATTENDANCE POLL & PICKUP LOCATIONS PANEL ── */}
      <div className="p-card" style={{ marginBottom: '28px', border: '1.5px solid var(--line-strong)', boxShadow: '0 4px 16px rgba(16,32,58,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--blue-tint)', color: 'var(--blue-ink)', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>{t("Daily Attendance Poll & Pickup Stops")}</h2>
                {activePoll && (
                  <span className="p-badge blue">
                    {t("Date:")} {activePoll.date}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-faint)', marginTop: '2px' }}>
                {activePoll ? activePoll.question : t("Live headcount and student pickup locations")}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {polls.length > 1 && (
              <select
                value={selectedPollId ?? ''}
                onChange={e => setSelectedPollId(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  background: 'var(--paper)',
                  color: 'var(--ink)'
                }}
              >
                {polls.map(p => (
                  <option key={p.id} value={p.id}>
                    {t('Poll: {date} ({n} coming)', { date: p.date, n: p.stats.option1Count })}
                  </option>
                ))}
              </select>
            )}
            <Link href="/portal/driver/notices" className="p-btn outline sm">
              {t("+ Manage Polls")}
            </Link>
          </div>
        </div>

        {!activePoll ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--paper-2)', borderRadius: '12px', border: '1px dashed var(--line-strong)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '42px', height: '42px', color: 'var(--ink-faint)', margin: '0 auto 10px' }}>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="m9 14 2 2 4-4"/>
            </svg>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>{t("No Active Attendance Poll")}</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-faint)', maxWidth: '420px', margin: '4px auto 16px' }}>
              {t("Create a poll for today or tomorrow so your passengers can confirm whether they will be traveling and you can see their exact pickup stops.")}
            </p>
            <Link href="/portal/driver/notices" className="p-btn primary sm">
              {t("+ Launch Attendance Poll")}
            </Link>
          </div>
        ) : (
          <div>
            {/* Visual Headcount Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--green-tint)', border: '1px solid var(--green-line)', borderRadius: '10px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green-ink)', textTransform: 'uppercase' }}>
                    ✓ {activePoll.option1 || t("Coming")}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green-ink)' }}>
                    {comingCount} <span style={{ fontSize: '12px', fontWeight: 600 }}>({comingPct}%)</span>
                  </span>
                </div>
                <div className="p-progress-track" style={{ marginTop: '8px', background: 'rgba(14,124,102,0.15)' }}>
                  <div className="p-progress-fill" style={{ width: `${comingPct}%`, background: 'var(--green-ink)' }} />
                </div>
              </div>

              <div style={{ background: 'var(--red-tint)', border: '1px solid var(--red-line)', borderRadius: '10px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red-ink)', textTransform: 'uppercase' }}>
                    ✕ {activePoll.option2 || t("Not Coming")}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--red-ink)' }}>
                    {notComingCount} <span style={{ fontSize: '12px', fontWeight: 600 }}>({notComingPct}%)</span>
                  </span>
                </div>
                <div className="p-progress-track" style={{ marginTop: '8px', background: 'rgba(220,38,38,0.15)' }}>
                  <div className="p-progress-fill" style={{ width: `${notComingPct}%`, background: 'var(--red-ink)' }} />
                </div>
              </div>

              <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: '10px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                    {t("Total Responses")}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                    {totalPollVotes} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-faint)' }}>/ {summary.total}</span>
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '6px' }}>
                  {summary.total - totalPollVotes > 0 ? t("{n} passenger(s) haven't answered yet", { n: summary.total - totalPollVotes }) : t("All assigned passengers answered")}
                </div>
              </div>
            </div>

            {/* Sub-tabs: Traveling (with pickups) vs Not Traveling */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <button
                onClick={() => setPollTab('COMING')}
                className={`p-btn sm ${pollTab === 'COMING' ? 'primary' : 'outline'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{t("✓ Traveling Passengers")}</span>
                <span style={{ background: pollTab === 'COMING' ? 'rgba(255,255,255,0.25)' : 'var(--line)', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
                  {comingList.length}
                </span>
              </button>
              <button
                onClick={() => setPollTab('NOT_COMING')}
                className={`p-btn sm ${pollTab === 'NOT_COMING' ? 'danger' : 'outline'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{t("✕ Not Traveling")}</span>
                <span style={{ background: pollTab === 'NOT_COMING' ? 'rgba(255,255,255,0.25)' : 'var(--line)', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
                  {notComingList.length}
                </span>
              </button>
            </div>

            {/* List of Students & Pickup Locations */}
            {pollTab === 'COMING' && (
              <div>
                {comingList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--ink-faint)', fontSize: '13px' }}>
                    {t("No students have confirmed attendance as \"Coming\" yet.")}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="p-table">
                      <thead>
                        <tr>
                          <th>{t("Passenger Name")}</th>
                          <th>{t("Pickup Location")}</th>
                          <th>{t("Phone Contact")}</th>
                          <th>{t("Attendance Status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comingList.map((st, idx) => (
                          <tr key={idx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green-tint)', color: 'var(--green-ink)', display: 'grid', placeItems: 'center', fontSize: '13px', fontWeight: 700 }}>
                                  {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{st.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="p-pickup-tag">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px' }}>
                                  <path d="M12 21s-6-5.6-6-10a6 6 0 1 1 12 0c0 4.4-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>
                                </svg>
                                {st.pickupPoint || t("Default route stop")}
                              </span>
                            </td>
                            <td style={{ fontSize: '13px' }}>
                              {st.phone ? (
                                <a href={`tel:${st.phone}`} style={{ color: 'var(--blue-ink)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '13px', height: '13px' }}>
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                  </svg>
                                  {st.phone}
                                </a>
                              ) : '—'}
                            </td>
                            <td>
                              <span className="p-badge green">{t("✓ Confirmed Travelling")}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {pollTab === 'NOT_COMING' && (
              <div>
                {notComingList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--ink-faint)', fontSize: '13px' }}>
                    {t("No students have reported as \"Not Coming\".")}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="p-table">
                      <thead>
                        <tr>
                          <th>{t("Passenger Name")}</th>
                          <th>{t("Registered Stop (Skip)")}</th>
                          <th>{t("Phone Contact")}</th>
                          <th>{t("Status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notComingList.map((st, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{st.name}</td>
                            <td>
                              <span style={{ color: 'var(--ink-faint)', textDecoration: 'line-through', fontSize: '13px' }}>
                                {st.pickupPoint || t("Default stop")}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--red-ink)', marginLeft: '6px' }}>
                                {t("(Do not wait)")}
                              </span>
                            </td>
                            <td style={{ fontSize: '13px' }}>
                              {st.phone ? (
                                <a href={`tel:${st.phone}`} style={{ color: 'var(--blue-ink)' }}>{st.phone}</a>
                              ) : '—'}
                            </td>
                            <td>
                              <span className="p-badge red">{t("✕ Not Traveling")}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LOWER SECTION: STUDENTS & DAILY RIDES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: '24px' }}>
        {/* Passenger Quick View */}
        <div className="p-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="p-card-title" style={{ margin: 0 }}>{t("This Month's Students")}</div>
            <Link href="/portal/driver/fares" className="p-btn outline sm">{t("Full Ledger →")}</Link>
          </div>

          {!fareData?.students || fareData.students.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: '14px' }}>{t("No students assigned to your bus yet.")}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>{t("Student")}</th>
                    <th>{t("Pickup")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {fareData.students.slice(0, 5).map((s: any) => (
                    <tr key={s.studentId}>
                      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.fullName}</td>
                      <td style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>{s.pickupPoint || '—'}</td>
                      <td>
                        <span className={`p-badge ${s.status === 'PAID' ? 'green' : s.status === 'EXEMPT' ? 'gray' : s.frozen ? 'red' : 'amber'}`}>
                          {t(s.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fareData.students.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px' }}>
                  <Link href="/portal/driver/fares">{t('+{n} more passengers →', { n: fareData.students.length - 5 })}</Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Daily Rides & Requests Snippet */}
        <div className="p-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="p-card-title" style={{ margin: 0 }}>{t("Recent Daily Rides")}</div>
            <Link href="/portal/driver/requests" className="p-btn outline sm">{t("View All →")}</Link>
          </div>

          {dailyRides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ink-faint)' }}>
              <p style={{ fontSize: '14px' }}>{t("No daily ride requests submitted.")}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dailyRides.slice(0, 4).map((ride: any) => (
                <div key={ride.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--paper-2)', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                      {ride.student?.fullName || `${t('Student')} #${ride.studentId}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>
                      {t("Date:")} {ride.date} {t("• Pickup:")} {ride.pickupPoint || t("Default")}
                    </div>
                  </div>
                  <div>
                    <span className={`p-badge ${ride.status === 'APPROVED' ? 'green' : ride.status === 'REJECTED' ? 'red' : 'amber'}`}>
                      {t(ride.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
