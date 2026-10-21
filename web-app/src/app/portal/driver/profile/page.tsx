'use client';
import { useEffect, useState } from 'react';
import { portalFetch, getPortalUser, clearPortalToken } from '../../../../lib/portalApi';

export default function DriverProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(getPortalUser());
        }
        setLoading(false);
      })
      .catch(() => {
        setUser(getPortalUser());
        setLoading(false);
      });
  }, []);

  const logout = () => {
    clearPortalToken();
    window.location.href = '/portal/login';
  };

  if (loading) return <div style={{ color: '#7a8699', padding: '40px 0' }}>Loading profile…</div>;

  const profile = user?.profile || {};

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: '#10203a' }}>Bus & Driver Profile</h1>
        <p style={{ color: '#7a8699', marginTop: '6px' }}>
          Registered vehicle details, assigned route, and operator account settings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Driver Operator Information */}
        <div className="p-card">
          <div className="p-card-title">Driver Operator Details</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fdf3e6', color: '#e8912f', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'D'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10203a' }}>{profile.fullName || 'Driver Operator'}</div>
              <div style={{ fontSize: '13px', color: '#7a8699' }}>{user?.email}</div>
              <span className="p-badge amber" style={{ marginTop: '6px' }}>Registered Driver</span>
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
              <span>Account Status</span>
              <span>
                <span className={`p-badge ${profile.status === 'ACTIVE' ? 'green' : profile.status === 'REJECTED' ? 'red' : 'amber'}`}>
                  {profile.status || 'ACTIVE'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bus & Vehicle Information */}
        <div className="p-card">
          <div className="p-card-title">Registered Shuttle Bus</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '22px', height: '22px' }}>
                <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#10203a' }}>{profile.busRegNumber || 'Vehicle Assigned'}</div>
              <div style={{ fontSize: '13px', color: '#7a8699' }}>{profile.routeName || 'University Route'}</div>
            </div>
          </div>

          <div className="p-info-grid">
            <div className="p-info-item">
              <span>Registration No</span>
              <span style={{ fontWeight: 600 }}>{profile.busRegNumber || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>Route Name</span>
              <span>{profile.routeName || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>Passenger Capacity</span>
              <span>{profile.capacity ? `${profile.capacity} seats` : '—'}</span>
            </div>
            <div className="p-info-item">
              <span>Monthly Fare Rate</span>
              <span style={{ color: '#0e7c66', fontWeight: 700 }}>
                {profile.monthlyFee ? `LKR ${Number(profile.monthlyFee).toLocaleString()}` : '—'}
              </span>
            </div>
          </div>

          <hr className="p-divider" />
          <div style={{ fontSize: '13px', color: '#7a8699' }}>
            Need to change your route or update your bus registration number? Contact the administrator for fleet verification.
          </div>
        </div>

        {/* Security & Password */}
        <div className="p-card">
          <div className="p-card-title">Security & Credentials</div>
          <p style={{ fontSize: '14px', color: '#40506b', marginBottom: '16px' }}>
            Protect your driver account. You can reset or update your password via our secure verification code system.
          </p>
          <a href="/portal/forgot-password" className="p-btn outline sm">
            Reset Password with Code →
          </a>
        </div>

        {/* Sign Out */}
        <div className="p-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="p-card-title">Sign Out</div>
            <p style={{ fontSize: '14px', color: '#7a8699' }}>
              Signing out will terminate your current web operator session on this device.
            </p>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={logout} className="p-btn danger sm">
              Sign Out of Driver Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
