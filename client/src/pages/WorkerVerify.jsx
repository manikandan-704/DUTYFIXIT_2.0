import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const WorkerVerify = () => {
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('form');
  const [userEmail, setUserEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    if (email) {
      api.get(`/verification/status?email=${encodeURIComponent(email)}`)
        .then(res => {
          if (res.data.status === 'Pending') setVerificationStatus('pending');
          else if (res.data.status === 'Approved') setVerificationStatus('approved');
          else if (res.data.status === 'Rejected') setVerificationStatus('rejected');
        })
        .catch(() => {});
    }
  }, []);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleVerification = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target);
    const photoFile = e.target.querySelector('input[type="file"]').files[0];
    const certFile = e.target.querySelectorAll('input[type="file"]')[1].files[0];

    try {
      let photoBase64 = photoFile ? await toBase64(photoFile) : '';
      let certBase64 = certFile ? await toBase64(certFile) : '';

      const data = {
        name: formData.get('name'), gender: formData.get('gender'), email: formData.get('email'),
        mobile: formData.get('mobile'), idNumber: formData.get('idNumber'), city: formData.get('city'),
        pincode: formData.get('pincode'), address: formData.get('address'), profession: formData.get('profession'),
        idType: 'Aadhaar', profilePhotoData: photoBase64, certificateData: certBase64,
        workerId: localStorage.getItem('workerId') || 'W-' + Date.now().toString().slice(-6)
      };

      await api.post('/verification', data);
      setVerificationStatus('pending');
      Toastify({ text: "Verification submitted!", className: 'Toastify__toast--success', duration: 3000 }).showToast();
    } catch {
      Toastify({ text: "Failed to submit verification request.", className: 'Toastify__toast--error', duration: 3000 }).showToast();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="worker" />

      <main className="l-container" style={{ flex: 1, paddingBlock: 'var(--space-8)' }}>
        <div className="verify-layout">
          
          {verificationStatus === 'form' && (
            <>
              <h1 className="u-mb-6">Verification Request</h1>
              <form onSubmit={handleVerification}>
                
                <div className="form-group">
                  <label className="form-label">Profile Photo</label>
                  <input type="file" className="form-input" accept="image/*" required style={{paddingTop: '10px'}} />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="name" className="form-input" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Profession</label>
                  <select name="profession" className="form-select" required defaultValue="">
                     <option value="" disabled>Select Profession</option>
                     <option value="Plumbing">Plumbing</option>
                     <option value="Electrical">Electrical</option>
                     <option value="Cleaning">Cleaning</option>
                     <option value="Painting">Painting</option>
                     <option value="Carpentry">Carpentry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" defaultValue={userEmail} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile</label>
                  <input type="tel" name="mobile" className="form-input" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Aadhaar ID Number</label>
                  <input type="text" name="idNumber" className="form-input" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Certificate (PDF/Image)</label>
                  <input type="file" className="form-input" accept=".pdf,image/*" required style={{paddingTop: '10px'}} />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" name="city" className="form-input" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" name="pincode" className="form-input" required />
                </div>

                <div className="form-group u-mb-8">
                  <label className="form-label">Full Address</label>
                  <textarea name="address" className="form-textarea" required></textarea>
                </div>

                <button type="submit" className="btn btn--primary" style={{width: '100%'}} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </form>
            </>
          )}

          {verificationStatus === 'pending' && (
            <div className="u-text-center">
              <div className="verify-status-banner">
                <span>Verification Pending</span>
                <i className="fas fa-clock"></i>
              </div>
              <p className="u-mb-6">Our team is reviewing your profile. Please check back in 24-48 hours.</p>
              <button className="btn btn--ghost" onClick={() => navigate('/worker')}>Back to Dashboard</button>
            </div>
          )}

          {verificationStatus === 'approved' && (
            <div className="u-text-center">
              <div className="verify-status-banner verify-status-banner--approved">
                <span>Verification Approved</span>
                <i className="fas fa-check-circle"></i>
              </div>
              <p className="u-mb-6">You are now a verified professional on DutyFixIT!</p>
              <button className="btn btn--primary" onClick={() => navigate('/worker')}>Go to Dashboard</button>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="u-text-center">
              <div className="verify-status-banner verify-status-banner--rejected">
                <span>Verification Rejected</span>
                <i className="fas fa-times-circle"></i>
              </div>
              <p className="u-mb-6">Unfortunately, your request was rejected. Please check your details and try again.</p>
              <button className="btn btn--ghost" onClick={() => setVerificationStatus('form')}>Try Again</button>
            </div>
          )}
          
        </div>
      </main>

      <Footer role="worker" />
    </div>
  );
};

export default WorkerVerify;
