import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const api = axios.create({ baseURL: '/api' });

const toast = (text, bg = '#10b981') =>
  Toastify({ text, style: { background: bg }, duration: 3000, gravity: 'top', position: 'right' }).showToast();

const Request = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [payingFor, setPayingFor] = useState(null); // booking ID currently paying

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'professional' && role !== 'admin') {
      navigate('/login');
      return;
    }

    const workerId = localStorage.getItem('workerId');
    if (workerId) {
      api.get(`/bookings/worker/${workerId}`)
        .then(res => {
          setRequests(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [navigate]);

  /* ── Razorpay Accept Flow ── */
  const handleAccept = async (bookingId) => {
    if (payingFor) return; // prevent double-click
    setPayingFor(bookingId);

    try {
      // 1. Create Razorpay order on server
      const { data: order } = await api.post('/payment/create-order', {
        bookingId,
        amount: 100, // ₹100 fixed
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'DutyFixIT',
        description: 'Service Acceptance Fee — ₹100',
        order_id: order.orderId,
        handler: async function (response) {
          // 3. Verify payment on server
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });

            // Update UI
            setRequests(prev =>
              prev.map(r => r._id === bookingId ? { ...r, status: 'Accepted' } : r)
            );
            toast('✅ Payment successful — Booking accepted!');
          } catch (err) {
            console.error('Verification failed:', err);
            toast('⚠️ Payment done but verification failed. Contact support.', '#f59e0b');
          } finally {
            setPayingFor(null);
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userMobile') || '',
        },
        theme: {
          color: '#0f172a',
        },
        modal: {
          ondismiss: function () {
            setPayingFor(null);
            toast('Payment cancelled — booking not accepted.', '#64748b');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setPayingFor(null);
        toast('❌ Payment failed: ' + (response.error?.description || 'Unknown error'), '#ef4444');
      });
      rzp.open();

    } catch (err) {
      console.error('Failed to create order:', err);
      setPayingFor(null);
      toast('Failed to initiate payment. Try again.', '#ef4444');
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await api.put(`/bookings/${bookingId}`, { status: 'Rejected', rejectionReason: reason || 'Rejected by worker' });
      setRequests(prev => prev.map(r => r._id === bookingId ? { ...r, status: 'Rejected' } : r));
      toast('Booking rejected.', '#f59e0b');
    } catch (err) {
      toast('Failed to reject.', '#ef4444');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Completed': return { className: 'rq-status--completed', icon: 'fa-check-circle' };
      case 'Accepted': return { className: 'rq-status--accepted', icon: 'fa-thumbs-up' };
      case 'Rejected': return { className: 'rq-status--rejected', icon: 'fa-times-circle' };
      case 'Cancelled': return { className: 'rq-status--cancelled', icon: 'fa-ban' };
      default: return { className: 'rq-status--pending', icon: 'fa-clock' };
    }
  };

  const tabs = [
    { key: 'Pending', label: 'Pending', icon: 'fa-clock' },
    { key: 'Accepted', label: 'Accepted', icon: 'fa-thumbs-up' },
    { key: 'Completed', label: 'Completed', icon: 'fa-check' },
    { key: 'all', label: 'All', icon: 'fa-list' },
  ];

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter(r => r.status === activeTab);

  return (
    <>
      <Navbar role="worker" />

      <main className="rq-main">
        <div className="rq-header-section">
          <h1 className="rq-page-title">
            <i className="fas fa-inbox"></i> Booking Requests
          </h1>
          <p className="rq-page-subtitle">Manage incoming service requests from clients</p>

          <div className="rq-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`rq-tab ${activeTab === tab.key ? 'rq-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
                <span className="rq-tab-count">
                  {tab.key === 'all' ? requests.length : requests.filter(r => r.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rq-content">
          {loading ? (
            <div className="rq-loading">
              <div className="pb-spinner"></div>
              <p>Loading requests…</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rq-empty">
              <div className="rq-empty-icon">
                <i className="fas fa-inbox"></i>
              </div>
              <h3>No {activeTab !== 'all' ? activeTab : ''} Requests</h3>
              <p>
                {activeTab === 'Pending'
                  ? 'No pending requests right now. New bookings will appear here.'
                  : `No ${activeTab.toLowerCase()} requests found.`}
              </p>
            </div>
          ) : (
            <div className="rq-list">
              {filteredRequests.map(req => {
                const statusCfg = getStatusConfig(req.status);
                const isPaying = payingFor === req._id;
                return (
                  <div key={req._id} className="rq-card" id={`request-${req._id}`}>
                    <div className="rq-card-top">
                      <div className="rq-service-icon">
                        <i className="fas fa-tools"></i>
                      </div>
                      <div className="rq-card-info">
                        <h3 className="rq-service-name">{req.service}</h3>
                        {req.subService && <p className="rq-sub-service">{req.subService}</p>}
                      </div>
                      <div className={`rq-status-badge ${statusCfg.className}`}>
                        <i className={`fas ${statusCfg.icon}`}></i> {req.status}
                      </div>
                    </div>

                    <div className="rq-card-details">
                      <div className="rq-detail">
                        <i className="fas fa-user"></i>
                        <span>{req.clientName || 'Unknown Client'}</span>
                      </div>
                      <div className="rq-detail">
                        <i className="fas fa-calendar-alt"></i>
                        <span>{req.date ? new Date(req.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                      </div>
                      <div className="rq-detail">
                        <i className="fas fa-clock"></i>
                        <span>{req.time || '—'}</span>
                      </div>
                      {req.contact && (
                        <div className="rq-detail">
                          <i className="fas fa-phone"></i>
                          <span>{req.contact}</span>
                        </div>
                      )}
                      {req.location && (
                        <div className="rq-detail">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{typeof req.location === 'string' ? req.location : req.location.city || ''}</span>
                        </div>
                      )}
                    </div>

                    {req.status === 'Pending' && (
                      <div className="rq-card-actions">
                        {/* Payment info banner */}
                        <div style={{
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          borderRadius: '0.5rem', padding: '0.5rem 0.75rem',
                          marginBottom: '0.65rem', display: 'flex',
                          alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem',
                          color: '#166534', width: '100%'
                        }}>
                          <i className="fas fa-info-circle"></i>
                          Accepting this request requires a ₹100 service fee via Razorpay.
                        </div>

                        <button
                          className="rq-accept-btn"
                          onClick={() => handleAccept(req._id)}
                          disabled={isPaying}
                          style={isPaying ? { opacity: 0.6, cursor: 'wait' } : {}}
                        >
                          {isPaying ? (
                            <><div className="pb-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Processing…</>
                          ) : (
                            <><i className="fas fa-rupee-sign"></i> Pay ₹100 & Accept</>
                          )}
                        </button>
                        <button className="rq-reject-btn" onClick={() => handleReject(req._id)} disabled={isPaying}>
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </div>
                    )}

                    {/* Show payment badge for accepted bookings */}
                    {req.status === 'Accepted' && req.paymentId && (
                      <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: '0.5rem', padding: '0.4rem 0.75rem',
                        marginTop: '0.5rem', fontSize: '0.75rem', color: '#166534',
                        display: 'flex', alignItems: 'center', gap: '0.4rem'
                      }}>
                        <i className="fas fa-check-circle"></i>
                        Paid — {req.paymentId}
                      </div>
                    )}

                    {req.bookingId && (
                      <div className="rq-booking-id">ID: {req.bookingId}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer role="worker" />
    </>
  );
};

export default Request;
