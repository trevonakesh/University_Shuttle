'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState, useMemo } from 'react';
import { portalFetch } from '../../../../lib/portalApi';

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
        setMsg({ ok: false, text: resData.error || 'Failed to update status' });
      } else {
        setMsg({ ok: true, text: `Successfully updated fare to ${status}` });
        loadMonthData(month);
      }
    } catch {
      setMsg({ ok: false, text: 'Network error updating fare status.' });
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
          <h1 style={{ fontSize: '26px', color: '#10203a' }}>Monthly Fare Ledger</h1>
          <p style={{ color: '#7a8699', marginTop: '6px' }}>
            Track seat collections, record cash payments, or mark students who did not travel.
          </p>
        </div>

        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="month-select" style={{ fontSize: '13px', fontWeight: 600, color: '#40506b' }}>Month:</label>
          <select
            id="month-select"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: '1.5px solid #dde3ec',
              background: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              color: '#10203a',
              cursor: 'pointer'
            }}
          >
            {monthsList.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} {m === currentMonthStr && '(Current)'}
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
        <BrandLoader label={`Loading ledger for ${month}…`} />
      ) : data ? (
        <>
          {/* Summary Row */}
          <div className="p-stats">
            <div className="p-stat">
              <div className="p-stat-label">Total Expected</div>
              <div className="p-stat-val blue">LKR {data.summary.expected.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#7a8699', marginTop: '4px' }}>
                {data.summary.total - data.summary.exempt} billable seats
              </div>
            </div>

            <div className="p-stat">
              <div className="p-stat-label">Collected</div>
              <div className="p-stat-val green">LKR {data.summary.collected.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#7a8699', marginTop: '4px' }}>
                {data.summary.paid} paid passengers
              </div>
            </div>

            <div className="p-stat">
              <div className="p-stat-label">Unpaid Balance</div>
              <div className="p-stat-val amber">
                LKR {(data.summary.expected - data.summary.collected).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#7a8699', marginTop: '4px' }}>
                {data.summary.unpaid} pending collection
              </div>
            </div>

            <div className="p-stat">
              <div className="p-stat-label">Exempt / Skipped</div>
              <div className="p-stat-val red">{data.summary.exempt}</div>
              <div style={{ fontSize: '12px', color: '#7a8699', marginTop: '4px' }}>
                Didn&apos;t travel this month
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '240px', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="Search by student name or pickup point…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #dde3ec',
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
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <div className="p-card">
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a8699' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#10203a' }}>No students match your filter</div>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Pickup Point</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment Detail</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.studentId}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#10203a' }}>{s.fullName}</div>
                          <div style={{ fontSize: '11px', color: '#7a8699' }}>ID: #{s.studentId}</div>
                        </td>
                        <td style={{ color: '#40506b', fontSize: '13px' }}>{s.pickupPoint || '—'}</td>
                        <td style={{ fontSize: '13px' }}>
                          {s.phone ? (
                            <a href={`tel:${s.phone}`} style={{ color: '#2563eb' }}>{s.phone}</a>
                          ) : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#10203a' }}>
                          LKR {s.amount.toLocaleString()}
                        </td>
                        <td>
                          <span className={`p-badge ${s.status === 'PAID' ? 'green' : s.status === 'EXEMPT' ? 'gray' : s.frozen ? 'red' : 'amber'}`}>
                            {s.status === 'PAID' ? 'PAID' : s.status === 'EXEMPT' ? 'EXEMPT' : s.frozen ? 'FROZEN' : 'UNPAID'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#7a8699' }}>
                          {s.status === 'PAID' ? (
                            <div>
                              <span style={{ fontWeight: 600, color: '#10203a' }}>
                                {s.paymentMethod === 'PAYHERE' ? 'Online (PayHere)' : s.paymentMethod === 'IN_APP' ? 'In-App' : 'Cash'}
                              </span>
                              {s.paidAt && <div>{new Date(s.paidAt).toLocaleDateString()}</div>}
                            </div>
                          ) : s.status === 'EXEMPT' ? (
                            <span>Didn&apos;t travel</span>
                          ) : (
                            <span style={{ color: '#e8912f' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {s.status !== 'PAID' && (
                              <button
                                onClick={() => updateFare(s.studentId, 'PAID')}
                                disabled={updatingId === s.studentId}
                                className="p-btn sm primary"
                                title="Mark as cash collected"
                              >
                                Mark Paid (Cash)
                              </button>
                            )}

                            {/* A month the student paid online can't be reset or exempted; only cash can be undone. */}
                            {s.status !== 'EXEMPT' && !(s.status === 'PAID' && s.paymentMethod !== 'CASH') && (
                              <button
                                onClick={() => updateFare(s.studentId, 'EXEMPT')}
                                disabled={updatingId === s.studentId}
                                className="p-btn sm outline"
                                title="Mark student as didn't travel this month"
                              >
                                Exempt
                              </button>
                            )}

                            {s.status !== 'UNPAID' && !(s.status === 'PAID' && s.paymentMethod !== 'CASH') && (
                              <button
                                onClick={() => updateFare(s.studentId, 'UNPAID')}
                                disabled={updatingId === s.studentId}
                                className="p-btn sm danger"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                title="Revert back to unpaid"
                              >
                                Reset
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
        <div className="p-alert red">Could not load monthly fares.</div>
      )}
    </div>
  );
}
