'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PhotoField from '../../components/PhotoField';
import PublicShell from '../../components/PublicShell';
import { RoadBand } from '../../components/HomeArt';
import { API_BASE, setPortalToken, setPortalUser } from '../../lib/portalApi';
import { PASSWORD_HINT, passwordInputProps } from '../../lib/password';
import '../portal/portal.css';

type Role = 'STUDENT' | 'DRIVER';
// `options` names a list served by /api/settings/signup-form, which admins
// edit in the admin panel. `choices` and `optional` are for admin-added fields.
type Field = { name: string; label: string; type?: string; options?: string; choices?: string[]; optional?: boolean };
type Section = { title: string; fields: Field[]; photos?: Field[] };
type CustomField = { key: string; label: string; type: 'text' | 'number' | 'phone' | 'select'; required: boolean; options?: string[] };
type FormLayout = { hidden: string[]; custom: CustomField[] };
type SignupForm = { options: Record<string, string[]>; student: FormLayout; driver: FormLayout };

const ACCOUNT: Field[] = [
  { name: 'fullName', label: 'Full name' },
  { name: 'nic', label: 'NIC number' },
  { name: 'phone', label: 'Phone number', type: 'tel' },
  { name: 'email', label: 'Email address', type: 'email' },
  { name: 'password', label: `Password (${PASSWORD_HINT.toLowerCase()})`, type: 'password' }
];

const STUDENT_FORM: Section[] = [
  {
    title: 'Your Details',
    fields: [ACCOUNT[0], ACCOUNT[1], { name: 'studentId', label: 'Student ID' }, ...ACCOUNT.slice(2)],
    photos: [{ name: 'profilePhotoUrl', label: 'Profile photo (optional)' }]
  },
  {
    title: 'University',
    fields: [
      { name: 'universityName', label: 'University', options: 'universities' },
      { name: 'faculty', label: 'Faculty', options: 'faculties' },
      { name: 'degreeProgram', label: 'Degree / program', options: 'degreePrograms' },
      { name: 'academicYear', label: 'Academic year', options: 'academicYears' },
      { name: 'registrationNo', label: 'Registration number' }
    ]
  },
  {
    title: 'Travel',
    fields: [
      { name: 'homeLocation', label: 'Home location' },
      { name: 'pickupPoint', label: 'Pickup point' },
      { name: 'destination', label: 'Destination university', options: 'universities' }
    ]
  },
  {
    title: 'Emergency Contact',
    fields: [
      { name: 'emerContactName', label: 'Contact name' },
      { name: 'emerContactPhone', label: 'Contact phone', type: 'tel' },
      { name: 'emerRelationship', label: 'Relationship', options: 'relationships' }
    ]
  }
];

const DRIVER_FORM: Section[] = [
  {
    title: 'Your Details',
    fields: [...ACCOUNT, { name: 'licenseNumber', label: 'Driving licence number' }],
    photos: [{ name: 'profilePhotoUrl', label: 'Profile photo (optional)' }]
  },
  {
    title: 'Bank Details',
    fields: [
      { name: 'bankName', label: 'Bank', options: 'banks' },
      { name: 'accNumber', label: 'Account number' },
      { name: 'accHolder', label: 'Account holder name' }
    ]
  },
  {
    title: 'Bus & Route',
    fields: [
      { name: 'busRegNumber', label: 'Bus registration number' },
      { name: 'busCapacity', label: 'Number of seats', type: 'number' },
      { name: 'routeName', label: 'Route name' },
      { name: 'startingPoint', label: 'Starting point' },
      { name: 'destination', label: 'Destination university', options: 'universities' },
      { name: 'scheduleType', label: 'Schedule', options: 'schedules' },
      { name: 'pickupTime', label: 'Pickup time', type: 'time' },
      { name: 'dropTime', label: 'Drop time', type: 'time' }
    ]
  },
  {
    title: 'Fares (LKR)',
    fields: [
      { name: 'monthlyFee', label: 'Monthly fare', type: 'number' },
      { name: 'dailyFeeRoundTrip', label: 'Daily fare, round trip', type: 'number' },
      { name: 'dailyFeeOneWay', label: 'Daily fare, one way', type: 'number' }
    ]
  },
  {
    title: 'Documents (optional)',
    fields: [],
    photos: [
      { name: 'nicCopyUrl', label: 'NIC copy' },
      { name: 'licenseCopyUrl', label: 'Driving licence copy' },
      { name: 'vehicleRegUrl', label: 'Vehicle registration copy' },
      { name: 'busPhotoUrl', label: 'Bus photo' }
    ]
  }
];

