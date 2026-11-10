'use client';
import { useEffect, useState } from 'react';
import { API_BASE, authFetch } from '../../../lib/api';

const LISTS = [
  { key: 'universities', title: 'Universities', hint: 'Students and drivers pick from this list. Buses are matched to students by university.' },
  { key: 'faculties', title: 'Faculties', hint: 'Student sign-up' },
  { key: 'degreePrograms', title: 'Degrees / Programs', hint: 'Student sign-up' },
  { key: 'academicYears', title: 'Academic Years', hint: 'Student sign-up' },
  { key: 'relationships', title: 'Emergency Contact Relationships', hint: 'Student sign-up' },
  { key: 'banks', title: 'Banks', hint: 'Driver sign-up' },
  { key: 'schedules', title: 'Bus Schedules', hint: 'Driver sign-up' }
];

type Options = Record<string, string[]>;
type Notice = { ok: boolean; text: string } | null;

export default function SignupOptionsPage() {
  const [options, setOptions] = useState<Options | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyList, setBusyList] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/signup-options`)
      .then(res => res.json())
      .then(setOptions)
      .catch(() => setNotice({ ok: false, text: 'Could not reach the backend.' }));
  }, []);

  const saveList = async (key: string, items: string[], text: string): Promise<boolean> => {
    setBusyList(key);
    setNotice(null);
    try {
      const res = await authFetch('/api/admin/settings/signup-options', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: items })
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ ok: false, text: data.message ?? 'Could not save the change.' });
        return false;
      }
      setOptions(data.options);
      setNotice({ ok: true, text });
      return true;
    } catch {
      setNotice({ ok: false, text: 'Could not reach the backend.' });
      return false;
    } finally {
      setBusyList(null);
    }
  };

  const add = async (e: React.FormEvent, key: string) => {
    e.preventDefault();
    const value = (drafts[key] ?? '').trim();
    if (!value || !options) return;
    if (await saveList(key, [...options[key], value], `Added ${value}.`)) {
      setDrafts(d => ({ ...d, [key]: '' }));
    }
  };

  const remove = (key: string, value: string) => {
    if (!options) return;
    if (!confirm(`Remove ${value} from the sign-up form?\n\nPeople who already chose it keep it on their account. It just stops being offered to new sign-ups.`)) return;
    void saveList(key, options[key].filter(item => item !== value), `Removed ${value}.`);
  };

  if (!options) return <div>{notice?.text ?? 'Loading…'}</div>;

  return (
    <div>
      <h1>Sign-up Form</h1>
      <p className="subtitle">Choose what appears in the dropdowns when students and drivers sign up, on the website and in the app.</p>

      {notice && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: notice.ok ? 'var(--success)' : 'var(--danger)' }}>
          {notice.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {LISTS.map(list => (
          <section key={list.key} className="glass-panel">
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{list.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>{list.hint}</p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px' }}>
              {options[list.key].map(item => (
                <li key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ overflowWrap: 'anywhere' }}>{item}</span>
                  <button className="btn btn-danger" disabled={busyList === list.key || options[list.key].length === 1} onClick={() => remove(list.key, item)} aria-label={`Remove ${item}`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={e => add(e, list.key)} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={drafts[list.key] ?? ''}
                onChange={e => setDrafts(d => ({ ...d, [list.key]: e.target.value }))}
                maxLength={80}
                placeholder="Add new…"
                aria-label={`Add to ${list.title}`}
                style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '14px' }}
              />
              <button type="submit" className="btn btn-primary" disabled={busyList === list.key || !(drafts[list.key] ?? '').trim()}>Add</button>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
