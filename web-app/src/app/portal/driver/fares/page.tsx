'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { portalFetch } from '../../../../lib/portalApi';
import EditPassengerModal from '../../../../components/EditPassengerModal';
import { useLang, useT } from '../../../../lib/useLang';
import { formatDate } from '../../../../lib/i18n';

interface StudentFare {
  studentId: number;
  fullName: string;
  pickupPoint: string | null;
  phone: string | null;
  status: 'PAID' | 'UNPAID' | 'EXEMPT';
  amount: number;
  paymentMethod: string | null;
  paidAt: string | null;
  markedBy: string | null;
  frozen: boolean;
}

interface FareResponse {
  month: string;
  fee: number;
  dueDay: number;
  summary: {
    total: number;
    paid: number;
    unpaid: number;
    exempt: number;
    expected: number;
    collected: number;
  };
  students: StudentFare[];
}

export default function DriverFaresPage() {
  const t = useT();
  const lang = useLang();
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }, []);

  const [month, setMonth] = useState(currentMonthStr);
  const [data, setData] = useState<FareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'EXEMPT'>('ALL');
  const [editing, setEditing] = useState<StudentFare | null>(null);

  const closeEditor = useCallback(() => setEditing(null), []);

  const handleSaved = (pickupPoint: string, message: string) => {
    const studentId = editing?.studentId;
    setData(d => d && { ...d, students: d.students.map(s => s.studentId === studentId ? { ...s, pickupPoint } : s) });
    setMsg({ ok: true, text: t(message) });
    setEditing(null);
  };

  const loadMonthData = (targetMonth: string) => {
    setLoading(true);
    portalFetch(`/api/fares/driver?month=${targetMonth}`)
      .then(r => r.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMonthData(month);
  }, [month]);

  const updateFare = async (studentId: number, status: 'PAID' | 'UNPAID' | 'EXEMPT') => {
    setUpdatingId(studentId);
    setMsg(null);
    try {
      const res = await portalFetch(`/api/fares/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ month, status })
      });
      const resData = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: t(resData.error || 'Failed to update status') });
      } else {
        setMsg({ ok: true, text: t('Fare marked as {status}.', { status: t(status) }) });
        loadMonthData(month);
      }
    } catch {
      setMsg({ ok: false, text: t('Network error updating fare status.') });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter(s => {
      const matchesSearch =
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (s.pickupPoint && s.pickupPoint.toLowerCase().includes(search.toLowerCase())) ||
        (s.phone && s.phone.includes(search));
      const matchesStatus =
        statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const monthsList = useMemo(() => {
    const list = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const val = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}`;
      list.push(val);
    }
    return list;
  }, []);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>{t("Monthly Fare Ledger")}</h1>
          <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t("Track seat collections, record cash payments, or mark students who did not travel.")}
          </p>
        </div>

        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="month-select" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>{t("Month:")}</label>
          <select
            id="month-select"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: '1.5px solid var(--line)',
              background: 'var(--paper)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink)',
              cursor: 'pointer'
            }}
          >
            {monthsList.map(m => (
              <option key={m} value={m}>
                {formatDate(m + '-01T00:00:00', lang, 'month')} {m === currentMonthStr && t("(Current)")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {msg && (
        <div className={`p-alert ${msg.ok ? 'green' : 'red'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <BrandLoader label={t('Loading…')} />
      ) : data ? (
        <>
          {/* Summary Row */}
          <div className="p-stats">
            <div className="p-stat">
              <div className="p-stat-label">{t("Total Expected")}</div>
              <div className="p-stat-val blue">{t("LKR")} {data.summary.expected.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '4px' }}>
                {data.summary.total - data.summary.exempt} {t("billable seats")}
              </div>
            </div>

            <div className="p-stat">
              <div className="p-stat-label">{t("Collected")}</div>
              <div className="p-stat-val green">{t("LKR")} {data.summary.collected.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '4px' }}>
                {data.summary.paid} {t("paid passengers")}
              </div>
            </div>

            <div className="p-stat">
              <div className="p-stat-label">{t("Unpaid Balance")}</div>
              <div className="p-stat-val amber">
                {t("LKR")} {(data.summary.expected - data.summary.collected).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '4px' }}>
                {data.summary.unpaid} {t("pending collection")}
              </div>
            </div>

            <div className="p-stat">
              <div className="p-stat-label">{t("Exempt / Skipped")}</div>
              <div className="p-stat-val red">{data.summary.exempt}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '4px' }}>
                {t("Didn't travel this month")}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '240px', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder={t("Search by student name or pickup point…")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--line)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ALL', 'PAID', 'UNPAID', 'EXEMPT'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`p-btn sm ${statusFilter === tab ? 'primary' : 'outline'}`}
                >
                  {tab === 'ALL' ? t('All') : t(tab)}
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <div className="p-card">
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-faint)' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>{t("No students match your filter")}</div>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>{t("Try adjusting your search query or status filter.")}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>{t("Passenger")}</th>
                      <th>{t("Pickup Point")}</th>
                      <th>{t("Phone")}</th>
                      <th>{t("Amount")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Payment Detail")}</th>
                      <th style={{ textAlign: 'right' }}>{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.studentId}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.fullName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>{t("ID: #")}{s.studentId}</div>
                        </td>
                        <td style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>{s.pickupPoint || '—'}</td>
                        <td style={{ fontSize: '13px' }}>
                          {s.phone ? (
                            <a href={`tel:${s.phone}`} style={{ color: 'var(--blue-ink)' }}>{s.phone}</a>
                          ) : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--ink)' }}>
                          {t("LKR")} {s.amount.toLocaleString()}
                        </td>
                        <td>
                          <span className={`p-badge ${s.status === 'PAID' ? 'green' : s.status === 'EXEMPT' ? 'gray' : s.frozen ? 'red' : 'amber'}`}>
                            {s.status === 'PAID' ? t("PAID") : s.status === 'EXEMPT' ? t("EXEMPT") : s.frozen ? t("FROZEN") : t("UNPAID")}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>
                          {s.status === 'PAID' ? (
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                {s.paymentMethod === 'PAYHERE' ? t("Online (PayHere)") : s.paymentMethod === 'IN_APP' ? t("In-App") : t("Cash")}
                              </span>
                              {s.paidAt && <div>{new Date(s.paidAt).toLocaleDateString()}</div>}
                            </div>
                          ) : s.status === 'EXEMPT' ? (
                            <span>{t("Didn't travel")}</span>
                          ) : (
                            <span style={{ color: 'var(--amber)' }}>{t("Pending")}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button onClick={() => setEditing(s)} className="p-btn sm outline" title={t("Edit pickup point and contact details")}>
                              {t("Edit Details")}
                            </button>

                            {s.status !== 'PAID' && (
                              <button
                                onClick={() => updateFare(s.studentId, 'PAID')}
                                disabled={updatingId === s.studentId}
                                className="p-btn sm primary"
                                title={t("Mark as cash collected")}
                              >
                                {t("Mark Paid (Cash)")}
                              </button>
                            )}

                            {/* A month the student paid online can't be reset or exempted; only cash can be undone. */}
                            {s.status !== 'EXEMPT' && !(s.status === 'PAID' && s.paymentMethod !== 'CASH') && (
                              <button
                                onClick={() => updateFare(s.studentId, 'EXEMPT')}
                                disabled={updatingId === s.studentId}
                                className="p-btn sm outline"
                                title={t("Mark student as didn't travel this month")}
                              >
                                {t("Exempt")}
                              </button>
                            )}

                            {s.status !== 'UNPAID' && !(s.status === 'PAID' && s.paymentMethod !== 'CASH') && (
                              <button
                                onClick={() => updateFare(s.studentId, 'UNPAID')}
                                disabled={updatingId === s.studentId}
                                className="p-btn sm danger"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                title={t("Revert back to unpaid")}
                              >
                                {t("Reset")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-alert red">{t("Could not load monthly fares.")}</div>
      )}

      {editing && (
        <EditPassengerModal
          studentId={editing.studentId}
          studentName={editing.fullName}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