// The app stores times as "7:30 AM"; <input type="time"> gives "07:30".
const toDisplayTime = (value: string): string => {
  const [h, m] = value.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export default function SignupPage() {
  const [role, setRole] = useState<Role>('STUDENT');
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SignupForm | null>(null);

  // The home page's "I'm a driver" button links to /signup?role=driver.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('role') === 'driver') setRole('DRIVER');
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/signup-form`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setForm)
      .catch(() => setError('Could not load the sign-up form. Please refresh the page.'));
  }, []);

  const set = (name: string, value: string) => setValues(v => ({ ...v, [name]: value }));

  const layout = form?.[role === 'STUDENT' ? 'student' : 'driver'];
  const shown = (f: Field) => !layout?.hidden.includes(f.name);
  const customFields = layout?.custom ?? [];
  const sections: Section[] = (role === 'STUDENT' ? STUDENT_FORM : DRIVER_FORM)
    .map(s => ({ ...s, fields: s.fields.filter(shown), photos: s.photos?.filter(shown) }))
    .filter(s => s.fields.length > 0 || (s.photos?.length ?? 0) > 0);
  if (customFields.length > 0) {
    sections.push({
      title: 'Additional Information',
      fields: customFields.map(f => ({
        name: f.key,
        label: f.label,
        type: f.type === 'phone' ? 'tel' : f.type === 'number' ? 'number' : 'text',
        choices: f.type === 'select' ? f.options ?? [] : undefined,
        optional: !f.required
      }))
    });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: Record<string, unknown> = {};
    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (customFields.some(f => f.key === key)) answers[key] = value;
      else payload[key] = (key === 'pickupTime' || key === 'dropTime') && value ? toDisplayTime(value) : value;
    }
    payload.customFields = answers;

    try {
      const res = await fetch(`${API_BASE}/api/auth/register/${role.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not create your account.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setPortalToken(data.token);
      setPortalUser({ ...data.user, profile: data.user.profile ?? data.user.student });
      window.location.href = role === 'STUDENT' ? '/portal/student/buses' : '/portal/driver';
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (next: Role) => {
    setRole(next);
    setValues({});
    setError(null);
  };

  const tab = (value: Role, label: string) => (
    <button type="button" className={`p-btn ${role === value ? 'primary' : 'outline'}`} aria-pressed={role === value} onClick={() => switchRole(value)}>
      {label}
    </button>
  );

  return (
    <PublicShell footer={false}>
     <section className="h-auth">
      <div className="h-auth-inner wide">
        <div className="h-auth-head">
          <h1>Create your account</h1>
          <p>Free for students and bus drivers. It takes a few minutes.</p>
        </div>

        <div className="h-auth-card">
          <div className="h-tabs">
            {tab('STUDENT', "I'm a student")}
            {tab('DRIVER', "I'm a driver")}
          </div>

          {role === 'DRIVER' && (
            <div className="p-alert blue" style={{ marginBottom: '20px' }}>
              Our team checks every driver before the bus appears to students.
            </div>
          )}
          {error && <div className="p-alert red" role="alert" style={{ marginBottom: '20px' }}>{error}</div>}

          {!form ? (!error && <div className="h-loading">Loading the form…</div>) : <form onSubmit={submit}>
            {sections.map(section => (
              <div key={section.title} style={{ marginBottom: '24px' }}>
                <div className="p-card-title">{section.title}</div>
                <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  {section.fields.map(f => (
                    <div className="p-field" key={f.name}>
                      <label htmlFor={f.name}>{f.label}</label>
                      {f.options || f.choices ? (
                        <select id={f.name} value={values[f.name] ?? ''} onChange={e => set(f.name, e.target.value)} required={!f.optional}>
                          <option value="">Select</option>
                          {(f.choices ?? form.options[f.options!] ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          id={f.name}
                          type={f.type ?? 'text'}
                          min={f.type === 'number' ? 0 : undefined}
                          {...(f.name === 'password' ? passwordInputProps : {})}
                          value={values[f.name] ?? ''}
                          onChange={e => set(f.name, e.target.value)}
                          autoComplete={f.name === 'password' ? 'new-password' : undefined}
                          required={!f.optional}
                        />
                      )}
                    </div>
                  ))}
                  {section.photos?.map(p => (
                    <PhotoField key={p.name} label={p.label} value={values[p.name] ?? ''} onChange={url => set(p.name, url)} />
                  ))}
                </div>
              </div>
            ))}

            <button type="submit" className="p-btn primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating your account…' : 'Create account'}
            </button>
          </form>}

          <div className="h-auth-foot">
            Already have an account? <Link href="/login" className="h-link">Sign in</Link>
          </div>
        </div>
      </div>
      <RoadBand />
     </section>
    </PublicShell>
  );
}
