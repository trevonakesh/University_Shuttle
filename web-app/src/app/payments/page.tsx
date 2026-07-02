'use client';
import { useEffect, useState } from 'react';

type Payment = {
  id: number;
  amount: number;
  month: string;
  status: string;
  paymentDate: string;
  paymentMethod: string;
  student: { fullName: string; studentId: string };
  driver: { fullName: string; busRegNumber: string };
};

type DriverEarning = {
  driverName: string;
  busReg: string;
  totalEarnings: number;
  paymentCount: number;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [driverEarnings, setDriverEarnings] = useState<DriverEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/payments')
      .then(res => res.json())
      .then(data => {
        setPayments(data);
        
        // Calculate earnings per driver
        const earningsMap = new Map<string, DriverEarning>();
        
        data.forEach((p: Payment) => {
          if (p.status === 'COMPLETED') {
            const key = p.driver.fullName;
            if (earningsMap.has(key)) {
              const current = earningsMap.get(key)!;
              current.totalEarnings += p.amount;
              current.paymentCount += 1;
            } else {
              earningsMap.set(key, {
                driverName: p.driver.fullName,
                busReg: p.driver.busRegNumber,
                totalEarnings: p.amount,
                paymentCount: 1
              });
            }
          }
        });
        
        setDriverEarnings(Array.from(earningsMap.values()));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading payments...</div>;

  return (
    <div>
      <h1>Platform Payments</h1>
      <p className="subtitle">Overview of all transactions and driver earnings.</p>
      
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
        {driverEarnings.map((earning, idx) => (
          <div key={idx} className="glass-panel" style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
              {earning.driverName} ({earning.busReg})
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>
              Rs. {earning.totalEarnings.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              From {earning.paymentCount} completed payments
            </div>
          </div>
        ))}
        {driverEarnings.length === 0 && (
          <div className="glass-panel" style={{ flex: 1 }}>
            No earnings data available yet.
          </div>
        )}
      </div>

      <h2>Recent Transactions</h2>
      <div className="glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Driver</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>#{payment.id}</td>
                <td>
                  <div>{payment.student.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payment.student.studentId}</div>
                </td>
                <td>
                  <div>{payment.driver.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payment.driver.busRegNumber}</div>
                </td>
                <td>{payment.month}</td>
                <td style={{ fontWeight: 'bold' }}>Rs. {payment.amount}</td>
                <td>{payment.paymentMethod}</td>
                <td>
                  <span className={`badge ${payment.status.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
