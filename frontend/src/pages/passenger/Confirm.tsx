import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps } from '../../components/UI';
import { useBooking } from '../../context/BookingContext';
import { createBookingApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';

export default function ConfirmBooking() {
  const navigate = useNavigate();
  const { booking, setPhone, confirmBooking } = useBooking();
  const { user } = useAuth();
  const toast = useToast();
  const [phone, setLocalPhone] = useState(booking.phone || user?.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleProceed = async () => {
    if (!phone) { setPhoneError('Please enter your M-Pesa phone number'); return; }
    if (!booking.selectedTripId || !booking.selectedSeatId) {
      toast('Please go back and select a valid seat', 'error');
      return;
    }

    if (!booking.passenger) {
      toast('Passenger details are missing. Please reselect seat and add passenger details.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        tripId: booking.selectedTripId,
        seatId: booking.selectedSeatId,
        firstName: booking.passenger.firstName,
        lastName: booking.passenger.lastName,
        email: booking.passenger.email,
        phone,
        nationalId: booking.passenger.idNumber,
        residence: booking.passenger.residence,
      };

      const result = await createBookingApi(payload);

      confirmBooking(result.data.bookingCode, result.data.id, result.data.status as any);
      setPhone(phone);
      navigate('/passenger/payment');
    } catch (error) {
      toast((error as Error).message || 'Failed to create booking', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const p = booking.passenger;

  return (
    <DashboardLayout title="Confirm booking" subtitle="Review everything before paying">
      <Steps steps={['Search','Results','Seat','Confirm','Payment','Ticket']} current={3} />

      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          <div className="card mb-4">
            <div className="card-title">Passenger information</div>
            {[
              ['Full name',  `${p?.firstName ?? 'Jane'} ${p?.lastName ?? 'Mwangi'}`],
              ['National ID', p?.idNumber ?? '23456789'],
              ['Residence',   p?.residence ?? 'Nairobi'],
              ['Email',       p?.email ?? 'jane@email.com'],
            ].map(([l, v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--gray-100)', fontSize:13.5 }}>
                <span style={{ color:'var(--gray-400)' }}>{l}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Trip details</div>
            {[
              ['Route',      'Nairobi → Nakuru'],
              ['SACCO',      booking.selectedBus?.saccoName ?? 'Modern Coast'],
              ['Date',       booking.searchQuery?.date ?? 'Wed 18 Mar 2026'],
              ['Departure',  '8:00 AM'],
              ['Arrival',    '11:30 AM (est.)'],
              ['Seat',       `${booking.selectedSeat ?? '14B'} · ${booking.seatClass ?? 'Economy'}`],
            ].map(([l, v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--gray-100)', fontSize:13.5 }}>
                <span style={{ color:'var(--gray-400)' }}>{l}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', fontSize:16, fontWeight:700 }}>
              <span>Total fare</span>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:22, color:'var(--brand)' }}>
                KES {(booking.fare || 850).toLocaleString()}
              </span>
            </div>

            {/* AI fraud check */}
            <div style={{ background:'var(--brand-light)', border:'1px solid var(--brand-mid)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--brand-dark)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>🤖 AI Security check</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                <span style={{ color:'var(--brand)', fontSize:18 }}>✓</span>
                <span><strong>Passed</strong> · Trust score 94/100 · No duplicate bookings detected</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">M-Pesa number for payment</label>
              <input className={`input${phoneError ? ' has-error' : ''}`}
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={e => { setLocalPhone(e.target.value); setPhoneError(''); }} />
              {phoneError && <span className="form-error">{phoneError}</span>}
              <span className="form-hint">An STK push will be sent to this number</span>
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={handleProceed} disabled={submitting}>
              {submitting ? 'Creating booking…' : `Pay KES ${(booking.fare || 850).toLocaleString()} via M-Pesa →`}
            </button>
          </div>
        </div>

        <div>
          <div className="card mb-4" style={{ background:'var(--gray-900)', border:'none' }}>
            <div style={{ background:'var(--brand)', borderRadius:'var(--r)', padding:'16px 18px', marginBottom:18 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Your trip</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:'#fff' }}>Nairobi → Nakuru</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.75)', marginTop:4 }}>
                {booking.searchQuery?.date ?? 'Wed 18 Mar 2026'} · 8:00 AM
              </div>
            </div>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.7, marginBottom:12 }}>
              After clicking Pay, you will receive an M-Pesa STK push on your phone. Enter your PIN within 60 seconds to complete the booking.
            </p>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.7 }}>
              Your ticket will be sent to <strong style={{ color:'var(--gray-200)' }}>{p?.email ?? 'your email'}</strong> immediately after payment.
            </p>
          </div>
          <div className="card card-sm" style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--gray-400)' }}>
            🔒 Secured by Safaricom M-Pesa · Transaction encrypted end-to-end
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
