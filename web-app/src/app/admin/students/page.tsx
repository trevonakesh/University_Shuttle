'use client';
import { useEffect, useState } from 'react';
import { authFetch } from '../../../lib/api';
import PhotoField from '../../../components/PhotoField';

type Driver = { id: number; fullName: string; status: string };
type Student = {
  id: number;
  fullName: string;
  studentId: string | null;
  universityName?: string;
  pickupPoint: string | null;
  user: { email: string; phone: string };
  assignedDriver?: { fullName: string; busRegNumber: string } | null;
};

const emptyForm = {
  fullName: '', email: '', phone: '', password: '', nic: '', studentId: '',
  universityName: '', pickupPoint: '', destination: '', profilePhotoUrl: ''
};

export default function StudentsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | 0>(0); // 0 = all students
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/admin/drivers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDrivers(data.filter((d: any) => d.status === 'APPROVED'));
        }
      })
      .catch(err => {
        console.error(err);
        setError('Could not reach the backend. Is the API server running?');
      });
  }, []);

  const loadStudents = () => {
    setLoading(true);
    const path = selectedDriver === 0
      ? '/api/admin/students'
      : `/api/admin/drivers/${selectedDriver}/students`;
    authFetch(path)
      .then(res => res.json())
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load students.');
        setStudents([]);
        setLoading(false);
      });
  };

  useEffect(loadStudents, [selectedDriver]);

  const deleteStudent = async (student: Student) => {
    const sure = confirm(
      `Remove student ${student.fullName} (${student.user?.email})?\n\nThey will no longer be able to sign in and their seat is cancelled. Payments and fare records are kept for your accounts.`
    );
    if (!sure) return;
    try {
      const res = await authFetch(`/api/admin/students/${student.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setStudents(students.filter(s => s.id !== student.id));
        if (data.archived) alert(data.message);
      } else {
        alert(data.message ?? 'Failed to delete student.');
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
      const res = await authFetch('/api/admin/students', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setForm(emptyForm);
        loadStudents();
      } else {
        setFormError(data.message ?? 'Failed to create student.');
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Student Management</h1>
          <p className="subtitle">All students on the platform, or filtered by driver.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setFormError(null); setShowAdd(true); }}>
          + Add Student
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <label style={{ marginRight: '16px', color: 'var(--text-muted)' }}>Show:</label>
        <select
          className="btn btn-outline"
          onChange={(e) => setSelectedDriver(Number(e.target.value))}
          value={selectedDriver}
        >
          <option value={0} style={{ color: 'black' }}>All Students</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id} style={{ color: 'black' }}>Bus of {driver.fullName}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Student ID</th>
              <th>Contact</th>
              <th>Pickup Point</th>
              <th>Assigned Bus</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : students.length > 0 ? (
              students.map(student => (
                <tr key={student.id}>
                  <td>#{student.id}</td>
                  <td>{student.fullName}</td>
                  <td>{student.studentId || '-'}</td>
                  <td>
                    <div>{student.user?.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{student.user?.phone}</div>
                  </td>
                  <td>{student.pickupPoint || '-'}</td>
                  <td>
                    {student.assignedDriver
                      ? `${student.assignedDriver.fullName} (${student.assignedDriver.busRegNumber ?? '-'})`
                      : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => deleteStudent(student)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>
                  {selectedDriver !== 0 ? 'No students assigned to this driver.' : 'No students found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <form onSubmit={submitAdd} className="glass-panel" style={{ width: '620px', maxHeight: '85vh', overflowY: 'auto', padding: '30px', backgroundColor: '#1e212b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Add Student</h2>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>

            {formError && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{formError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {field('fullName', 'Full Name', 'text', true)}
              {field('universityName', 'University', 'text', true)}
              {field('email', 'Email', 'email', true)}
              {field('phone', 'Phone')}
              {field('password', 'Password', 'password', true)}
              {field('studentId', 'Student ID')}
              {field('nic', 'NIC')}
              {field('pickupPoint', 'Pickup Point')}
              {field('destination', 'Destination')}
              <PhotoField label="Profile Photo" value={form.profilePhotoUrl} onChange={url => setForm({ ...form, profilePhotoUrl: url })} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? 'Creating…' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
