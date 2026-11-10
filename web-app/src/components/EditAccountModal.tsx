'use client';
import { useEffect, useState } from 'react';
import { API_BASE, authFetch } from '../lib/api';

type Field = { name: string; label: string; required?: boolean; type?: string; options?: string; placeholder?: string };
type Section = { title: string; fields: Field[] };
type Kind = 'driver' | 'student';
type CustomField = { key: string; label: string; type: string; options?: string[] };

const CONTACT: Field[] = [
  { name: 'email', label: 'Email', required: true, type: 'email' },
  { name: 'phone', label: 'Phone number', type: 'tel' }
];

const SECTIONS: Record<Kind, Section[]> = {
  driver: [
    { title: 'Personal', fields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'nic', label: 'NIC number', required: true },
      ...CONTACT,
      { name: 'licenseNumber', label: 'Driving licence number' }
    ] },
    { title: 'Bank details', fields: [
      { name: 'bankName', label: 'Bank', options: 'banks' },
      { name: 'accNumber', label: 'Account number' },
      { name: 'accHolder', label: 'Account holder name' }
    ] },
    { title: 'Bus and route', fields: [
      { name: 'busRegNumber', label: 'Bus registration number' },
      { name: 'busCapacity', label: 'Number of seats' },
      { name: 'routeName', label: 'Route name' },
      { name: 'startingPoint', label: 'Starting point' },
      { name: 'destination', label: 'Destination university', options: 'universities' },
      { name: 'scheduleType', label: 'Schedule', options: 'schedules' },
      { name: 'pickupTime', label: 'Pickup time', placeholder: '7:30 AM' },
      { name: 'dropTime', label: 'Drop time', placeholder: '5:00 PM' }
    ] },
    { title: 'Fares (LKR)', fields: [
      { name: 'monthlyFee', label: 'Monthly fare' },
      { name: 'dailyFeeRoundTrip', label: 'Daily fare, round trip' },
      { name: 'dailyFeeOneWay', label: 'Daily fare, one way' }
    ] }
  ],
  student: [
    { title: 'Personal', fields: [
      { name: 'fullName', label: 'Full name', required: true },
      { name: 'nic', label: 'NIC number' },
      { name: 'studentId', label: 'Student ID' },
      ...CONTACT
    ] },
    { title: 'University', fields: [
      { name: 'universityName', label: 'University', required: true, options: 'universities' },
      { name: 'faculty', label: 'Faculty', options: 'faculties' },
      { name: 'degreeProgram', label: 'Degree / program', options: 'degreePrograms' },
      { name: 'academicYear', label: 'Academic year', options: 'academicYears' },
      { name: 'registrationNo', label: 'Registration number' }
    ] },
    { title: 'Travel', fields: [
      { name: 'homeLocation', label: 'Home location' },
      { name: 'pickupPoint', label: 'Pickup point' },
      { name: 'destination', label: 'Destination university', options: 'universities' }
    ] },
    { title: 'Emergency contact', fields: [
      { name: 'emerContactName', label: 'Contact name' },
      { name: 'emerContactPhone', label: 'Contact phone', type: 'tel' },
      { name: 'emerRelationship', label: 'Relationship', options: 'relationships' }
    ] }
  ]
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)',
  background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '14px'
};

interface Props {
  kind: Kind;
  id: number;
  name: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function EditAccountModal({ kind, id, name, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      authFetch(`/api/admin/${kind}s/${id}`).then(async res => ({ ok: res.ok, data: await res.json() })),
      fetch(`${API_BASE}/api/settings/signup-form`).then(res => res.json())
    ]).then(([account, signupForm]) => {
      if (!account.ok) { setError(account.data.message ?? 'Could not load this account.'); return; }
      setOptions(signupForm.options);
      setHidden(signupForm[kind].hidden);
      setCustomFields(signupForm[kind].custom);
      const { customFields: saved, ...details } = account.data;
      setAnswers(saved ?? {});
      setForm(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, (v as string | null) ?? ''])));
    }).catch(() => setError('Could not reach the backend.'));
  }, [kind, id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch(`/api/admin/${kind}s/${id}`, { method: 'PATCH', body: JSON.stringify({ ...form, customFields: answers }) });
      const data = await res.json();
      if (res.ok) onSaved(data.message);
      else setError(data.message ?? 'Could not save the changes.');
    } catch {
      setError('Could not reach the backend.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: Field) => {
    if (!form) return null;
    const value = form[f.name] ?? '';
    const change = (next: string) => setForm({ ...form, [f.name]: next });
    // A value that has since been removed from the list stays selectable.
    const choices = f.options ? [...(options[f.options] ?? [])] : [];
    if (value && f.options && !choices.includes(value)) choices.unshift(value);

    return (
      <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
        {f.label}{f.required ? ' *' : ''}
        {f.options ? (
          <select value={value} required={f.required} onChange={e => change(e.target.value)} style={inputStyle}>
            <option value="" style={{ color: 'black' }}>{f.required ? 'Select' : 'Not set'}</option>
            {choices.map(o => <option key={o} value={o} style={{ color: 'black' }}>{o}</option>)}
          </select>
        ) : (
          <input type={f.type ?? 'text'} value={value} required={f.required} maxLength={200} placeholder={f.placeholder} onChange={e => change(e.target.value)} style={inputStyle} />
        )}
      </label>
    );
  };

  const renderCustomField = (f: CustomField) => {
    const value = answers[f.key] ?? '';
    const change = (next: string) => setAnswers({ ...answers, [f.key]: next });
    const choices = [...(f.options ?? [])];
    if (value && f.type === 'select' && !choices.includes(value)) choices.unshift(value);

    return (
      <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
        {f.label}
        {f.type === 'select' ? (
          <select value={value} onChange={e => change(e.target.value)} style={inputStyle}>
            <option value="" style={{ color: 'black' }}>Not set</option>
            {choices.map(o => <option key={o} value={o} style={{ color: 'black' }}>{o}</option>)}
          </select>
        ) : (
          <input type={f.type === 'phone' ? 'tel' : 'text'} value={value} maxLength={500} onChange={e => change(e.target.value)} style={inputStyle} />
        )}
      </label>
    );
  };

  // A field removed from the sign-up form still shows for people who filled it in.
  const shownFields = (section: Section) => section.fields.filter(f => !hidden.includes(f.name) || form?.[f.name]);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '16px' }}>
      <div className="glass-panel" role="dialog" aria-modal="true" aria-label={`Edit ${name}`} style={{ width: '680px', maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '30px', backgroundColor: '#1e212b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2>Edit {name}</h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>
        <p className="subtitle" style={{ marginBottom: '20px' }}>
          The {kind} is told by email and in the app which details changed. Email and phone are what they sign in with.
        </p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{error}</div>}

        {form ? (
          <form onSubmit={save}>
            {SECTIONS[kind].filter(section => shownFields(section).length > 0).map(section => (
              <div key={section.title} style={{ marginBottom: '22px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '15px', color: 'var(--text)' }}>{section.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
                  {shownFields(section).map(renderField)}
                </div>
              </div>
            ))}
            {customFields.length > 0 && (
              <div style={{ marginBottom: '22px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '15px', color: 'var(--text)' }}>Additional information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
                  {customFields.map(renderCustomField)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        ) : !error && <div>Loading…</div>}
      </div>
    </div>
  );
}
