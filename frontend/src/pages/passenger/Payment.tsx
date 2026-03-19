import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps } from '../../components/UI';
import { useBooking } from '../../context/BookingContext';
import { getPaymentStatusApi, initiateStkPushApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type PayStatus = 'waiting' | 'success' | 'failed';

export default function Payment() {
  const navigate = useNavigate();
  const { booking, confirmBooking } = useBooking();
  const toast = useToast();
  const [status, setStatus] = useState<PayStatus>('waiting');
  const [seconds, setSeconds] = useState(60);
  const [initiating, setInitiating] = useState(false);

  const triggerStkPush = async () => {
    if (!booking.bookingId || !booking.phone) return;
    setInitiating(true);
    try {
      await initiateStkPushApi({ bookingId: booking.bookingId, phoneNumber: booking.phone });
      toast('STK push sent. Complete payment on your phone.', 'info');
    } catch (error) {
      setStatus('failed');
      toast((error as Error).message || 'Failed to initiate M-Pesa payment', 'error');
    } finally {
      setInitiating(false);
    }
  };

  useEffect(() => {
    if (status !== 'waiting') return;
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (!booking.bookingId || !booking.phone) return;
    void triggerStkPush();
  }, [booking.bookingId, booking.phone]);

  useEffect(() => {
    if (status !== 'waiting' || !booking.bookingId) return;

    const poll = setInterval(() => {
      void (async () => {
        try {
          const payment = await getPaymentStatusApi(booking.bookingId);
          const payStatus = payment.data.payment?.status;

          if (payStatus === 'SUCCESS' || payment.data.bookingStatus === 'CONFIRMED') {
            confirmBooking(payment.data.bookingCode, payment.data.bookingId, payment.data.bookingStatus);
            setStatus('success');
            clearInterval(poll);
            setTimeout(() => navigate('/passenger/ticket'), 900);
            return;
          }

          if (payStatus === 'FAILED') {
            setStatus('failed');
            clearInterval(poll);
          }
        } catch {
          // Keep polling until timeout.
        }
      })();
    }, 5000);

    return () => clearInterval(poll);
  }, [status, booking.bookingId, confirmBooking, navigate]);

  return (
    <DashboardLayout title="M-Pesa Payment" subtitle="Complete payment to confirm your booking">
      <Steps steps={['Search','Results','Seat','Confirm','Payment','Ticket']} current={4} />

      <div style={{ maxWidth: 520 }}>
        <div className="card text-center" style={{ padding: '44px 36px' }}>
          <div style={{ fontSize: 66, marginBottom: 20 }} className={status === 'waiting' ? 'pulse-icon' : ''}>
            {status === 'success' ? '✅' : status === 'failed' ? '❌' : '📱'}
          </div>

          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, marginBottom:6 }}>
            KES {(booking.fare || 850).toLocaleString()}
          </div>
          <p className="text-muted mb-5">
            STK push sent to <strong style={{ color:'var(--gray-800)' }}>{booking.phone || '0712 345 678'}</strong>
          </p>

          {status === 'waiting' && (
            <>
              <div style={{ background:'var(--warning-light)', border:'1px solid #fde68a', borderRadius:'var(--r)', padding:16, marginBottom:24 }}>
                <div style={{ fontWeight:700, color:'#92400e', marginBottom:6 }}>Check your phone now</div>
                <div style={{ fontSize:13, color:'#92400e', marginBottom:12 }}>
                  Enter your M-Pesa PIN to confirm. Request expires in{' '}
                  <strong>{seconds}s</strong>.
                </div>
                <div style={{ height:4, background:'#fde68a', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'var(--warning)', borderRadius:99, width:`${(seconds/60)*100}%`, transition:'width 1s linear' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost btn-full" onClick={() => { setSeconds(60); void triggerStkPush(); }} disabled={initiating}>Resend STK push</button>
                <button className="btn btn-primary btn-full" disabled>
                  Waiting for payment…
                </button>
              </div>
              {initiating && <p className="text-xs text-muted mt-3">Initiating payment request…</p>}
            </>
          )}

          {status === 'success' && (
            <div style={{ background:'var(--brand-light)', border:'1px solid var(--brand-mid)', borderRadius:'var(--r)', padding:20 }}>
              <div style={{ fontWeight:700, color:'var(--brand-dark)', fontSize:16 }}>Payment received!</div>
              <div style={{ fontSize:13, color:'var(--gray-500)', marginTop:4 }}>Generating your ticket…</div>
            </div>
          )}

          {status === 'failed' && (
            <div>
              <div style={{ background:'var(--danger-light)', border:'1px solid #fca5a5', borderRadius:'var(--r)', padding:16, marginBottom:16 }}>
                <div style={{ fontWeight:700, color:'var(--danger)' }}>Payment failed</div>
                <div style={{ fontSize:13, color:'#991b1b', marginTop:4 }}>
                  Your PIN may have been incorrect or the request timed out.
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={() => { setStatus('waiting'); setSeconds(60); }}>
                Try again
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted text-center mt-3">
          🔒 Payments processed securely via Safaricom M-Pesa
        </p>
      </div>
    </DashboardLayout>
  );
}
