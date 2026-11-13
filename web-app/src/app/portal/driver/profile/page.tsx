'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { portalFetch, getPortalUser, clearPortalToken } from '../../../../lib/portalApi';
import { useT } from '../../../../lib/useLang';

export default function DriverProfilePage() {
  const t = useT();
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
    window.location.href = '/login';
  };

  if (loading) return <BrandLoader label={t("Loading profile…")} />;

  const profile = user?.profile || {};

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>{t("Bus & Driver Profile")}</h1>
        <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>
          {t("Registered vehicle details, assigned route, and operator account settings.")}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '24px' }}>
        {/* Driver Operator Information */}
        <div className="p-card">
          <div className="p-card-title">{t("Driver Operator Details")}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--amber-tint)', color: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'D'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>{profile.fullName || t("Driver Operator")}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>{user?.email}</div>
              <span className="p-badge amber" style={{ marginTop: '6px' }}>{t("Registered Driver")}</span>
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
              <span>{t("Account Status")}</span>
              <span>
                <span className={`p-badge ${profile.status === 'ACTIVE' ? 'green' : profile.status === 'REJECTED' ? 'red' : 'amber'}`}>
                  {profile.status || t("ACTIVE")}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bus & Vehicle Information */}
        <div className="p-card">
          <div className="p-card-title">{t("Registered Shuttle Bus")}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--blue-tint)', color: 'var(--blue-ink)', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '22px', height: '22px' }}>
                <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{profile.busRegNumber || t("Vehicle Assigned")}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>{profile.routeName || t("University Route")}</div>
            </div>
          </div>

          <div className="p-info-grid">
            <div className="p-info-item">
              <span>{t("Registration No")}</span>
              <span style={{ fontWeight: 600 }}>{profile.busRegNumber || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>{t("Route Name")}</span>
              <span>{profile.routeName || '—'}</span>
            </div>
            <div className="p-info-item">
              <span>{t("Passenger Capacity")}</span>
              <span>{profile.capacity ? t('{n} seats', { n: profile.capacity }) : '—'}</span>
            </div>
            <div className="p-info-item">
              <span>{t("Monthly Fare Rate")}</span>
              <span style={{ color: 'var(--green-ink)', fontWeight: 700 }}>
                {profile.monthlyFee ? `LKR ${Number(profile.monthlyFee).toLocaleString()}` : '—'}
              </span>
            </div>
          </div>

          <hr className="p-divider" />
          <div style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>
            {t("Need to change your route or update your bus registration number? Contact the administrator for fleet verification.")}
          </div>
        </div>

        {/* Security & Password */}
        <div className="p-card">
          <div className="p-card-title">{t("Security & Credentials")}</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '16px' }}>
            {t("Protect your driver account. You can reset or update your password via our secure verification code system.")}
          </p>
          <a href="/portal/forgot-password" className="p-btn outline sm">
            {t("Reset Password with Code →")}
          </a>
        </div>

        {/* Sign Out */}
        <div className="p-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="p-card-title">{t("Sign Out")}</div>
            <p style={{ fontSize: '14px', color: 'var(--ink-faint)' }}>
              {t("Signing out will terminate your current web operator session on this device.")}
            </p>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={logout} className="p-btn danger sm">
              {t("Sign Out of Driver Portal")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
