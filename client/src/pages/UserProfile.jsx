import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const api = axios.create({ baseURL: '/api' });

const UserProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        mobile: '',
        dob: '',
        gender: '',
        address: {
            flatNumber: '',
            city: '',
            pincode: ''
        }
    });

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const role = localStorage.getItem('userRole');

        if (!userId || role !== 'client') {
            navigate('/login');
            return;
        }

        fetchProfile(userId);
    }, [navigate]);

    const fetchProfile = async (id) => {
        try {
            const res = await api.get(`/profile/${id}`);
            const user = res.data;
            setProfile({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || '',
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                gender: user.gender || '',
                address: {
                    flatNumber: user.address?.flatNumber || '',
                    city: user.address?.city || '',
                    pincode: user.address?.pincode || ''
                }
            });
        } catch (err) {
            console.error("Error fetching profile", err);
            Toastify({ text: "Failed to load profile", style: { background: "#ef4444" } }).showToast();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        const userId = localStorage.getItem('userId');

        try {
            const res = await api.put(`/profile/${userId}`, profile);
            const updatedUser = res.data;
            localStorage.setItem('userName', updatedUser.name);
            Toastify({ text: "✅ Profile updated!", style: { background: "#10b981" } }).showToast();
        } catch (err) {
            console.error("Error updating profile", err);
            Toastify({ text: "Update failed", style: { background: "#ef4444" } }).showToast();
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
        const userId = localStorage.getItem('userId');
        try {
            await api.delete(`/profile/${userId}`);
            Toastify({ text: "Account deleted.", style: { background: "#6b7280" } }).showToast();
            localStorage.clear();
            navigate('/');
        } catch (err) {
            Toastify({ text: "Failed to delete account", style: { background: "#ef4444" } }).showToast();
        }
    };

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setProfile(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setProfile(prev => ({ ...prev, [field]: value }));
        }
    };

    if (loading) return <div className="loading-container">Loading your profile...</div>;

    return (
        <>
            <Navbar role="client" />

            <main>
                <div className="profile-container">
                    <div className="profile-header">
                        <div className="profile-avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}</div>
                        <div className="profile-info">
                            <h1>{profile.name || 'Loading...'}</h1>
                            <p>Client Profile</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate}>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label className="form-label">Full Name</label>
                                <input 
                                    type="text" className="profile-form-input" value={profile.name} 
                                    onChange={e => handleInputChange('name', e.target.value)} required 
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="profile-form-input" value={profile.email} disabled />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mobile Number</label>
                                <input 
                                    type="tel" className="profile-form-input" value={profile.mobile}
                                    onChange={e => handleInputChange('mobile', e.target.value)}
                                    placeholder="10-digit mobile number"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input 
                                    type="date" className="profile-form-input" value={profile.dob}
                                    onChange={e => handleInputChange('dob', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select 
                                    className="profile-form-input" value={profile.gender}
                                    onChange={e => handleInputChange('gender', e.target.value)}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="address-group">
                                <div className="address-title"><i className="fas fa-map-marker-alt"></i> Address Details</div>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label className="form-label">Flat No / House No / Building</label>
                                        <input 
                                            type="text" className="profile-form-input" value={profile.address.flatNumber}
                                            onChange={e => handleInputChange('address.flatNumber', e.target.value)}
                                            placeholder="e.g. Flat 402, Sunshine Apts"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input 
                                            type="text" className="profile-form-input" value={profile.address.city}
                                            onChange={e => handleInputChange('address.city', e.target.value)}
                                            placeholder="e.g. Chennai"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Pincode</label>
                                        <input 
                                            type="text" className="profile-form-input" value={profile.address.pincode}
                                            onChange={e => handleInputChange('address.pincode', e.target.value)}
                                            placeholder="e.g. 600001"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
                                <i className="fas fa-trash-alt"></i> Delete Account
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </>
    );
};

export default UserProfile;
