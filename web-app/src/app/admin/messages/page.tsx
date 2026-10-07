'use client';
import { useEffect, useState } from 'react';
import { authFetch } from '../../../lib/api';

type Message = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Message | null>(null);

  const load = () => {
    authFetch('/api/admin/messages')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
        else setError('Unexpected response from the server.');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not reach the backend. Is the API server running?');
        setLoading(false);
      });
  };

  useEffect(load, []);

  const openMessage = async (m: Message) => {
    setOpen(m);
    if (!m.isRead) {
      try {
        await authFetch(`/api/admin/messages/${m.id}/read`, { method: 'PATCH', body: JSON.stringify({ isRead: true }) });
        setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, isRead: true } : x)));
      } catch { /* non-critical */ }
    }
  };

  const remove = async (m: Message) => {
    if (!confirm(`Delete the enquiry from ${m.name}? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(x => x.id !== m.id));
        setOpen(null);
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div>Loading enquiries...</div>;

  const unread = messages.filter(m => !m.isRead).length;

  return (
    <div>
      <h1>Website Enquiries</h1>
      <p className="subtitle">
        Messages submitted through the contact form on the public website.
        {unread > 0 && <strong style={{ color: 'var(--primary)' }}> {unread} unread.</strong>}
      </p>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger)' }}>{error}</div>
      )}

      <div className="glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>From</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(m => (
              <tr key={m.id} style={{ fontWeight: m.isRead ? 400 : 600 }}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(m.createdAt).toLocaleString()}</td>
                <td>
                  <div>{m.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{m.email}</div>
                </td>
                <td>{m.subject}</td>
                <td>
                  <span className={`badge ${m.isRead ? 'approved' : 'pending'}`}>
                    {m.isRead ? 'Read' : 'New'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => openMessage(m)}>Read</button>
                    <button className="btn btn-danger" onClick={() => remove(m)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>No enquiries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel" style={{ width: '620px', maxHeight: '85vh', overflowY: 'auto', padding: '30px', backgroundColor: '#1e212b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2>{open.subject}</h2>
              <button onClick={() => setOpen(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div><strong>From:</strong> {open.name}</div>
              <div><strong>Received:</strong> {new Date(open.createdAt).toLocaleString()}</div>
              <div><strong>Email:</strong> <a href={`mailto:${open.email}`} style={{ color: 'var(--primary)' }}>{open.email}</a></div>
              <div><strong>Phone:</strong> {open.phone || '—'}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '18px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {open.message}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '26px', justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={() => remove(open)}>Delete</button>
              <a className="btn btn-primary" href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`}>
                Reply by email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
