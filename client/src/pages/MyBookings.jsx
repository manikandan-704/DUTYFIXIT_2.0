import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const api = axios.create({ baseURL: '/api' });

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'client') {
      navigate('/login');
      return;
    }

    const email = localStorage.getItem('userEmail') || '';
    if (email) {
      api.get(`/bookings/client/${email}`)
        .then(res => {
          setBookings(res.data);
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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Completed':
        return { className: 'mb-status--completed', icon: 'fa-check-circle', label: 'Completed' };
      case 'Accepted':
        return { className: 'mb-status--accepted', icon: 'fa-thumbs-up', label: 'Accepted' };
      case 'Rejected':
        return { className: 'mb-status--rejected', icon: 'fa-times-circle', label: 'Rejected' };
      case 'Cancelled':
        return { className: 'mb-status--cancelled', icon: 'fa-ban', label: 'Cancelled' };
      default:
        return { className: 'mb-status--pending', icon: 'fa-clock', label: status || 'Pending' };
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Accepted', label: 'Accepted' },
    { key: 'Completed', label: 'Completed' },
  ];

  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}`, { status: 'Cancelled', cancellationReason: 'Cancelled by client' });
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'Cancelled' } : b));
      Toastify({ text: 'Booking cancelled.', style: { background: '#f59e0b' }, duration: 3000 }).showToast();
    } catch (err) {
      Toastify({ text: 'Failed to cancel booking.', style: { background: '#ef4444' } }).showToast();
    }
  };

  return (
    <>
      <Navbar role="client" />

      <main className="mb-main">
        <div className="mb-header-section">
          <h1 className="mb-page-title">
            <i className="fas fa-receipt"></i> My Bookings
          </h1>
          <p className="mb-page-subtitle">Track and manage all your service bookings</p>

          {/* Tabs */}
          <div className="mb-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`mb-tab ${activeTab === tab.key ? 'mb-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.key === 'all' && <span className="mb-tab-count">{bookings.length}</span>}
                {tab.key !== 'all' && (
                  <span className="mb-tab-count">
                    {bookings.filter(b => b.status === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-content">
          {loading ? (
            <div className="mb-loading">
              <div className="pb-spinner"></div>
              <p>Loading your bookings…</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="mb-empty">
              <div className="mb-empty-icon">
                <i className="fas fa-folder-open"></i>
              </div>
              <h3>No Bookings Found</h3>
              <p>{activeTab === 'all' ? "You haven't made any bookings yet." : `No ${activeTab.toLowerCase()} bookings.`}</p>
              {activeTab === 'all' && (
                <button className="mb-cta-btn" onClick={() => navigate('/client')}>
                  <i className="fas fa-plus"></i> Book a Service
                </button>
              )}
            </div>
          ) : (
            <div className="mb-bookings-list">
              {filteredBookings.map(b => {
                const statusCfg = getStatusConfig(b.status);
                return (
                  <div key={b._id} className="mb-booking-card" id={`booking-${b._id}`}>
                    <div className="mb-card-top">
                      <div className="mb-service-icon">
                        <i className="fas fa-tools"></i>
                      </div>
                      <div className="mb-card-info">
                        <h3 className="mb-service-name">{b.service}</h3>
                        {b.subService && <p className="mb-sub-service">{b.subService}</p>}
                      </div>
                      <div className={`mb-status-badge ${statusCfg.className}`}>
                        <i className={`fas ${statusCfg.icon}`}></i> {statusCfg.label}
                      </div>
                    </div>

                    <div className="mb-card-details">
                      <div className="mb-detail">
                        <i className="fas fa-calendar-alt"></i>
                        <span>{b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                      </div>
                      <div className="mb-detail">
                        <i className="fas fa-clock"></i>
                        <span>{b.time || '—'}</span>
                      </div>
                      <div className="mb-detail">
                        <i className="fas fa-hard-hat"></i>
                        <span>{b.workerName || 'Pending Assignment'}</span>
                      </div>
                      {b.location && (
                        <div className="mb-detail">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{typeof b.location === 'string' ? b.location : `${b.location.city || ''}`}</span>
                        </div>
                      )}
                    </div>

                    {(b.status === 'Pending' || b.status === 'Accepted') && (
                      <div className="mb-card-actions">
                        <button className="mb-cancel-btn" onClick={() => handleCancel(b._id)}>
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </div>
                    )}

                    {b.bookingId && (
                      <div className="mb-booking-id">
                        ID: {b.bookingId}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer role="client" />
    </>
  );
};

export default MyBookings;
