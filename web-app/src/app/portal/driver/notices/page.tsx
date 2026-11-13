'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { portalFetch } from '../../../../lib/portalApi';
import { useLang, useT } from '../../../../lib/useLang';
import { formatDate } from '../../../../lib/i18n';

interface PollItem {
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
  option1Students: Array<{
    name: string;
    pickupPoint: string | null;
    phone: string | null;
  }>;
}

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function DriverNoticesPage() {
  const t = useT();
  const lang = useLang();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Notice form
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // New Poll form
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollDate, setPollDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [pollQuestion, setPollQuestion] = useState(() => t('Are you coming tomorrow?'));
  const [pollOpt1, setPollOpt1] = useState('COMING');
  const [pollOpt2, setPollOpt2] = useState('NOT COMING');
  const [submittingPoll, setSubmittingPoll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadData = () => {
    Promise.all([
      portalFetch('/api/notices/driver').then(r => r.json()).catch(() => ({ notices: [] })),
      portalFetch('/api/polls/driver').then(r => r.json()).catch(() => ({ polls: [] }))
    ]).then(([noticeRes, pollRes]) => {
      setNotices(noticeRes?.notices || []);
      setPolls(pollRes?.polls || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadData, []);

  // Post Notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNotice(true);
    setMsg(null);
    try {
      const res = await portalFetch('/api/notices', {
        method: 'POST',
        body: JSON.stringify({ title: noticeTitle, content: noticeContent })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: t(data.error || 'Failed to post notice') });
      } else {
        setMsg({ ok: true, text: t('Notice published to all assigned passengers!') });
        setNoticeTitle('');
        setNoticeContent('');
        setShowNoticeForm(false);
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: t('Could not connect to the server.') });
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id: number) => {
    if (!confirm(t('Are you sure you want to delete this notice?'))) return;
    try {
      const res = await portalFetch(`/api/notices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ ok: true, text: t('Notice deleted.') });
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: t('Failed to delete notice.') });
    }
  };

  // Create Poll
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPoll(true);
    setMsg(null);
    try {
      const res = await portalFetch('/api/polls', {
        method: 'POST',
        body: JSON.stringify({
          date: pollDate,
          question: pollQuestion,
          option1: pollOpt1,
          option2: pollOpt2
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: t(data.error || 'Failed to create poll') });
      } else {
        setMsg({ ok: true, text: t('Attendance poll created successfully!') });
        setShowPollForm(false);
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: t('Could not connect to the server.') });
    } finally {
      setSubmittingPoll(false);
    }
  };

  const handleDownloadList = async (poll: PollItem) => {
    setDownloadingId(poll.id);
    setMsg(null);
    try {
      const res = await portalFetch(`/api/polls/${poll.id}/passengers/pdf`);
      if (!res.ok) {
        setMsg({ ok: false, text: t('Could not create the passenger list. Please try again.') });
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `passenger-list-${poll.id}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMsg({ ok: false, text: t('Could not connect to the server.') });
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete Poll
  const handleDeletePoll = async (id: number) => {
    if (!confirm(t('Are you sure you want to delete this poll?'))) return;
    try {
      const res = await portalFetch(`/api/polls/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ ok: true, text: t('Poll deleted.') });
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: t('Failed to delete poll.') });
    }
  };

  if (loading) return <BrandLoader label={t("Loading notices & polls…")} />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>{t("Notices & Attendance Polls")}</h1>
          <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t("Broadcast announcements and launch attendance polls to know who will travel.")}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setShowNoticeForm(v => !v); setShowPollForm(false); }} className="p-btn primary sm">
            {showNoticeForm ? t("Close Form") : t("+ New Announcement")}
          </button>
          <button onClick={() => { setShowPollForm(v => !v); setShowNoticeForm(false); }} className="p-btn blue sm">
            {showPollForm ? t("Close Form") : t("+ Create Poll")}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-alert ${msg.ok ? 'green' : 'red'}`}>
          {msg.text}
        </div>
      )}

      {/* Notice Form */}
      {showNoticeForm && (
        <div className="p-card" style={{ border: '2px solid var(--green-ink)', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--ink)', marginBottom: '14px' }}>{t("Post Passenger Announcement")}</h3>
          <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="p-field">
              <label htmlFor="n-title">{t("Title / Headline")}</label>
              <input
                id="n-title"
                type="text"
                required
                placeholder={t("e.g. Schedule Change for Monday Morning")}
                value={noticeTitle}
                onChange={e => setNoticeTitle(e.target.value)}
              />
            </div>
            <div className="p-field">
              <label htmlFor="n-content">{t("Announcement Content")}</label>
              <textarea
                id="n-content"
                rows={4}
                required
                placeholder={t("Write your announcement details here…")}
                value={noticeContent}
                onChange={e => setNoticeContent(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowNoticeForm(false)} className="p-btn outline sm">{t("Cancel")}</button>
              <button type="submit" disabled={submittingNotice} className="p-btn primary sm">
                {submittingNotice ? t("Publishing…") : t("Publish Announcement")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Poll Form */}
      {showPollForm && (
        <div className="p-card" style={{ border: '2px solid var(--blue-ink)', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--ink)', marginBottom: '14px' }}>{t("Launch Attendance Poll")}</h3>
          <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="p-field">
                <label htmlFor="p-date">{t("Travel Date")}</label>
                <input
                  id="p-date"
                  type="date"
                  required
                  value={pollDate}
                  onChange={e => setPollDate(e.target.value)}
                />
              </div>
              <div className="p-field">
                <label htmlFor="p-question">{t("Poll Question")}</label>
                <input
                  id="p-question"
                  type="text"
                  required
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="p-field">
                <label htmlFor="p-opt1">{t("Option 1 (Coming)")}</label>
                <input
                  id="p-opt1"
                  type="text"
                  required
                  value={pollOpt1}
                  onChange={e => setPollOpt1(e.target.value)}
                />
              </div>
              <div className="p-field">
                <label htmlFor="p-opt2">{t("Option 2 (Not Coming)")}</label>
                <input
                  id="p-opt2"
                  type="text"
                  required
                  value={pollOpt2}
                  onChange={e => setPollOpt2(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPollForm(false)} className="p-btn outline sm">{t("Cancel")}</button>
              <button type="submit" disabled={submittingPoll} className="p-btn blue sm">
                {submittingPoll ? t("Launching…") : t("Launch Poll")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: '24px' }}>
        {/* Attendance Polls Section */}
        <div>
          <h2 style={{ fontSize: '18px', color: 'var(--ink)', marginBottom: '16px' }}>{t("Attendance Polls")}</h2>
          {polls.length === 0 ? (
            <div className="p-card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ink-faint)' }}>
              <p style={{ fontSize: '14px' }}>{t("No polls created yet. Click \"+ Create Poll\" to ask your passengers about their upcoming attendance.")}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {polls.map(p => (
                <div key={p.id} className="p-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="p-badge blue">{t("Date:")} {p.date}</span>
                    <button
                      onClick={() => handleDeletePoll(p.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--red-ink)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {t("Delete")}
                    </button>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', margin: '4px 0 14px' }}>
                    {p.question}
                  </h3>

                  {/* Vote Counts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--green-tint)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--green-line)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--green-ink)', fontWeight: 700 }}>✓ {p.option1}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green-ink)' }}>{p.stats.option1Count}</div>
                    </div>
                    <div style={{ background: 'var(--red-tint)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--red-line)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--red-ink)', fontWeight: 700 }}>✕ {p.option2}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red-ink)' }}>{p.stats.option2Count}</div>
                    </div>
                  </div>

                  {/* List of coming students */}
                  {p.option1Students.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '8px' }}>
                        {t('Passengers Traveling ({n}):', { n: p.option1Students.length })}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                        {p.option1Students.map((st, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px dashed var(--line)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{st.name}</span>
                            <span style={{ color: 'var(--ink-soft)' }}>{st.pickupPoint || t("Default stop")}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDownloadList(p)}
                        disabled={downloadingId === p.id}
                        className="p-btn outline sm"
                        style={{ marginTop: '12px', width: '100%' }}
                      >
                        {downloadingId === p.id ? t("Preparing PDF…") : t("Download Passenger List (PDF)")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices Section */}
        <div>
          <h2 style={{ fontSize: '18px', color: 'var(--ink)', marginBottom: '16px' }}>{t("Published Announcements")}</h2>
          {notices.length === 0 ? (
            <div className="p-card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--ink-faint)' }}>
              <p style={{ fontSize: '14px' }}>{t("No notices posted yet. Use announcements to update passengers about stops, holidays, or traffic.")}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notices.map(n => (
                <div key={n.id} className="p-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{n.title}</h3>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--red-ink)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {t("Delete")}
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {n.content}
                  </p>
                  <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--ink-faint)' }}>
                    {t("Posted on")} {formatDate(n.createdAt, lang, 'dayTime')}
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
