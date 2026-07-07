'use client';
import { useEffect, useState } from 'react';

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

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/drivers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDrivers(data);
        } else {
          console.error('Expected array of drivers, got:', data);
          setDrivers([]);
        }
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
        if (selectedDriver?.id === id) {
          setSelectedDriver(null); // Close modal on action
        }
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
                  <button className="btn btn-primary" onClick={() => setSelectedDriver(driver)}>Review</button>
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

      {selectedDriver && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel" style={{ width: '650px', maxHeight: '85vh', overflowY: 'auto', padding: '30px', backgroundColor: '#1e212b', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Review Driver: {selectedDriver.fullName}</h2>
              <button onClick={() => setSelectedDriver(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
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
                {selectedDriver.profilePhotoUrl && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Profile Photo</div>
                    <a href={`http://localhost:3000${selectedDriver.profilePhotoUrl}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost:3000${selectedDriver.profilePhotoUrl}`} alt="Profile" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                    </a>
                  </div>
                )}
                {selectedDriver.nicCopyUrl && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>NIC Copy</div>
                    <a href={`http://localhost:3000${selectedDriver.nicCopyUrl}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost:3000${selectedDriver.nicCopyUrl}`} alt="NIC" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                    </a>
                  </div>
                )}
                {selectedDriver.licenseCopyUrl && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>License</div>
                    <a href={`http://localhost:3000${selectedDriver.licenseCopyUrl}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost:3000${selectedDriver.licenseCopyUrl}`} alt="License" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                    </a>
                  </div>
                )}
                {selectedDriver.vehicleRegUrl && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Vehicle Reg</div>
                    <a href={`http://localhost:3000${selectedDriver.vehicleRegUrl}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost:3000${selectedDriver.vehicleRegUrl}`} alt="Vehicle Reg" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                    </a>
                  </div>
                )}
                {selectedDriver.busPhotoUrl && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Bus Photo</div>
                    <a href={`http://localhost:3000${selectedDriver.busPhotoUrl}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost:3000${selectedDriver.busPhotoUrl}`} alt="Bus Photo" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                    </a>
                  </div>
                )}
                {!selectedDriver.profilePhotoUrl && !selectedDriver.nicCopyUrl && !selectedDriver.licenseCopyUrl && !selectedDriver.vehicleRegUrl && !selectedDriver.busPhotoUrl && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No documents submitted.</div>
                )}
              </div>
            </div>

            {selectedDriver.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                <button className="btn btn-danger" onClick={() => updateStatus(selectedDriver.id, 'REJECTED')}>Reject Driver</button>
                <button className="btn btn-success" onClick={() => updateStatus(selectedDriver.id, 'APPROVED')}>Approve Driver</button>
              </div>
            )}
            {selectedDriver.status !== 'PENDING' && (
              <div style={{ marginTop: '30px', textAlign: 'right', color: 'var(--text-muted)' }}>
                This driver is currently <strong>{selectedDriver.status}</strong>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
