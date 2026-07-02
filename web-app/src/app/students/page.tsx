'use client';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/drivers')
      .then(res => res.json())
      .then(data => setDrivers(data.filter((d: any) => d.status === 'APPROVED')))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      setLoading(true);
      fetch(`http://localhost:3000/api/admin/drivers/${selectedDriver}/students`)
        .then(res => res.json())
        .then(data => {
          setStudents(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
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
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ marginRight: '16px', color: 'var(--text-muted)' }}>Select Driver:</label>
        <select 
          className="btn btn-outline" 
          onChange={(e) => setSelectedDriver(Number(e.target.value))}
          value={selectedDriver || ''}
        >
          <option value="">-- Choose a Driver --</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>{driver.fullName}</option>
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
