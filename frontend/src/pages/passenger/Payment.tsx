import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps } from '../../components/UI';
import { useBooking } from '../../context/BookingContext';
import { getPaymentStatusApi, initiateStkPushApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type PayStatus = 'waiting' | 'success' | 'failed';
const LAST_BOOKING_ID_KEY = 'safiri_last_booking_id';

export default function Payment() {
  const navigate = useNavigate();
  const { booking, confirmBooking } = useBooking();
  const toast = useToast();
  const [status, setStatus] = useState<PayStatus>('waiting');
  const [seconds, setSeconds] = useState(120);
  const [initiating, setInitiating] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [attemptStartedAt, setAttemptStartedAt] = useState<number | null>(null);
  const amountDisplay = booking.fare > 0 ? `KES ${booking.fare.toLocaleString()}` : 'KES -';
  const phoneDisplay = booking.phone || 'No phone number available';

  const triggerStkPush = async () => {
    if (!booking.bookingId || !booking.phone) return;
    setInitiating(true);
    setStatus('waiting');
    setSeconds(120);
    setPollingActive(false);
    const startedAt = Date.now();
    setAttemptStartedAt(startedAt);

    try {
      const result = await initiateStkPushApi({ bookingId: booking.bookingId, phoneNumber: booking.phone });

      const shouldSkipVerification = Boolean(
        result.data?.skipPaymentVerification ||
        result.data?.autoCompleted ||
        result.data?.simulated ||
        result.data?.safeDemoMode,
      );

      if (shouldSkipVerification) {
        const confirmedCode = booking.bookingRef || booking.bookingId;
        confirmBooking(confirmedCode, booking.bookingId, 'CONFIRMED');
        if (booking.bookingId) {
          localStorage.setItem(LAST_BOOKING_ID_KEY, booking.bookingId);
        }
        setStatus('success');
        setPollingActive(false);
        toast('STK push sent. Skipping callback verification and generating your receipt.', 'success');
        setTimeout(() => navigate(`/passenger/ticket?bookingId=${booking.bookingId}`), 900);
        return;
      }

      if (result.data?.payment?.status === 'SUCCESS') {
        confirmBooking(booking.bookingRef || result.data.payment.bookingId, result.data.payment.bookingId, 'CONFIRMED');
        if (result.data.payment.bookingId) {
          localStorage.setItem(LAST_BOOKING_ID_KEY, result.data.payment.bookingId);
        }
        setStatus('success');
        setPollingActive(false);
        toast('STK push accepted and payment confirmed.', 'success');
        setTimeout(() => navigate(`/passenger/ticket?bookingId=${result.data.payment.bookingId}`), 900);
        return;
      }

      setPollingActive(true);
      toast('STK push sent. Complete payment on your phone.', 'info');
    } catch (error) {
      try {
        const fallback = await getPaymentStatusApi(booking.bookingId);
        const payStatus = fallback.data.payment?.status;
        if (payStatus === 'SUCCESS' || fallback.data.bookingStatus === 'CONFIRMED') {
          confirmBooking(fallback.data.bookingCode, fallback.data.bookingId, fallback.data.bookingStatus);
          if (fallback.data.bookingId) {
            localStorage.setItem(LAST_BOOKING_ID_KEY, fallback.data.bookingId);
          }
          setStatus('success');
          setPollingActive(false);
          toast('Payment already confirmed.', 'success');
          setTimeout(() => navigate(`/passenger/ticket?bookingId=${fallback.data.bookingId}`), 900);
          return;
        }
      } catch {
        // Ignore secondary failures and fall through to generic state.
      }

      setPollingActive(false);
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
    if (status !== 'waiting' || !booking.bookingId || !pollingActive) return;

    const poll = setInterval(() => {
      void (async () => {
        try {
          const payment = await getPaymentStatusApi(booking.bookingId);
          const payStatus = payment.data.payment?.status;

          if (payStatus === 'SUCCESS' || payment.data.bookingStatus === 'CONFIRMED') {
            confirmBooking(payment.data.bookingCode, payment.data.bookingId, payment.data.bookingStatus);
            if (payment.data.bookingId) {
              localStorage.setItem(LAST_BOOKING_ID_KEY, payment.data.bookingId);
            }
            setStatus('success');
            setPollingActive(false);
            clearInterval(poll);
            setTimeout(() => navigate(`/passenger/ticket?bookingId=${payment.data.bookingId}`), 900);
            return;
          }

          if (payStatus === 'FAILED') {
            // Ignore stale failed states that can appear before the latest STK request is persisted.
            const paymentCreatedAtMs = payment.data.payment?.createdAt
              ? new Date(payment.data.payment.createdAt).getTime()
              : null;
            if (attemptStartedAt && paymentCreatedAtMs && paymentCreatedAtMs < attemptStartedAt) {
              return;
            }

            setStatus('failed');
            setPollingActive(false);
            clearInterval(poll);
          }
        } catch {
          // Keep polling until timeout.
        }
      })();
    }, 5000);

    return () => clearInterval(poll);
  }, [status, booking.bookingId, confirmBooking, navigate, pollingActive, attemptStartedAt]);

  return (
    <DashboardLayout title="M-Pesa Payment" subtitle="Complete payment to confirm your booking">
      <Steps steps={['Search','Results','Seat','Confirm','Payment','Ticket']} current={4} />

      <div style={{ maxWidth: 520 }}>
        <div className="card text-center" style={{ padding: '44px 36px' }}>
          <div style={{ fontSize: 66, marginBottom: 20 }} className={status === 'waiting' ? 'pulse-icon' : ''}>
            {status === 'success' ? '✅' : status === 'failed' ? '❌' : '📱'}
          </div>

          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, marginBottom:6 }}>
            {amountDisplay}
          </div>
          <p className="text-muted mb-5">
            STK push sent to <strong style={{ color:'var(--gray-800)' }}>{phoneDisplay}</strong>
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
                  <div style={{ height:'100%', background:'var(--warning)', borderRadius:99, width:`${(seconds/120)*100}%`, transition:'width 1s linear' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost btn-full" onClick={() => { void triggerStkPush(); }} disabled={initiating}>Resend STK push</button>
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
              <button className="btn btn-primary btn-full" onClick={() => { void triggerStkPush(); }}>
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
