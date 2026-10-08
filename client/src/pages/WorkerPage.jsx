import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const WorkerPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Worker Name');
  const [userProfession, setUserProfession] = useState('Profession');
  const [jobsDone, setJobsDone] = useState(0);
  const [rating, setRating] = useState('0.0');
  const [profilePic, setProfilePic] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'professional' && role !== 'admin') {
      // navigate('/login'); 
    }
    setUserName(localStorage.getItem('userName') || 'John Doe');
    setUserProfession(localStorage.getItem('userProfession') || 'Plumbing');
    
    const workerId = localStorage.getItem('workerId');
    if (workerId) {
      api.get(`/bookings/dashboard/${workerId}`)
        .then(res => {
          setJobsDone(res.data.jobsDone || 0);
          setRating(res.data.rating || '0.0');
          setProfilePic(res.data.profilePic || null);
          setPendingRequests(res.data.pendingRequests || 0);
        })
        .catch(() => {});
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="worker" />

      <main className="l-container" style={{ flex: 1, paddingBlock: 'var(--space-8)' }}>
        
        <div className="u-mb-8" style={{display: 'flex', alignItems: 'center', gap: 'var(--space-4)'}}>
          <div className="avatar" style={{margin: 0, width: '64px', height: '64px', fontSize: '1.5rem', overflow: 'hidden'}}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userName.charAt(0)
            )}
          </div>
          <div>
            <h1 style={{fontSize: '1.5rem'}}>{userName}</h1>
            <p className="u-mono" style={{color: 'var(--ink-soft)'}}>{userProfession}</p>
          </div>
        </div>

        {pendingRequests > 0 && (
          <div className="u-mb-6" style={{
            backgroundColor: 'var(--accent)', 
            color: '#ffffff',
            padding: 'var(--space-4)', 
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <i className="fas fa-bell" style={{marginRight: '8px'}}></i>
              <strong>You have {pendingRequests} new request{pendingRequests > 1 ? 's' : ''}!</strong>
            </div>
            <button className="btn btn--primary" style={{backgroundColor: '#ffffff', color: 'var(--accent)'}} onClick={() => navigate('/worker-request')}>
              View
            </button>
          </div>
        )}

        <div className="ledger-stats">
          <div className="ledger-stat">
            <span className="ledger-stat__value">{jobsDone}</span>
            <span className="ledger-stat__label">Jobs Completed</span>
          </div>
          <div className="ledger-stat">
            <span className="ledger-stat__value">{rating}</span>
            <span className="ledger-stat__label">Average Rating</span>
          </div>
        </div>

        <button 
          className="btn btn--ghost" 
          style={{width: '100%', height: 'auto', padding: 'var(--space-6)', display: 'flex', justifyContent: 'space-between'}} 
          onClick={() => navigate('/worker-verify')}
        >
          <div style={{textAlign: 'left'}}>
            <h3 style={{marginBottom: '4px'}}>Get Verified</h3>
            <p style={{fontWeight: 400, color: 'var(--ink-soft)', fontSize: '0.875rem'}}>Upload your credentials to start receiving requests.</p>
          </div>
          <i className="fas fa-arrow-right"></i>
        </button>

      </main>

      <Footer role="worker" />
    </div>
  );
};

export default WorkerPage;
