'use client';
import { useEffect, useState } from 'react';
import { authFetch } from '../../../lib/api';

type Kind = 'student' | 'driver';
type FieldType = 'text' | 'number' | 'phone' | 'select';
type BuiltIn = { name: string; label: string; locked?: boolean };
type CustomField = { key: string; label: string; type: FieldType; required: boolean; options?: string[] };
type Layout = { hidden: string[]; custom: CustomField[] };
type Config = { options: Record<string, string[]>; student: Layout; driver: Layout; fields: Record<Kind, BuiltIn[]> };
type Notice = { ok: boolean; text: string } | null;

// `field` is the sign-up field that uses the list, so a removed field's list
// can be left out of the way. Universities are used by locked fields.
const LISTS: Array<{ key: string; title: string; hint: string; field?: { kind: Kind; name: string } }> = [
  { key: 'universities', title: 'Universities', hint: 'Students and drivers pick from this list. Buses are matched to students by university.' },
  { key: 'faculties', title: 'Faculties', hint: 'Student sign-up', field: { kind: 'student', name: 'faculty' } },
  { key: 'degreePrograms', title: 'Degrees / Programs', hint: 'Student sign-up', field: { kind: 'student', name: 'degreeProgram' } },
  { key: 'academicYears', title: 'Academic Years', hint: 'Student sign-up', field: { kind: 'student', name: 'academicYear' } },
  { key: 'relationships', title: 'Emergency Contact Relationships', hint: 'Student sign-up', field: { kind: 'student', name: 'emerRelationship' } },
  { key: 'banks', title: 'Banks', hint: 'Driver sign-up', field: { kind: 'driver', name: 'bankName' } },
  { key: 'schedules', title: 'Bus Schedules', hint: 'Driver sign-up', field: { kind: 'driver', name: 'scheduleType' } }
];

const TYPE_LABELS: Record<FieldType, string> = { text: 'Text', number: 'Number', phone: 'Phone number', select: 'Dropdown' };

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)',
  background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '14px'
};
const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
  padding: '8px 0', borderBottom: '1px solid var(--surface-border)'
};
const muted: React.CSSProperties = { fontSize: '13px', color: 'var(--text-muted)' };

const emptyDraft = { label: '', type: 'text' as FieldType, required: false, choices: '' };

