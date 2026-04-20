import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const api = axios.create({ baseURL: '/api' });

const WorkerPage = () => {
  const navigate = useNavigate();
  // Example dummy states pulling from localStorage
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Worker Name');
  const [userProfession, setUserProfession] = useState('Profession');
  const [jobsDone, setJobsDone] = useState(0);
  const [rating, setRating] = useState('0.0');

  useEffect(() => {
    // Check authentication
    const role = localStorage.getItem('userRole');
    if (role !== 'professional' && role !== 'admin') {
      // navigate('/login'); // Keep lenient for now
    }
    
    // Load state from local storage securely
    setUserEmail(localStorage.getItem('userEmail') || 'worker@dutyfixit.com');
    setUserName(localStorage.getItem('userName') || 'John Doe');
    setUserProfession(localStorage.getItem('userProfession') || 'Plumbing');
    
    // Fetch stats
    const workerId = localStorage.getItem('workerId');
    if (workerId) {
      api.get(`/bookings/dashboard/${workerId}`)
        .then(res => {
          setJobsDone(res.data.jobsDone || 0);
          setRating(res.data.rating || '0.0');
        })
        .catch(err => console.error("Error fetching worker stats", err));
    }
  }, [navigate]);

  const getInitials = (name) => {
    if (!name) return 'W';
    const split = name.split(' ');
    if (split.length > 1) return split[0][0] + split[1][0];
    return split[0][0];
  };

  return (
    <>
      <Navbar role="worker" />

      <div className="worker-dashboard-container min-h-screen-minus-header">
        {/* Sidebar */}
        <aside className="worker-sidebar worker-sidebar-transparent">
          <div className="worker-profile-section">
            <div className="profile-image-container" onClick={() => document.getElementById('profileUpload').click()}>
               <div className="worker-initials-container">
                  {getInitials(userName)}
               </div>
               <div className="upload-overlay">
                  <i className="fas fa-camera"></i>
               </div>
               <input type="file" id="profileUpload" accept="image/*" style={{ display: 'none' }} />
            </div>

            <h2 className="worker-name">{userName}</h2>
            <p className="worker-profession">{userProfession}</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="worker-main-content">
          <h1 className="dashboard-title">Dashboard</h1>

          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-icon-container job-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div className="stats-info">
                <p className="stats-label">Jobs Done</p>
                <h3 className="stats-value">{jobsDone}</h3>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-icon-container rating-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stats-info">
                <p className="stats-label">Rating</p>
                <h3 className="stats-value">{rating} <span className="rating-text">/ 5.0</span></h3>
              </div>
            </div>
          </div>

          {/* Verification CTA */}
          <div className="wk-verify-cta" onClick={() => navigate('/worker-verify')} style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            borderRadius: '12px',
            border: '1px solid #c7d2fe',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.25rem', flexShrink: 0
            }}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                Get Verified
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Complete your verification to start receiving job requests from clients.
              </p>
            </div>
            <i className="fas fa-chevron-right" style={{ color: '#4f46e5', fontSize: '1rem' }}></i>
          </div>
        </main>
      </div>

      <Footer role="worker" />
    </>
  );
};

export default WorkerPage;
