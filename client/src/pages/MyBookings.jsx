import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'client') {
      navigate('/login');
      return;
    }
    const email = localStorage.getItem('userEmail') || '';
    if (email) {
      api.get(`/bookings/client/${email}`)
        .then(res => { setBookings(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const tabs = ['all', 'Pending', 'Accepted', 'Completed'];
  const filteredBookings = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}`, { status: 'Cancelled', cancellationReason: 'Cancelled by client' });
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'Cancelled' } : b));
      Toastify({ text: 'Booking cancelled.', className: 'Toastify__toast--info', duration: 3000 }).showToast();
    } catch {
      Toastify({ text: 'Failed to cancel booking.', className: 'Toastify__toast--error', duration: 3000 }).showToast();
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/bookings/${reviewBookingId}`, { rating: reviewRating, feedback: reviewFeedback });
      setBookings(prev => prev.map(b => b._id === reviewBookingId ? { ...b, rating: reviewRating, feedback: reviewFeedback } : b));
      Toastify({ text: 'Review submitted successfully!', className: 'Toastify__toast--success', duration: 3000 }).showToast();
      setReviewModalOpen(false);
      setReviewRating(5);
      setReviewFeedback('');
    } catch {
      Toastify({ text: 'Failed to submit review.', className: 'Toastify__toast--error', duration: 3000 }).showToast();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="client" />
      <main className="l-container" style={{ flex: 1, paddingBlock: 'var(--space-8)' }}>
        <h1 className="u-mb-4">My Bookings</h1>
        
        <div className="filter-chips u-mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`chip ${activeTab === tab ? 'chip--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? 'All' : tab} ({tab === 'all' ? bookings.length : bookings.filter(b => b.status === tab).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="tickets-grid">
            <div className="skeleton skeleton--card"></div>
            <div className="skeleton skeleton--card"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="u-text-center" style={{ padding: 'var(--space-12)' }}>
            <i className="fas fa-folder-open u-mb-4" style={{ fontSize: '3rem', color: 'var(--line)' }}></i>
            <h3 className="u-mb-2">No Bookings Found</h3>
            <p className="u-mb-6">You haven't made any {activeTab !== 'all' ? activeTab.toLowerCase() : ''} bookings yet.</p>
            {activeTab === 'all' && (
              <button className="btn btn--primary" onClick={() => navigate('/client')}>Book a Service</button>
            )}
          </div>
        ) : (
          <div className="tickets-grid">
            {filteredBookings.map(b => (
              <div key={b._id} className="ticket">
                <div className="ticket__header">
                  <span className="ticket__id">{b.bookingId || 'PENDING'}</span>
                  <span className={`badge badge--${b.status.toLowerCase()}`}>{b.status}</span>
                </div>
                <div className="ticket__body">
                  <h3 className="u-mb-4">{b.service} {b.subService && <span style={{fontWeight: 400, color: 'var(--ink-soft)'}}>— {b.subService}</span>}</h3>
                  
                  <div className="ticket__row">
                    <span className="ticket__label">Date</span>
                    <span className="ticket__value">{b.date ? new Date(b.date).toLocaleDateString('en-IN') : '—'}</span>
                  </div>
                  <div className="ticket__row">
                    <span className="ticket__label">Time</span>
                    <span className="ticket__value">{b.time || '—'}</span>
                  </div>
                  <div className="ticket__row">
                    <span className="ticket__label">Worker</span>
                    <span className="ticket__value">{b.workerName || 'Pending'}</span>
                  </div>
                </div>
                
                {(b.status === 'Pending' || b.status === 'Accepted') && (
                  <div className="ticket__footer">
                    <button className="btn btn--danger" onClick={() => handleCancel(b._id)}>Cancel</button>
                  </div>
                )}
                
                {b.status === 'Completed' && !b.rating && (
                  <div className="ticket__footer">
                    <button className="btn btn--ghost" onClick={() => { setReviewBookingId(b._id); setReviewModalOpen(true); }}>Leave a Review</button>
                  </div>
                )}
                {b.status === 'Completed' && b.rating && (
                  <div className="ticket__footer" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(b.rating)}{'☆'.repeat(5 - b.rating)}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--ink-soft)' }}>Rated</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--paper)', padding: 'var(--space-6)', borderRadius: 'var(--radius-sm)', width: '90%', maxWidth: '400px' }}>
            <h2 className="u-mb-4">Rate your service</h2>
            <form onSubmit={submitReview}>
              <div className="form-group">
                <label className="form-label">Rating (1-5)</label>
                <input type="number" min="1" max="5" value={reviewRating} onChange={e => setReviewRating(e.target.value)} className="form-input" required />
              </div>
              <div className="form-group u-mb-6">
                <label className="form-label">Feedback</label>
                <textarea value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} className="form-textarea" required></textarea>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setReviewModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer role="client" />
    </div>
  );
};

export default MyBookings;
