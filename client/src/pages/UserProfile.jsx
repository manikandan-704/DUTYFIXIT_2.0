import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: '', email: '', mobile: '', dob: '', gender: '',
    address: { flatNumber: '', city: '', pincode: '' }
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId || localStorage.getItem('userRole') !== 'client') navigate('/login');
    
    api.get(`/profile/${userId}`)
      .then(res => {
        const user = res.data;
        setProfile({
          name: user.name || '', email: user.email || '', mobile: user.mobile || '',
          dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
          gender: user.gender || '',
          address: { flatNumber: user.address?.flatNumber || '', city: user.address?.city || '', pincode: user.address?.pincode || '' }
        });
      })
      .catch(() => Toastify({ text: "Failed to load profile", className: 'Toastify__toast--error', duration: 3000 }).showToast())
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/profile/${localStorage.getItem('userId')}`, profile);
      localStorage.setItem('userName', res.data.name);
      Toastify({ text: "✅ Profile updated!", className: 'Toastify__toast--success', duration: 3000 }).showToast();
    } catch {
      Toastify({ text: "Update failed", className: 'Toastify__toast--error', duration: 3000 }).showToast();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    try {
      await api.delete(`/profile/${localStorage.getItem('userId')}`);
      Toastify({ text: "Account deleted.", duration: 3000 }).showToast();
      localStorage.clear();
      navigate('/');
    } catch {
      Toastify({ text: "Failed to delete account", className: 'Toastify__toast--error', duration: 3000 }).showToast();
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="client" />

      <main className="l-container" style={{ flex: 1, paddingBlock: 'var(--space-8)' }}>
        <h1 className="u-mb-8">My Profile</h1>

        {loading ? <p>Loading profile...</p> : (
          <div className="profile-layout">
            <aside className="profile-sidebar">
              <div className="avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}</div>
              <h3>{profile.name}</h3>
              <p className="u-mono" style={{color: 'var(--ink-soft)'}}>Client</p>
            </aside>

            <form className="profile-form" onSubmit={handleUpdate}>
              <h2 className="u-mb-6"><i className="fas fa-user"></i> Personal Details</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={profile.name} onChange={e => handleInputChange('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={profile.email} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile</label>
                  <input type="tel" className="form-input" value={profile.mobile} onChange={e => handleInputChange('mobile', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={profile.dob} onChange={e => handleInputChange('dob', e.target.value)} />
                </div>
              </div>

              <h2 className="u-mb-6 u-mt-8"><i className="fas fa-map-marker-alt"></i> Address Details</h2>
              <div className="form-group">
                <label className="form-label">Flat No / House No</label>
                <input type="text" className="form-input" value={profile.address.flatNumber} onChange={e => handleInputChange('address.flatNumber', e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={profile.address.city} onChange={e => handleInputChange('address.city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" className="form-input" value={profile.address.pincode} onChange={e => handleInputChange('address.pincode', e.target.value)} />
                </div>
              </div>

              <div style={{display: 'flex', gap: '16px', marginTop: '32px'}}>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn--danger" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer role="client" />
    </div>
  );
};

export default UserProfile;
