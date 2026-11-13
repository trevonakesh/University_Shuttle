'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { portalFetch, getPortalUser, clearPortalToken } from '../../../../lib/portalApi';
import { useT } from '../../../../lib/useLang';

export default function StudentProfilePage() {
  const t = useT();
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

  if (loading) return <BrandLoader label={t("Loading profile…")} />;

  const profile = user?.profile || {};

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>{t("My Profile & Settings")}</h1>
        <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>{t("Manage your university shuttle account and assigned route.")}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '24px' }}>
        {/* Personal Details */}
        <div className="p-card">
          <div className="p-card-title">{t("Student Information")}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--green-tint)', color: 'var(--green-ink)', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>{profile.fullName || t("Student")}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>{user?.email}</div>
              <span className="p-badge green" style={{ marginTop: '6px' }}>{t("Student Member")}</span>
            </div>
          </div>

          <div className="p-info-grid">
            <div className="p-info-item">
              <span>{t("Full Name")}</span>
              <span>{profile.fullName || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>{t("Email")}</span>
              <span>{user?.email || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>{t("Phone")}</span>
              <span>{user?.phone || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>{t("Pickup Point")}</span>
              <span>{profile.pickupPoint || t("Not specified")}</span>
            </div>
          </div>

          <hr className="p-divider" />
          <div style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>
            {t("Need to change your pickup point or registered phone number? Please contact your bus driver or our support team.")}
          </div>
        </div>

        {/* Assigned Shuttle Info */}
        <div className="p-card">
          <div className="p-card-title">{t("Assigned Bus & Driver")}</div>
          {fare?.assigned ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--blue-tint)', color: 'var(--blue-ink)', display: 'grid', placeItems: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '22px', height: '22px' }}>
                    <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{fare.driverName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>{t("Driver & Bus Operator")}</div>
                </div>
              </div>

              <div className="p-info-grid">
                <div className="p-info-item">
                  <span>{t("Monthly Fare")}</span>
                  <span style={{ color: 'var(--green-ink)', fontWeight: 700 }}>{t("LKR")} {fare.amountDue?.toLocaleString()}</span>
                </div>
                <div className="p-info-item">
                  <span>{t("Current Month")}</span>
                  <span>{fare.month}</span>
                </div>
                <div className="p-info-item">
                  <span>{t("Payment Status")}</span>
                  <span>
                    <span className={`p-badge ${fare.status === 'PAID' ? 'green' : fare.frozen ? 'red' : 'amber'}`}>
                      {fare.status === 'PAID' ? t("PAID") : fare.frozen ? t("FROZEN") : t("UNPAID")}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <a href="/portal/student/fare" className="p-btn outline sm">{t("Manage Fare & Receipts →")}</a>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ink-faint)' }}>
              <p style={{ fontSize: '14px', marginBottom: '12px' }}>{t("You have not been assigned to a shuttle bus yet.")}</p>
              <div style={{ fontSize: '13px' }}>{t("Open Find a Bus to browse verified buses and send a seat request to your driver.")}</div>
            </div>
          )}
        </div>

        {/* Security & Password */}
        <div className="p-card">
          <div className="p-card-title">{t("Security & Password")}</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '16px' }}>
            {t("To reset or change your account password, you can use our secure verification code system.")}
          </p>
          <a href="/portal/forgot-password" className="p-btn outline sm">
            {t("Reset Password with Code →")}
          </a>
        </div>

        {/* Session */}
        <div className="p-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="p-card-title">{t("Sign Out")}</div>
            <p style={{ fontSize: '14px', color: 'var(--ink-faint)' }}>
              {t("Signing out will end your current web session. You will need to sign in again to access your student portal.")}
            </p>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={logout} className="p-btn danger sm">
              {t("Sign Out of Student Portal")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
