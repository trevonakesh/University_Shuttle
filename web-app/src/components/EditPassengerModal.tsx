'use client';
import { useEffect, useState } from 'react';
import { BrandLoader } from './Brand';
import { portalFetch } from '../lib/portalApi';

const FIELDS = [
  { name: 'pickupPoint', label: 'Pickup point', required: true },
  { name: 'homeLocation', label: 'Home location', required: false },
  { name: 'emerContactName', label: 'Emergency contact name', required: false },
  { name: 'emerContactPhone', label: 'Emergency contact phone', required: false },
  { name: 'emerRelationship', label: 'Relationship to student', required: false }
] as const;

type Form = Record<(typeof FIELDS)[number]['name'], string>;

interface Props {
  studentId: number;
  studentName: string;
  onClose: () => void;
  onSaved: (pickupPoint: string, message: string) => void;
}

export default function EditPassengerModal({ studentId, studentName, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalFetch(`/api/requests/passengers/${studentId}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Could not load this student.'); return; }
        setForm(Object.fromEntries(FIELDS.map(f => [f.name, data.student[f.name] ?? ''])) as Form);
      })
      .catch(() => setError('Could not connect to the server.'));
  }, [studentId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const res = await portalFetch(`/api/requests/passengers/${studentId}`, { method: 'PATCH', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not save the changes.'); return; }
      onSaved(data.student.pickupPoint ?? '', data.message);
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(16,32,58,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="edit-passenger-title" className="p-card" style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
        <h3 id="edit-passenger-title" style={{ fontSize: '18px', color: '#10203a', margin: 0 }}>Edit student details</h3>
        <p style={{ fontSize: '13px', color: '#7a8699', margin: '4px 0 16px' }}>
          {studentName}. The student will be told about any change you save.
        </p>

        {error && <div className="p-alert red" style={{ marginBottom: '14px' }}>{error}</div>}

        {form ? (
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FIELDS.map(f => (
              <div className="p-field" key={f.name}>
                <label htmlFor={`edit-${f.name}`}>{f.label}</label>
                <input
                  id={`edit-${f.name}`}
                  type={f.name === 'emerContactPhone' ? 'tel' : 'text'}
                  required={f.required}
                  maxLength={200}
                  value={form[f.name]}
                  onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="button" onClick={onClose} className="p-btn outline sm">Cancel</button>
              <button type="submit" disabled={saving} className="p-btn primary sm">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        ) : error ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="p-btn outline sm">Close</button>
          </div>
        ) : (
          <BrandLoader label="Loading student…" />
        )}
      </div>
    </div>
  );
}
