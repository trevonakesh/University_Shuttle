'use client';
import { useEffect, useState } from 'react';

type Driver = {
  id: number;
  fullName: string;
  busRegNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: { email: string; phone: string };
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/drivers')
      .then(res => res.json())
      .then(data => {
        setDrivers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/drivers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setDrivers(drivers.map(d => d.id === id ? { ...d, status: status as any } : d));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading drivers...</div>;

  return (
    <div>
      <h1>Driver Registrations</h1>
      <p className="subtitle">Manage and verify bus drivers on the platform.</p>
      
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
                  {driver.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-success" onClick={() => updateStatus(driver.id, 'APPROVED')}>Approve</button>
                      <button className="btn btn-danger" onClick={() => updateStatus(driver.id, 'REJECTED')}>Reject</button>
                    </div>
                  )}
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
    </div>
  );
}
