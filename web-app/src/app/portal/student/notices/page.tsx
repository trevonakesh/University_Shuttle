'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalFetch } from '../../../../lib/portalApi';
import { useLang, useT } from '../../../../lib/useLang';
import { formatDate } from '../../../../lib/i18n';

interface Notice {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  driver?: {
    fullName: string;
    busRegNumber: string;
  };
}

interface Poll {
  id: number;
  date: string;
  question: string;
  option1: string;
  option2: string;
  createdAt: string;
  driver?: {
    fullName: string;
    busRegNumber: string;
  };
  responses: Array<{
    id: number;
    isComing: boolean;
  }>;
}

export default function StudentNoticesPage() {
  const t = useT();
  const lang = useLang();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [voteMsg, setVoteMsg] = useState<{ id: number; text: string; tone: 'green' | 'red'; frozen?: boolean } | null>(null);

  const loadData = () => {
    Promise.all([
      portalFetch('/api/notices/student').then(r => r.json()),
      portalFetch('/api/polls/student').then(r => r.json())
    ]).then(([noticeData, pollData]) => {
      setNotices(Array.isArray(noticeData?.notices) ? noticeData.notices : []);
      setPolls(Array.isArray(pollData?.polls) ? pollData.polls : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleVote = async (pollId: number, isComing: boolean) => {
    setVotingId(pollId);
    setVoteMsg(null);
    try {
      const res = await portalFetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ isComing })
      });
      const data = await res.json();
      if (!res.ok) {
        setVoteMsg({ id: pollId, text: data.error || 'Failed to submit vote', tone: 'red', frozen: data.code === 'ACCOUNT_FROZEN' });
      } else {
        setVoteMsg({ id: pollId, text: 'Vote submitted successfully!', tone: 'green' });
        loadData();
      }
    } catch {
      setVoteMsg({ id: pollId, text: 'Network error submitting vote.', tone: 'red' });
    } finally {
      setVotingId(null);
    }
  };

  if (loading) return <BrandLoader label={t("Loading notices & polls…")} />;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>{t("Notices & Attendance Polls")}</h1>
        <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>{t("Stay informed on driver announcements and answer attendance polls for your bus.")}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: '28px' }}>
        {/* Attendance Polls Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ display: 'inline-flex', padding: '6px', background: 'var(--blue-tint)', borderRadius: '8px', color: 'var(--blue-ink)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </span>
            <h2 style={{ fontSize: '18px', color: 'var(--ink)' }}>{t("Daily Attendance Polls")}</h2>
          </div>

          {polls.length === 0 ? (
            <div className="p-card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ink-faint)' }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>{t("No active polls")}</div>
              <p style={{ fontSize: '13px' }}>{t("Your driver hasn't posted any attendance polls yet.")}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {polls.map(poll => {
                const myVote = poll.responses && poll.responses.length > 0 ? poll.responses[0] : null;
                return (
                  <div key={poll.id} className="p-card" style={{ borderLeft: myVote ? '4px solid var(--green-ink)' : '4px solid var(--blue-ink)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="p-badge blue">{poll.date}</span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>
                        {poll.driver?.fullName ? `${poll.driver.fullName} (${poll.driver.busRegNumber})` : t("Driver")}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '8px 0 16px' }}>
                      {poll.question || t("Are you coming tomorrow?")}
                    </h3>

                    {voteMsg && voteMsg.id === poll.id && (
                      <div className={`p-alert ${voteMsg.tone}`} style={{ padding: '8px 12px', fontSize: '13px', marginBottom: '12px' }}>
                        {t(voteMsg.text)}
                        {voteMsg.frozen && (
                          <> <Link href="/portal/student/fare" style={{ fontWeight: 600, textDecoration: 'underline' }}>{t("View fare")}</Link></>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleVote(poll.id, true)}
                        disabled={votingId === poll.id}
                        className={`p-btn sm ${myVote?.isComing === true ? 'primary' : 'outline'}`}
                        style={{ flex: 1, minWidth: '120px' }}
                      >
                        ✓ {poll.option1 || t("Coming")} {myVote?.isComing === true && t("(Your Vote)")}
                      </button>
                      <button
                        onClick={() => handleVote(poll.id, false)}
                        disabled={votingId === poll.id}
                        className={`p-btn sm ${myVote?.isComing === false ? 'danger' : 'outline'}`}
                        style={{ flex: 1, minWidth: '120px' }}
                      >
                        ✕ {poll.option2 || t("Not Coming")} {myVote?.isComing === false && t("(Your Vote)")}
                      </button>
                    </div>

                    {myVote && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--green-ink)', fontWeight: 600 }}>
                        {t("● Recorded status:")} {myVote.isComing ? `${t('Traveling')} (${poll.option1 || t('Coming')})` : `${t('Not traveling')} (${poll.option2 || t('Not Coming')})`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notices Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ display: 'inline-flex', padding: '6px', background: 'var(--amber-tint)', borderRadius: '8px', color: 'var(--amber-ink)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            <h2 style={{ fontSize: '18px', color: 'var(--ink)' }}>{t("Driver Announcements")}</h2>
          </div>

          {notices.length === 0 ? (
            <div className="p-card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ink-faint)' }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>{t("No notices right now")}</div>
              <p style={{ fontSize: '13px' }}>{t("Driver updates, schedule modifications, or holiday announcements will appear here.")}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notices.map(notice => (
                <div key={notice.id} className="p-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{notice.title}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--ink-faint)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {formatDate(notice.createdAt, lang, 'day')}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: 1.6, whiteSpace: 'pre-line', marginTop: '8px' }}>
                    {notice.content}
                  </p>

                  {notice.driver && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)', fontSize: '12px', color: 'var(--ink-faint)' }}>
                      {t("Posted by")} <strong style={{ color: 'var(--ink)' }}>{notice.driver.fullName}</strong> {t("• Bus")} {notice.driver.busRegNumber}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
