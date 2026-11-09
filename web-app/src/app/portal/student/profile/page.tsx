'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { portalFetch, getPortalUser, clearPortalToken } from '../../../../lib/portalApi';

export default function StudentProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [fare, setFare] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalFetch('/api/auth/me').then(r => r.json()),
      portalFetch('/api/fares/me').then(r => r.json())
    ]).then(([userData, fareData]) => {
      if (userData?.user) {
        setUser(userData.user);
      } else {
        setUser(getPortalUser());
      }
      setFare(fareData);
      setLoading(false);
    }).catch(() => {
      setUser(getPortalUser());
      setLoading(false);
    });
  }, []);

  const logout = () => {
    clearPortalToken();
    window.location.href = '/login';
  };

  if (loading) return <BrandLoader label="Loading profile…" />;

  const profile = user?.profile || {};

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: '#10203a' }}>My Profile & Settings</h1>
        <p style={{ color: '#7a8699', marginTop: '6px' }}>Manage your university shuttle account and assigned route.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Personal Details */}
        <div className="p-card">
          <div className="p-card-title">Student Information</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e6f4f0', color: '#0e7c66', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10203a' }}>{profile.fullName || 'Student'}</div>
              <div style={{ fontSize: '13px', color: '#7a8699' }}>{user?.email}</div>
              <span className="p-badge green" style={{ marginTop: '6px' }}>Student Member</span>
            </div>
          </div>

          <div className="p-info-grid">
            <div className="p-info-item">
              <span>Full Name</span>
              <span>{profile.fullName || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>Email</span>
              <span>{user?.email || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>Phone</span>
              <span>{user?.phone || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>Pickup Point</span>
              <span>{profile.pickupPoint || 'Not specified'}</span>
            </div>
          </div>

          <hr className="p-divider" />
          <div style={{ fontSize: '13px', color: '#7a8699' }}>
            Need to change your pickup point or registered phone number? Please contact your bus driver or our support team.
          </div>
        </div>

        {/* Assigned Shuttle Info */}
        <div className="p-card">
          <div className="p-card-title">Assigned Bus & Driver</div>
          {fare?.assigned ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '22px', height: '22px' }}>
                    <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10203a' }}>{fare.driverName}</div>
                  <div style={{ fontSize: '13px', color: '#7a8699' }}>Driver & Bus Operator</div>
                </div>
              </div>

              <div className="p-info-grid">
                <div className="p-info-item">
                  <span>Monthly Fare</span>
                  <span style={{ color: '#0e7c66', fontWeight: 700 }}>LKR {fare.amountDue?.toLocaleString()}</span>
                </div>
                <div className="p-info-item">
                  <span>Current Month</span>
                  <span>{fare.month}</span>
                </div>
                <div className="p-info-item">
                  <span>Payment Status</span>
                  <span>
                    <span className={`p-badge ${fare.status === 'PAID' ? 'green' : fare.frozen ? 'red' : 'amber'}`}>
                      {fare.status === 'PAID' ? 'PAID' : fare.frozen ? 'FROZEN' : 'UNPAID'}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <a href="/portal/student/fare" className="p-btn outline sm">Manage Fare & Receipts →</a>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#7a8699' }}>
              <p style={{ fontSize: '14px', marginBottom: '12px' }}>You have not been assigned to a shuttle bus yet.</p>
              <div style={{ fontSize: '13px' }}>Open Find a Bus to browse verified buses and send a seat request to your driver.</div>
            </div>
          )}
        </div>

        {/* Security & Password */}
        <div className="p-card">
          <div className="p-card-title">Security & Password</div>
          <p style={{ fontSize: '14px', color: '#40506b', marginBottom: '16px' }}>
            To reset or change your account password, you can use our secure verification code system.
          </p>
          <a href="/portal/forgot-password" className="p-btn outline sm">
            Reset Password with Code →
          </a>
        </div>

        {/* Session */}
        <div className="p-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="p-card-title">Sign Out</div>
            <p style={{ fontSize: '14px', color: '#7a8699' }}>
              Signing out will end your current web session. You will need to sign in again to access your student portal.
            </p>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={logout} className="p-btn danger sm">
              Sign Out of Student Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
