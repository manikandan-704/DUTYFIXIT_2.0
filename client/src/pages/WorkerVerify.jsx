import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const WorkerVerify = () => {
  const navigate = useNavigate();

  // States: 'form', 'pending', 'approved', 'rejected'
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
        .catch(err => console.error("Error fetching verification status", err));
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
        name: formData.get('name'),
        gender: formData.get('gender'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        idNumber: formData.get('idNumber'),
        city: formData.get('city'),
        pincode: formData.get('pincode'),
        address: formData.get('address'),
        profession: formData.get('profession'),
        idType: 'Aadhaar',
        profilePhotoData: photoBase64,
        certificateData: certBase64,
        workerId: localStorage.getItem('workerId') || 'W-' + Date.now().toString().slice(-6)
      };

      await api.post('/verification', data);
      setVerificationStatus('pending');
      Toastify({ text: "Verification submitted!", style: { background: "#10b981" } }).showToast();
    } catch (err) {
      console.error("Failed to submit verification", err);
      Toastify({ text: "Failed to submit verification request.", style: { background: "#ef4444" } }).showToast();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar role="worker" />

      <main className="wv-main">
        {verificationStatus === 'form' && (
          <div className="wv-card">
            <h1 className="wv-title">Worker Verification</h1>
            <form onSubmit={handleVerification}>
              <h2 className="section-header">Basic Details</h2>

              <div className="input-group">
                <label className="input-label">Profile Photo</label>
                <input type="file" className="form-input" accept="image/*" required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" name="name" className="form-input" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Profession</label>
                  <select name="profession" className="form-input" required defaultValue="">
                     <option value="" disabled>Select Profession</option>
                     <option value="Plumbing">Plumbing</option>
                     <option value="Electrical">Electrical</option>
                     <option value="Cleaning">Cleaning</option>
                     <option value="Painting">Painting</option>
                     <option value="Carpentry">Carpentry</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input type="email" name="email" className="form-input" defaultValue={userEmail} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Mobile</label>
                  <input type="tel" name="mobile" className="form-input" required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Aadhaar ID Number</label>
                  <input type="text" name="idNumber" className="form-input" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Certificate (PDF/Image)</label>
                  <input type="file" className="form-input" accept=".pdf,image/*" required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">City</label>
                  <input type="text" name="city" className="form-input" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Pincode</label>
                  <input type="text" name="pincode" className="form-input" required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Full Address</label>
                <textarea name="address" className="form-input" rows="3" required></textarea>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </form>
          </div>
        )}

        {verificationStatus === 'pending' && (
          <div className="wv-card text-center">
            <div className="pending-icon"><i className="fas fa-clock"></i></div>
            <h2>Verification Pending</h2>
            <p>Our team is reviewing your profile. Please check back in 24-48 hours.</p>
            <button className="btn btn-primary" onClick={() => navigate('/worker')}>Back to Dashboard</button>
          </div>
        )}

        {verificationStatus === 'approved' && (
          <div className="wv-card text-center">
            <div className="pending-icon approved"><i className="fas fa-check-circle"></i></div>
            <h2>Verification Approved</h2>
            <p>You are now a verified professional on DutyFixIT!</p>
            <button className="btn btn-primary" onClick={() => navigate('/worker')}>Go to Dashboard</button>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <div className="wv-card text-center">
            <div className="pending-icon rejected"><i className="fas fa-times-circle"></i></div>
            <h2>Verification Rejected</h2>
            <p>Unfortunately, your request was rejected. Please check your details and try again.</p>
            <button className="btn btn-primary" onClick={() => setVerificationStatus('form')}>Try Again</button>
          </div>
        )}
      </main>

      <Footer role="worker" />
    </>
  );
};

export default WorkerVerify;
