'use client';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';

type Driver = { id: number; fullName: string };
type Student = {
  id: number;
  fullName: string;
  studentId: string;
  pickupPoint: string;
  user: { email: string; phone: string };
};

export default function StudentsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/drivers`)
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDrivers(data.filter((d: any) => d.status === 'APPROVED'));
        } else {
          console.error('Expected array of drivers, got:', data);
          setError('Unexpected response from the server.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Could not reach the backend. Is the API server running?');
      });
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      setLoading(true);
      fetch(`${API_BASE}/api/admin/drivers/${selectedDriver}/students`)
        .then(res => {
          if (!res.ok) throw new Error(`Server responded with ${res.status}`);
          return res.json();
        })
        .then(data => {
          setStudents(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load students for this driver.');
          setStudents([]);
          setLoading(false);
        });
    } else {
      setStudents([]);
    }
  }, [selectedDriver]);

  return (
    <div>
      <h1>Student Management</h1>
      <p className="subtitle">View students assigned to specific drivers.</p>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger, #e5484d)' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <label style={{ marginRight: '16px', color: 'var(--text-muted)' }}>Select Driver:</label>
        <select 
          className="btn btn-outline" 
          onChange={(e) => setSelectedDriver(Number(e.target.value))}
          value={selectedDriver || ''}
        >
          <option value="" style={{ color: 'black' }}>-- Choose a Driver --</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id} style={{ color: 'black' }}>{driver.fullName}</option>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : students.length > 0 ? (
              students.map(student => (
                <tr key={student.id}>
                  <td>#{student.id}</td>
                  <td>{student.fullName}</td>
                  <td>{student.studentId}</td>
                  <td>
                    <div>{student.user?.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{student.user?.phone}</div>
                  </td>
                  <td>{student.pickupPoint}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  {selectedDriver ? 'No students found for this driver.' : 'Please select a driver to view students.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
