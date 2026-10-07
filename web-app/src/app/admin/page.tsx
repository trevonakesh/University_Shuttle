'use client';
import { useEffect, useState } from 'react';
import { API_BASE, authFetch } from '../../lib/api';
import PhotoField from '../../components/PhotoField';

type Driver = {
  id: number;
  fullName: string;
  nic: string;
  licenseNumber?: string;
  bankName?: string;
  accNumber?: string;
  accHolder?: string;
  busRegNumber: string;
  busCapacity?: string;
  routeName?: string;
  startingPoint?: string;
  destination?: string;
  monthlyFee?: string;
  scheduleType?: string;
  pickupTime?: string;
  dropTime?: string;
  profilePhotoUrl?: string;
  nicCopyUrl?: string;
  licenseCopyUrl?: string;
  vehicleRegUrl?: string;
  busPhotoUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: { email: string; phone: string };
};

const emptyForm = {
  fullName: '', email: '', phone: '', password: '', nic: '', licenseNumber: '',
  busRegNumber: '', busCapacity: '', routeName: '', startingPoint: '', destination: '', monthlyFee: '',
  profilePhotoUrl: '', nicCopyUrl: '', licenseCopyUrl: '', vehicleRegUrl: '', busPhotoUrl: ''
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDrivers = () => {
    authFetch('/api/admin/drivers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDrivers(data);
        } else {
          setError('Unexpected response from the server.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not reach the backend. Is the API server running?');
        setLoading(false);
      });
  };

  useEffect(loadDrivers, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await authFetch(`/api/admin/drivers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setDrivers(drivers.map(d => d.id === id ? { ...d, status: status as any } : d));
        if (selectedDriver?.id === id) {
          setSelectedDriver(null); // Close modal on action
        }
      } else {
        alert(`Failed to update driver status (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteDriver = async (driver: Driver) => {
    const sure = confirm(
      `Delete driver ${driver.fullName} (${driver.user?.email})?\n\nThis permanently removes their account, bus, passengers' assignments, payment history and fare records. This cannot be undone.`
    );
    if (!sure) return;
    try {
      const res = await authFetch(`/api/admin/drivers/${driver.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setDrivers(drivers.filter(d => d.id !== driver.id));
        if (selectedDriver?.id === driver.id) setSelectedDriver(null);
      } else {
        alert(data.message ?? 'Failed to delete driver.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/drivers', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setForm(emptyForm);
        loadDrivers();
      } else {
        setFormError(data.message ?? 'Failed to create driver.');
      }
    } catch {
      setFormError('Could not reach the backend.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof emptyForm, label: string, type = 'text', required = false) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
      {label}{required ? ' *' : ''}
      <input
        type={type}
        value={form[key]}
        required={required}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        style={{
          padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)',
          background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '14px'
        }}
      />
    </label>
  );

  if (loading) return <div>Loading drivers...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Driver Registrations</h1>
          <p className="subtitle">Manage and verify bus drivers on the platform.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setFormError(null); setShowAdd(true); }}>
          + Add Driver
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div className="glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Bus Reg</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.id}>
                <td>#{driver.id}</td>
                <td>{driver.fullName}</td>
                <td>
                  <div>{driver.user?.email}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{driver.user?.phone}</div>
                </td>
                <td>{driver.busRegNumber}</td>
                <td>
                  <span className={`badge ${driver.status.toLowerCase()}`}>
                    {driver.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => setSelectedDriver(driver)}>Review</button>
                    <button className="btn btn-danger" onClick={() => deleteDriver(driver)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No drivers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={overlayStyle}>
          <form onSubmit={submitAdd} className="glass-panel" style={{ width: '620px', maxHeight: '85vh', overflowY: 'auto', padding: '30px', backgroundColor: '#1e212b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Add Driver</h2>
              <button type="button" onClick={() => setShowAdd(false)} style={closeBtnStyle}>&times;</button>
            </div>
            <p className="subtitle" style={{ marginBottom: '20px' }}>
              Admin-created drivers are approved immediately and appear in student bus search.
            </p>

            {formError && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{formError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {field('fullName', 'Full Name', 'text', true)}
              {field('nic', 'NIC', 'text', true)}
              {field('email', 'Email', 'email', true)}
              {field('phone', 'Phone')}
              {field('password', 'Password', 'password', true)}
              {field('licenseNumber', 'License Number')}
              {field('busRegNumber', 'Bus Registration')}
              {field('busCapacity', 'Bus Capacity')}
              {field('routeName', 'Route Name')}
              {field('monthlyFee', 'Monthly Fee (LKR)')}
              {field('startingPoint', 'Starting Point')}
              {field('destination', 'Destination')}
            </div>

            <h3 style={{ margin: '20px 0 12px', fontSize: '15px', color: 'var(--text)' }}>Photos & Documents</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <PhotoField label="Profile Photo" value={form.profilePhotoUrl} onChange={url => setForm({ ...form, profilePhotoUrl: url })} />
              <PhotoField label="NIC Copy" value={form.nicCopyUrl} onChange={url => setForm({ ...form, nicCopyUrl: url })} />
              <PhotoField label="License Copy" value={form.licenseCopyUrl} onChange={url => setForm({ ...form, licenseCopyUrl: url })} />
              <PhotoField label="Vehicle Registration" value={form.vehicleRegUrl} onChange={url => setForm({ ...form, vehicleRegUrl: url })} />
              <PhotoField label="Bus Photo" value={form.busPhotoUrl} onChange={url => setForm({ ...form, busPhotoUrl: url })} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? 'Creating…' : 'Create Driver'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedDriver && (
        <div style={overlayStyle}>
          <div className="glass-panel" style={{ width: '650px', maxHeight: '85vh', overflowY: 'auto', padding: '30px', backgroundColor: '#1e212b', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Review Driver: {selectedDriver.fullName}</h2>
              <button onClick={() => setSelectedDriver(null)} style={closeBtnStyle}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><strong>NIC:</strong> {selectedDriver.nic || '-'}</div>
              <div><strong>License:</strong> {selectedDriver.licenseNumber || '-'}</div>
              <div><strong>Email:</strong> {selectedDriver.user?.email}</div>
              <div><strong>Phone:</strong> {selectedDriver.user?.phone}</div>
              <div><strong>Bus Reg:</strong> {selectedDriver.busRegNumber || '-'}</div>
              <div><strong>Capacity:</strong> {selectedDriver.busCapacity || '-'}</div>
              <div><strong>Route:</strong> {selectedDriver.routeName || '-'}</div>
              <div><strong>Monthly Fee:</strong> {selectedDriver.monthlyFee || '-'}</div>
              <div><strong>Start Point:</strong> {selectedDriver.startingPoint || '-'}</div>
              <div><strong>Destination:</strong> {selectedDriver.destination || '-'}</div>
              <div><strong>Schedule:</strong> {selectedDriver.scheduleType || '-'}</div>
              <div><strong>Time:</strong> {selectedDriver.pickupTime || '-'} to {selectedDriver.dropTime || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Bank Details:</strong> {selectedDriver.bankName ? `${selectedDriver.bankName} - ${selectedDriver.accNumber} (${selectedDriver.accHolder})` : '-'}
              </div>
            </div>

            <div style={{ marginTop: '25px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', color: 'var(--text)' }}>Submitted Documents</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {(['profilePhotoUrl', 'nicCopyUrl', 'licenseCopyUrl', 'vehicleRegUrl', 'busPhotoUrl'] as const).map(key => (
                  selectedDriver[key] && (
                    <div key={key}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                        {{ profilePhotoUrl: 'Profile Photo', nicCopyUrl: 'NIC Copy', licenseCopyUrl: 'License', vehicleRegUrl: 'Vehicle Reg', busPhotoUrl: 'Bus Photo' }[key]}
                      </div>
                      <a href={`${API_BASE}${selectedDriver[key]}`} target="_blank" rel="noreferrer">
                        <img src={`${API_BASE}${selectedDriver[key]}`} alt={key} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                      </a>
                    </div>
                  )
                ))}
                {!selectedDriver.profilePhotoUrl && !selectedDriver.nicCopyUrl && !selectedDriver.licenseCopyUrl && !selectedDriver.vehicleRegUrl && !selectedDriver.busPhotoUrl && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No documents submitted.</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
              <button className="btn btn-danger" onClick={() => deleteDriver(selectedDriver)}>Delete Driver</button>
              {selectedDriver.status === 'PENDING' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-danger" onClick={() => updateStatus(selectedDriver.id, 'REJECTED')}>Reject Driver</button>
                  <button className="btn btn-success" onClick={() => updateStatus(selectedDriver.id, 'APPROVED')}>Approve Driver</button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>
                  This driver is currently <strong>{selectedDriver.status}</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  backdropFilter: 'blur(5px)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)'
};
