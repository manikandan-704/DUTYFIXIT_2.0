import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const toast = (text, type = 'info') =>
  Toastify({ 
    text, 
    className: type === 'success' ? 'Toastify__toast--success' : (type === 'error' ? 'Toastify__toast--error' : ''),
    duration: 3000, 
    gravity: 'top', 
    position: 'right' 
  }).showToast();

const Request = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [payingFor, setPayingFor] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'professional' && role !== 'admin') {
      navigate('/login');
      return;
    }
    const workerId = localStorage.getItem('workerId');
    if (workerId) {
      api.get(`/bookings/worker/${workerId}`)
        .then(res => { setRequests(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleAccept = async (bookingId) => {
    if (payingFor) return;
    setPayingFor(bookingId);
    try {
      const { data: order } = await api.post('/payment/create-order', { bookingId, amount: 100 });
      const options = {
        key: order.keyId, amount: order.amount, currency: order.currency, name: 'DutyFixIT',
        description: 'Lead Unlock Fee — ₹100', order_id: order.orderId,
        handler: async function (response) {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });
            setRequests(prev => prev.map(r => r._id === bookingId ? { ...r, status: 'Accepted' } : r));
            toast('Payment successful — Booking accepted!', 'success');
          } catch {
            toast('Payment done but verification failed.', 'error');
          } finally {
            setPayingFor(null);
          }
        },
        prefill: { name: localStorage.getItem('userName'), email: localStorage.getItem('userEmail'), contact: localStorage.getItem('userMobile') },
        theme: { color: '#0E3B3A' },
        modal: { ondismiss: function () { setPayingFor(null); toast('Payment cancelled.'); } }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () { setPayingFor(null); toast('Payment failed.', 'error'); });
      rzp.open();
    } catch {
      setPayingFor(null);
      toast('Failed to initiate payment.', 'error');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await api.put(`/bookings/${bookingId}`, { status: 'Rejected', rejectionReason: reason || 'Rejected by worker' });
      setRequests(prev => prev.map(r => r._id === bookingId ? { ...r, status: 'Rejected' } : r));
      toast('Booking rejected.');
    } catch {
      toast('Failed to reject.', 'error');
    }
  };

  const handleComplete = async (bookingId) => {
    if (!window.confirm('Mark this job as completed?')) return;
    try {
      await api.put(`/bookings/${bookingId}`, { status: 'Completed' });
      setRequests(prev => prev.map(r => r._id === bookingId ? { ...r, status: 'Completed' } : r));
      toast('Job marked as completed.', 'success');
    } catch {
      toast('Failed to mark completed.', 'error');
    }
  };

  const tabs = ['Pending', 'Accepted', 'Completed', 'all'];
  const filteredRequests = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="worker" />
      <main className="l-container" style={{ flex: 1, paddingBlock: 'var(--space-8)' }}>
        <h1 className="u-mb-4">Work Requests</h1>
        
        <div className="filter-chips u-mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`chip ${activeTab === tab ? 'chip--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? 'All' : tab} ({tab === 'all' ? requests.length : requests.filter(r => r.status === tab).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="tickets-grid">
            <div className="skeleton skeleton--card"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="u-text-center" style={{ padding: 'var(--space-12)' }}>
            <i className="fas fa-inbox u-mb-4" style={{ fontSize: '3rem', color: 'var(--line)' }}></i>
            <h3 className="u-mb-2">No Requests</h3>
            <p className="u-mb-6">You have no {activeTab !== 'all' ? activeTab.toLowerCase() : ''} requests at the moment.</p>
          </div>
        ) : (
          <div className="tickets-grid">
            {filteredRequests.map(req => (
              <div key={req._id} className="ticket">
                <div className="ticket__header">
                  <span className="ticket__id">{req.bookingId || 'PENDING'}</span>
                  {req.status === 'Accepted' && <span className="stamp stamp--paid">PAID</span>}
                  {req.status !== 'Accepted' && <span className={`badge badge--${req.status.toLowerCase()}`}>{req.status}</span>}
                </div>
                
                <div className="ticket__body">
                  <h3 className="u-mb-4">{req.service}</h3>
                  
                  <div className="ticket__row">
                    <span className="ticket__label">Client</span>
                    <span className={`ticket__value ${req.status === 'Pending' ? 'request-blurred' : 'request-unlocked'}`}>
                      {req.status === 'Pending' ? 'John Doe' : req.clientName}
                    </span>
                  </div>
                  
                  <div className="ticket__row">
                    <span className="ticket__label">Contact</span>
                    <span className={`ticket__value ${req.status === 'Pending' ? 'request-blurred' : 'request-unlocked'}`}>
                      {req.status === 'Pending' ? '+91 99999 99999' : req.contact}
                    </span>
                  </div>

                  <div className="ticket__row">
                    <span className="ticket__label">Date</span>
                    <span className="ticket__value">{req.date ? new Date(req.date).toLocaleDateString('en-IN') : '—'}</span>
                  </div>
                </div>

                {req.status === 'Pending' && (
                  <div className="ticket__footer">
                    <button className="btn btn--danger" onClick={() => handleReject(req._id)} disabled={payingFor === req._id}>
                      Reject
                    </button>
                    <button className="btn btn--accent" onClick={() => handleAccept(req._id)} disabled={payingFor === req._id}>
                      {payingFor === req._id ? 'Processing...' : 'Pay ₹100 & Accept'}
                    </button>
                  </div>
                )}
                {req.status === 'Accepted' && (
                  <div className="ticket__footer">
                    <button className="btn btn--primary" onClick={() => handleComplete(req._id)} style={{width: '100%'}}>
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer role="worker" />
    </div>
  );
};

export default Request;
