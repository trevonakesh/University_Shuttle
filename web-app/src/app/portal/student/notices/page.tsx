'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalFetch } from '../../../../lib/portalApi';

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

  if (loading) return <div style={{ color: '#7a8699', padding: '40px 0' }}>Loading notices & polls…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: '#10203a' }}>Notices & Attendance Polls</h1>
        <p style={{ color: '#7a8699', marginTop: '6px' }}>Stay informed on driver announcements and answer attendance polls for your bus.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
        {/* Attendance Polls Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ display: 'inline-flex', padding: '6px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </span>
            <h2 style={{ fontSize: '18px', color: '#10203a' }}>Daily Attendance Polls</h2>
          </div>

          {polls.length === 0 ? (
            <div className="p-card" style={{ textAlign: 'center', padding: '36px 20px', color: '#7a8699' }}>
              <div style={{ fontWeight: 600, color: '#10203a', marginBottom: '4px' }}>No active polls</div>
              <p style={{ fontSize: '13px' }}>Your driver hasn&apos;t posted any attendance polls yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {polls.map(poll => {
                const myVote = poll.responses && poll.responses.length > 0 ? poll.responses[0] : null;
                return (
                  <div key={poll.id} className="p-card" style={{ borderLeft: myVote ? '4px solid #0e7c66' : '4px solid #2563eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="p-badge blue">{poll.date}</span>
                      <span style={{ fontSize: '12px', color: '#7a8699' }}>
                        {poll.driver?.fullName ? `${poll.driver.fullName} (${poll.driver.busRegNumber})` : 'Driver'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#10203a', margin: '8px 0 16px' }}>
                      {poll.question || 'Are you coming tomorrow?'}
                    </h3>

                    {voteMsg && voteMsg.id === poll.id && (
                      <div className={`p-alert ${voteMsg.tone}`} style={{ padding: '8px 12px', fontSize: '13px', marginBottom: '12px' }}>
                        {voteMsg.text}
                        {voteMsg.frozen && (
                          <> <Link href="/portal/student/fare" style={{ fontWeight: 600, textDecoration: 'underline' }}>Pay now</Link></>
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
                        ✓ {poll.option1 || 'Coming'} {myVote?.isComing === true && '(Your Vote)'}
                      </button>
                      <button
                        onClick={() => handleVote(poll.id, false)}
                        disabled={votingId === poll.id}
                        className={`p-btn sm ${myVote?.isComing === false ? 'danger' : 'outline'}`}
                        style={{ flex: 1, minWidth: '120px' }}
                      >
                        ✕ {poll.option2 || 'Not Coming'} {myVote?.isComing === false && '(Your Vote)'}
                      </button>
                    </div>

                    {myVote && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#0e7c66', fontWeight: 600 }}>
                        ● Recorded status: {myVote.isComing ? `Traveling (${poll.option1 || 'Coming'})` : `Not traveling (${poll.option2 || 'Not Coming'})`}
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
            <span style={{ display: 'inline-flex', padding: '6px', background: '#fef3c7', borderRadius: '8px', color: '#d97706' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            <h2 style={{ fontSize: '18px', color: '#10203a' }}>Driver Announcements</h2>
          </div>

          {notices.length === 0 ? (
            <div className="p-card" style={{ textAlign: 'center', padding: '36px 20px', color: '#7a8699' }}>
              <div style={{ fontWeight: 600, color: '#10203a', marginBottom: '4px' }}>No notices right now</div>
              <p style={{ fontSize: '13px' }}>Driver updates, schedule modifications, or holiday announcements will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notices.map(notice => (
                <div key={notice.id} className="p-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#10203a' }}>{notice.title}</h3>
                    <span style={{ fontSize: '12px', color: '#7a8699', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: '#40506b', lineHeight: 1.6, whiteSpace: 'pre-line', marginTop: '8px' }}>
                    {notice.content}
                  </p>

                  {notice.driver && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #edf2f7', fontSize: '12px', color: '#7a8699' }}>
                      Posted by <strong style={{ color: '#10203a' }}>{notice.driver.fullName}</strong> • Bus {notice.driver.busRegNumber}
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