export default function SignupOptionsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [kind, setKind] = useState<Kind>('student');
  const [draft, setDraft] = useState(emptyDraft);
  const [listDrafts, setListDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    authFetch('/api/admin/settings/signup-form')
      .then(res => res.json())
      .then(setConfig)
      .catch(() => setNotice({ ok: false, text: 'Could not reach the backend.' }));
  }, []);

  const send = async (path: string, body: object): Promise<any | null> => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await authFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ ok: false, text: data.message ?? 'Could not save the change.' });
        return null;
      }
      return data;
    } catch {
      setNotice({ ok: false, text: 'Could not reach the backend.' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveLayout = async (change: Partial<Layout>, text: string): Promise<boolean> => {
    const data = await send('/api/admin/settings/signup-form', { kind, ...change });
    if (!data) return false;
    setConfig(c => c && { ...c, [kind]: data.form });
    setNotice({ ok: true, text });
    return true;
  };

  const saveList = async (key: string, items: string[], text: string): Promise<boolean> => {
    const data = await send('/api/admin/settings/signup-options', { [key]: items });
    if (!data) return false;
    setConfig(c => c && { ...c, options: data.options });
    setNotice({ ok: true, text });
    return true;
  };

  if (!config) return <div>{notice?.text ?? 'Loading…'}</div>;

  const layout = config[kind];
  const formName = kind === 'student' ? 'student' : 'driver';

  const removeField = (field: BuiltIn) => {
    if (!confirm(`Remove ${field.label} from the ${formName} sign-up form?\n\nPeople who already filled it in keep their answer. You can add it back at any time.`)) return;
    void saveLayout({ hidden: [...layout.hidden, field.name] }, `Removed ${field.label} from the form.`);
  };
  const restoreField = (field: BuiltIn) =>
    void saveLayout({ hidden: layout.hidden.filter(name => name !== field.name) }, `${field.label} is back on the form.`);

  const addCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = draft.label.trim();
    if (!label) return;
    const next = {
      label,
      type: draft.type,
      required: draft.required,
      ...(draft.type === 'select' ? { options: draft.choices.split('\n').map(c => c.trim()).filter(Boolean) } : {})
    };
    if (await saveLayout({ custom: [...layout.custom, next as CustomField] }, `Added ${label} to the form.`)) setDraft(emptyDraft);
  };

  const removeCustomField = (field: CustomField) => {
    if (!confirm(`Remove ${field.label} from the ${formName} sign-up form?\n\nAnswers already given are kept but no longer shown. Adding a field with the same name brings them back.`)) return;
    void saveLayout({ custom: layout.custom.filter(f => f.key !== field.key) }, `Removed ${field.label} from the form.`);
  };

  const addOption = async (e: React.FormEvent, key: string) => {
    e.preventDefault();
    const value = (listDrafts[key] ?? '').trim();
    if (value && await saveList(key, [...config.options[key], value], `Added ${value}.`)) {
      setListDrafts(d => ({ ...d, [key]: '' }));
    }
  };
  const removeOption = (key: string, value: string) => {
    if (!confirm(`Remove ${value} from the sign-up form?\n\nPeople who already chose it keep it on their account. It just stops being offered to new sign-ups.`)) return;
    void saveList(key, config.options[key].filter(item => item !== value), `Removed ${value}.`);
  };

  const visibleLists = LISTS.filter(l => !l.field || !config[l.field.kind].hidden.includes(l.field.name));

  return (
    <div>
      <h1>Sign-up Form</h1>
      <p className="subtitle">Choose the fields and dropdown choices students and drivers see when they sign up, on the website and in the app.</p>

      {notice && (
        <div className="glass-panel" role="status" style={{ marginBottom: '20px', color: notice.ok ? 'var(--success)' : 'var(--danger)' }}>
          {notice.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['student', 'driver'] as const).map(k => (
          <button key={k} className={`btn ${kind === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setKind(k); setDraft(emptyDraft); }}>
            {k === 'student' ? 'Student Form' : 'Driver Form'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <section className="glass-panel">
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Fields on the form</h3>
          <p style={{ ...muted, marginBottom: '14px' }}>Required fields are the ones sign-in, bus matching or fares depend on.</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {config.fields[kind].map(field => {
              const removed = layout.hidden.includes(field.name);
              return (
                <li key={field.name} style={rowStyle}>
                  <span style={removed ? { color: 'var(--text-muted)', textDecoration: 'line-through' } : undefined}>{field.label}</span>
                  {field.locked ? (
                    <span style={muted}>Required</span>
                  ) : removed ? (
                    <button className="btn btn-outline" disabled={busy} onClick={() => restoreField(field)} aria-label={`Add ${field.label} back`}>Add back</button>
                  ) : (
                    <button className="btn btn-danger" disabled={busy} onClick={() => removeField(field)} aria-label={`Remove ${field.label}`}>Remove</button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="glass-panel">
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Your added fields</h3>
          <p style={{ ...muted, marginBottom: '14px' }}>These appear under Additional Information at the end of the form.</p>

          {layout.custom.length === 0 ? (
            <p style={{ ...muted, marginBottom: '14px' }}>No added fields yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px' }}>
              {layout.custom.map(field => (
                <li key={field.key} style={rowStyle}>
                  <span style={{ overflowWrap: 'anywhere' }}>
                    {field.label}
                    <span style={{ ...muted, display: 'block' }}>
                      {TYPE_LABELS[field.type]}, {field.required ? 'required' : 'optional'}
                      {field.options ? `: ${field.options.join(', ')}` : ''}
                    </span>
                  </span>
                  <button className="btn btn-danger" disabled={busy} onClick={() => removeCustomField(field)} aria-label={`Remove ${field.label}`}>Remove</button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addCustomField} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} maxLength={60} placeholder="Field name, for example Blood group" aria-label="New field name" style={inputStyle} />
            <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as FieldType })} aria-label="New field type" style={inputStyle}>
              {(Object.keys(TYPE_LABELS) as FieldType[]).map(t => <option key={t} value={t} style={{ color: 'black' }}>{TYPE_LABELS[t]}</option>)}
            </select>
            {draft.type === 'select' && (
              <textarea value={draft.choices} onChange={e => setDraft({ ...draft, choices: e.target.value })} rows={4} placeholder={'One choice per line\nA+\nB+'} aria-label="Dropdown choices" style={inputStyle} />
            )}
            <label style={{ ...muted, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={draft.required} onChange={e => setDraft({ ...draft, required: e.target.checked })} />
              People must fill this in to sign up
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy || !draft.label.trim()}>Add Field</button>
          </form>
        </section>
      </div>

      <h2 style={{ marginBottom: '14px' }}>Dropdown choices</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {visibleLists.map(list => (
          <section key={list.key} className="glass-panel">
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{list.title}</h3>
            <p style={{ ...muted, marginBottom: '14px' }}>{list.hint}</p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px' }}>
              {config.options[list.key].map(item => (
                <li key={item} style={rowStyle}>
                  <span style={{ overflowWrap: 'anywhere' }}>{item}</span>
                  <button className="btn btn-danger" disabled={busy || config.options[list.key].length === 1} onClick={() => removeOption(list.key, item)} aria-label={`Remove ${item}`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={e => addOption(e, list.key)} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={listDrafts[list.key] ?? ''}
                onChange={e => setListDrafts(d => ({ ...d, [list.key]: e.target.value }))}
                maxLength={80}
                placeholder="Add new…"
                aria-label={`Add to ${list.title}`}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !(listDrafts[list.key] ?? '').trim()}>Add</button>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
