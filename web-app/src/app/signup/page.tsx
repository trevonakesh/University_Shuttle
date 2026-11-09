'use client';
import { useState } from 'react';
import Link from 'next/link';
import PhotoField from '../../components/PhotoField';
import RouteNetwork from '../../components/RouteNetwork';
import { fontVariables } from '../../lib/fonts';
import { API_BASE, setPortalToken, setPortalUser } from '../../lib/portalApi';
import '../site.css';
import '../portal/portal.css';
import '../auth.css';

type Role = 'STUDENT' | 'DRIVER';
type Field = { name: string; label: string; type?: string; options?: string[] };
type Section = { title: string; fields: Field[]; photos?: Field[] };

// Same choices as the mobile app. Buses are matched to students by
// destination, so these lists have to stay in step with it.
const UNIVERSITIES = ['NSBM', 'SLIIT'];

const ACCOUNT: Field[] = [
  { name: 'fullName', label: 'Full name' },
  { name: 'nic', label: 'NIC number' },
  { name: 'phone', label: 'Phone number', type: 'tel' },
  { name: 'email', label: 'Email address', type: 'email' },
  { name: 'password', label: 'Password (at least 6 characters)', type: 'password' }
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
      { name: 'universityName', label: 'University', options: UNIVERSITIES },
      { name: 'faculty', label: 'Faculty', options: ['Science', 'Engineering', 'Arts'] },
      { name: 'degreeProgram', label: 'Degree / program', options: ['BSc', 'BEng', 'BA'] },
      { name: 'academicYear', label: 'Academic year', options: ['Year 1', 'Year 2', 'Year 3', 'Year 4'] },
      { name: 'registrationNo', label: 'Registration number' }
    ]
  },
  {
    title: 'Travel',
    fields: [
      { name: 'homeLocation', label: 'Home location' },
      { name: 'pickupPoint', label: 'Pickup point' },
      { name: 'destination', label: 'Destination university', options: UNIVERSITIES }
    ]
  },
  {
    title: 'Emergency Contact',
    fields: [
      { name: 'emerContactName', label: 'Contact name' },
      { name: 'emerContactPhone', label: 'Contact phone', type: 'tel' },
      { name: 'emerRelationship', label: 'Relationship', options: ['Parent', 'Sibling', 'Guardian'] }
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
      { name: 'bankName', label: 'Bank', options: ['BOC', 'Commercial', 'HNB', 'Sampath'] },
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
      { name: 'destination', label: 'Destination university', options: UNIVERSITIES },
      { name: 'scheduleType', label: 'Schedule', options: ['Weekly (Mon-Fri)', 'Weekend Only', 'Everyday'] },
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

  const set = (name: string, value: string) => setValues(v => ({ ...v, [name]: value }));
  const sections = role === 'STUDENT' ? STUDENT_FORM : DRIVER_FORM;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: Record<string, string> = { ...values };
    for (const key of ['pickupTime', 'dropTime']) {
      if (payload[key]) payload[key] = toDisplayTime(payload[key]);
    }

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
    <button type="button" className={`p-btn ${role === value ? 'primary' : 'outline'}`} style={{ flex: 1 }} onClick={() => switchRole(value)}>
      {label}
    </button>
  );

  return (
    <div className={`portal auth ${fontVariables}`}>
      <RouteNetwork />
      <div className="auth-inner" style={{ maxWidth: '740px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Uni Shuttle for students and bus drivers</p>
        </div>

        <div className="auth-card">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {tab('STUDENT', "I'm a Student")}
            {tab('DRIVER', "I'm a Driver")}
          </div>

          {role === 'DRIVER' && (
            <div className="p-alert blue" style={{ marginBottom: '20px' }}>
              An administrator reviews every driver application before the bus goes live.
            </div>
          )}
          {error && <div className="p-alert red" style={{ marginBottom: '20px' }}>{error}</div>}

          <form onSubmit={submit}>
            {sections.map(section => (
              <div key={section.title} style={{ marginBottom: '24px' }}>
                <div className="p-card-title">{section.title}</div>
                <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  {section.fields.map(f => (
                    <div className="p-field" key={f.name}>
                      <label htmlFor={f.name}>{f.label}</label>
                      {f.options ? (
                        <select id={f.name} value={values[f.name] ?? ''} onChange={e => set(f.name, e.target.value)} required>
                          <option value="">Select</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          id={f.name}
                          type={f.type ?? 'text'}
                          min={f.type === 'number' ? 0 : undefined}
                          minLength={f.name === 'password' ? 6 : undefined}
                          value={values[f.name] ?? ''}
                          onChange={e => set(f.name, e.target.value)}
                          autoComplete={f.name === 'password' ? 'new-password' : undefined}
                          required
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

            <button type="submit" className="p-btn primary" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: '15px' }}>
              {loading ? 'Creating your account…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-foot">
            Already have an account? <Link href="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
