import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Steps } from '../../components/UI';
import { api } from '../../lib/api';
import { showToast } from '../../components/UI';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const amount = useMemo(() => Number(location.state?.amount || 850), [location.state]);
  const [phoneNumber, setPhoneNumber] = useState(location.state?.phoneNumber || '0712345678');
  const [loading, setLoading] = useState(false);
  const [checkoutId, setCheckoutId] = useState(null);
  const [status, setStatus] = useState('IDLE');

  useEffect(() => {
    if (!checkoutId || status !== 'PENDING') return;

    const timer = setInterval(async () => {
      try {
        const response = await api.mpesaStatus(checkoutId);
        const payment = response.data;
        if (payment.status === 'SUCCESS') {
          setStatus('SUCCESS');
          clearInterval(timer);
          showToast('Payment confirmed');
          navigate('/user/ticket', { state: { mpesaReceiptNumber: payment.mpesaReceiptNumber, amount } });
        }
        if (payment.status === 'FAILED') {
          setStatus('FAILED');
          clearInterval(timer);
          showToast(payment.resultDesc || 'Payment failed', 'error');
        }
      } catch {
        // Ignore transient polling errors; next interval will retry.
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [checkoutId, status, navigate, amount]);

  const startStk = async () => {
    setLoading(true);
    try {
      const response = await api.mpesaStkPush({
        amount,
        phoneNumber,
        accountReference: 'SC-BOOKING',
        transactionDesc: 'Safari Connect ticket payment'
      });

      const checkoutRequestId = response?.data?.CheckoutRequestID;
      if (!checkoutRequestId) {
        throw new Error('No CheckoutRequestID returned');
      }

      setCheckoutId(checkoutRequestId);
      setStatus('PENDING');
      showToast('STK push sent successfully');
    } catch (error) {
      showToast(error.message || 'Could not start STK push', 'error');
      setStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">M-Pesa Payment</div></div>
      <div className="page-body">
        <Steps steps={['Search','Results','Seat','Confirm','Pay']} current={4} />
        <div style={{maxWidth:460}}>
          <div className="card" style={{textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:14}} className="pulse">📱</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,marginBottom:6}}>KES {amount}</div>
            <div className="form-group" style={{textAlign:'left',marginBottom:16}}>
              <label className="form-label">Phone number</label>
              <input className="form-input" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder="0712345678"/>
            </div>
            <div style={{fontSize:13,color:'var(--gray-400)',marginBottom:20}}>Payment status: <strong>{status}</strong></div>
            <div style={{background:'var(--amber-light)',borderRadius:10,padding:14,marginBottom:20,border:'1px solid #fcd34d'}}>
              <div style={{fontSize:13,color:'#92400e',fontWeight:700}}>Waiting for M-Pesa PIN confirmation…</div>
              <div style={{fontSize:12,color:'#92400e',marginTop:4}}>Enter your M-Pesa PIN on your phone. This expires in 5 minutes.</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1,justifyContent:'center'}} onClick={startStk} disabled={loading}>{loading ? 'Sending...' : 'Send / Resend push'}</button>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={() => navigate('/user/ticket')}>Open ticket</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}