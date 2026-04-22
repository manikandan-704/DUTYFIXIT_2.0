import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Toastify from 'toastify-js';

const toast = (text, bg = '#10b981') =>
    Toastify({ text, style: { background: bg }, duration: 3000, gravity: 'top', position: 'right' }).showToast();

/* ── Helpers ── */
const StatusBadge = ({ status }) => {
    const map = {
        Pending: 'pending', pending: 'pending',
        Approved: 'approved', approved: 'approved', Accepted: 'approved', accepted: 'approved',
        Rejected: 'rejected', rejected: 'rejected', Cancelled: 'rejected', cancelled: 'rejected',
        Completed: 'completed', completed: 'completed',
    };
    return <span className={`status-badge ${map[status] || 'pending'}`}>{status}</span>;
};

const Avatar = ({ name, photo, size = 32 }) => (
    photo
        ? <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{
            width: size, height: size, borderRadius: '50%',
            background: '#e2e8f0', color: '#475569', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.35, fontWeight: 700, flexShrink: 0
        }}>
            {name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
        </div>
);

const Stars = ({ rating }) => {
    const r = parseFloat(rating) || 0;
    return (
        <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
            {'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))} <span style={{ color: '#64748b' }}>({rating})</span>
        </span>
    );
};

const EmptyRow = ({ cols, message }) => (
    <tr><td colSpan={cols} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
        {message}
    </td></tr>
);

/* ── Main Component ── */
const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState({});

    // Data state
    const [stats, setStats] = useState({});
    const [bookings, setBookings] = useState(null);
    const [verifications, setVerifications] = useState(null);
    const [workers, setWorkers] = useState(null);
    const [customers, setCustomers] = useState(null);
    const [reviews, setReviews] = useState(null);

    // Filter state
    const [bookingFilter, setBookingFilter] = useState('All');
    const [workerFilter, setWorkerFilter] = useState('All');
    const [searchQ, setSearchQ] = useState('');

    const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

    // Lazy loaders — only fetch when first needed, then cache
    const fetchStats = useCallback(async () => {
        if (stats.totalBookings !== undefined) return;
        try {
            setLoad('stats', true);
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch { toast('Failed to load stats', '#ef4444'); }
        finally { setLoad('stats', false); }
    }, [stats]);

    const fetchBookings = useCallback(async () => {
        if (bookings !== null) return;
        try {
            setLoad('bookings', true);
            const res = await api.get('/bookings/all');
            setBookings(res.data);
        } catch { toast('Failed to load bookings', '#ef4444'); }
        finally { setLoad('bookings', false); }
    }, [bookings]);

    const fetchVerifications = useCallback(async () => {
        if (verifications !== null) return;
        try {
            const res = await api.get('/verification');
            setVerifications(res.data);
        } catch { toast('Failed to load verifications', '#ef4444'); }
    }, [verifications]);

    const fetchWorkers = useCallback(async () => {
        if (workers !== null) return;
        try {
            setLoad('workers', true);
            const [wRes, vRes] = await Promise.all([
                api.get('/admin/workers'),
                verifications === null ? api.get('/verification') : Promise.resolve({ data: verifications })
            ]);
            setWorkers(wRes.data);
            if (verifications === null) setVerifications(vRes.data);
        } catch { toast('Failed to load workers', '#ef4444'); }
        finally { setLoad('workers', false); }
    }, [workers, verifications]);

    const fetchCustomers = useCallback(async () => {
        if (customers !== null) return;
        try {
            setLoad('customers', true);
            const res = await api.get('/admin/customers');
            setCustomers(res.data);
        } catch { toast('Failed to load customers', '#ef4444'); }
        finally { setLoad('customers', false); }
    }, [customers]);

    const fetchReviews = useCallback(async () => {
        if (reviews !== null) return;
        try {
            setLoad('reviews', true);
            const res = await api.get('/admin/reviews');
            setReviews(res.data);
        } catch { toast('Failed to load reviews', '#ef4444'); }
        finally { setLoad('reviews', false); }
    }, [reviews]);

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === 'dashboard') { fetchStats(); fetchBookings(); }
        else if (activeTab === 'bookings') fetchBookings();
        else if (activeTab === 'workers') fetchWorkers();
        else if (activeTab === 'customers') fetchCustomers();
        else if (activeTab === 'reviews') fetchReviews();
    }, [activeTab, fetchStats, fetchBookings, fetchWorkers, fetchCustomers, fetchReviews]);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') navigate('/login');
    }, [navigate]);

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    /* ── Verification Actions ── */
    const handleVerification = async (id, status) => {
        try {
            await api.put(`/verification/${id}`, { status });
            setVerifications(prev => prev.map(r => r._id === id ? { ...r, status } : r));
            // Update stats counter
            setStats(prev => ({
                ...prev,
                pendingVerifications: Math.max(0, (prev.pendingVerifications || 0) - 1)
            }));
            toast(`Worker ${status} successfully!`);
        } catch {
            toast('Action failed', '#ef4444');
        }
    };

    /* ── Delete Actions ── */
    const deleteCustomer = async (id) => {
        if (!window.confirm('Delete this customer?')) return;
        try {
            await api.delete(`/admin/customers/${id}`);
            setCustomers(prev => prev.filter(c => c._id !== id));
            toast('Customer removed');
        } catch {
            toast('Delete failed', '#ef4444');
        }
    };

    const deleteWorker = async (id) => {
        if (!window.confirm('Delete this worker?')) return;
        try {
            await api.delete(`/admin/workers/${id}`);
            setWorkers(prev => prev.filter(w => w._id !== id));
            toast('Worker removed');
        } catch {
            toast('Delete failed', '#ef4444');
        }
    };

    /* ── Filtered Data ── */
    const filteredBookings = (bookings || []).filter(b => {
        const matchStatus = bookingFilter === 'All' || b.status === bookingFilter;
        const matchSearch = !searchQ || [b.clientName, b.service, b.workerName, b.bookingId]
            .some(f => f?.toLowerCase().includes(searchQ.toLowerCase()));
        return matchStatus && matchSearch;
    });

    const filteredWorkers = (workers || []).filter(w => {
        const matchStatus = workerFilter === 'All' || w.verificationStatus === workerFilter;
        const matchSearch = !searchQ || [w.name, w.email, w.profession, w.city]
            .some(f => f?.toLowerCase().includes(searchQ.toLowerCase()));
        return matchStatus && matchSearch;
    });

    const filteredCustomers = (customers || []).filter(c =>
        !searchQ || [c.name, c.email, c.mobile].some(f => f?.toLowerCase().includes(searchQ.toLowerCase()))
    );

    const navItems = [
        { id: 'dashboard', icon: 'fas fa-th-large', label: 'Dashboard' },
        { id: 'bookings', icon: 'fas fa-calendar-check', label: 'Bookings', count: stats.totalBookings },
        { id: 'workers', icon: 'fas fa-hard-hat', label: 'Workers', count: stats.pendingVerifications },
        { id: 'customers', icon: 'fas fa-users', label: 'Customers', count: stats.totalCustomers },
        { id: 'reviews', icon: 'fas fa-star', label: 'Reviews', count: (reviews || []).length },
    ];

    return (
        <div className="admin-body">
            {/* Top Bar */}
            <nav className="admin-topbar">
                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <i className="fas fa-bars" />
                </button>
                <div className="logo-container" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
                    <i className="fas fa-tools logo-icon" />
                    <span className="logo-text">DutyFixIT Admin</span>
                </div>

                <div className="admin-top-links">
                    {navItems.slice(0, 4).map(item => (
                        <a key={item.id} href="#" className={`top-link ${activeTab === item.id ? 'active' : ''}`}
                            onClick={e => { e.preventDefault(); setActiveTab(item.id); }}>
                            {item.label}
                            {item.count > 0 && <span style={{
                                background: '#ef4444', color: 'white', borderRadius: '99px',
                                fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginLeft: '0.35rem'
                            }}>{item.count}</span>}
                        </a>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="admin-badge">Admin</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt" /> Logout
                    </button>
                </div>
            </nav>

            <div className="admin-layout">
                {/* Sidebar */}
                <aside className={`admin-sidebar ${mobileMenuOpen ? 'active' : ''}`}>
                    <ul className="sidebar-menu">
                        {navItems.map(item => (
                            <li key={item.id}
                                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); setSearchQ(''); }}>
                                <i className={item.icon} />
                                <span>{item.label}</span>
                                {item.count > 0 && (
                                    <span style={{
                                        marginLeft: 'auto', background: '#ef4444', color: 'white',
                                        borderRadius: '99px', fontSize: '0.65rem', padding: '0.1rem 0.4rem'
                                    }}>{item.count}</span>
                                )}
                            </li>
                        ))}
                        <li className="menu-item text-red" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt" /><span>Logout</span>
                        </li>
                    </ul>
                </aside>

                {/* Main Content */}
                <main className="admin-main">

                    {/* ── DASHBOARD ── */}
                    {activeTab === 'dashboard' && (
                        <div>
                            <div className="page-header">
                                <h2>Dashboard Overview</h2>
                                <span className="date-badge">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>

                            <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                                {[
                                    { icon: 'fas fa-calendar-check', color: 'blue', label: 'Total Bookings', value: stats.totalBookings ?? '—' },
                                    { icon: 'fas fa-clock', color: 'orange', label: 'Pending Jobs', value: stats.pendingBookings ?? '—' },
                                    { icon: 'fas fa-check-double', color: 'green', label: 'Completed', value: stats.completedBookings ?? '—' },
                                    { icon: 'fas fa-hard-hat', color: 'blue', label: 'Total Workers', value: stats.totalWorkers ?? '—' },
                                    { icon: 'fas fa-shield-alt', color: 'green', label: 'Verified Workers', value: stats.verifiedWorkers ?? '—' },
                                    { icon: 'fas fa-users', color: 'orange', label: 'Customers', value: stats.totalCustomers ?? '—' },
                                ].map((kpi, i) => (
                                    <div key={i} className="kpi-card">
                                        <div className={`kpi-icon ${kpi.color}`}><i className={kpi.icon} /></div>
                                        <div className="kpi-info">
                                            <h3>{kpi.label}</h3>
                                            <p className="kpi-value">{loading.stats ? '...' : kpi.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pending Verifications Alert */}
                            {stats.pendingVerifications > 0 && (
                                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <i className="fas fa-exclamation-circle" style={{ color: '#f97316', fontSize: '1.25rem' }} />
                                        <span style={{ fontWeight: 600, color: '#9a3412' }}>
                                            {stats.pendingVerifications} worker verification{stats.pendingVerifications > 1 ? 's' : ''} awaiting review
                                        </span>
                                    </div>
                                    <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                        onClick={() => setActiveTab('workers')}>
                                        Review Now
                                    </button>
                                </div>
                            )}

                            {/* Recent Bookings */}
                            <div className="table-card">
                                <div className="card-header">
                                    <h3>Recent Bookings</h3>
                                    <span className="view-all" onClick={() => setActiveTab('bookings')}>View All →</span>
                                </div>
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Worker</th><th>Date</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {(bookings || []).slice(0, 6).map(b => (
                                                <tr key={b._id}>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.bookingId}</td>
                                                    <td>{b.clientName}</td>
                                                    <td>{b.service}</td>
                                                    <td>{b.workerName || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                                                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                                                    <td><StatusBadge status={b.status} /></td>
                                                </tr>
                                            ))}
                                            {(bookings || []).length === 0 && <EmptyRow cols={6} message="No bookings yet." />}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── BOOKINGS ── */}
                    {activeTab === 'bookings' && (
                        <div>
                            <div className="page-header">
                                <h2><i className="fas fa-calendar-check" style={{ marginRight: '0.5rem' }} />All Bookings</h2>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{filteredBookings.length} of {(bookings || []).length}</span>
                            </div>

                            {/* Filters */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                    <i className="fas fa-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input className="form-input" style={{ padding: '0.6rem 1rem 0.6rem 2.25rem' }}
                                        placeholder="Search by customer, service, booking ID..."
                                        value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                                </div>
                                {['All', 'Pending', 'Accepted', 'Completed', 'Rejected', 'Cancelled'].map(s => (
                                    <button key={s} onClick={() => setBookingFilter(s)}
                                        style={{
                                            padding: '0.45rem 0.875rem', borderRadius: '99px', border: '1.5px solid',
                                            borderColor: bookingFilter === s ? '#0f172a' : '#e2e8f0',
                                            background: bookingFilter === s ? '#0f172a' : 'white',
                                            color: bookingFilter === s ? 'white' : '#64748b',
                                            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
                                        }}>{s}</button>
                                ))}
                            </div>

                            <div className="table-card">
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Worker</th><th>Date & Time</th><th>City</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {filteredBookings.map(b => (
                                                <tr key={b._id}>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{b.bookingId}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{b.clientName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.clientEmail}</div>
                                                    </td>
                                                    <td>
                                                        <div>{b.service}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.subService}</div>
                                                    </td>
                                                    <td>{b.workerName || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                                                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        <div>{b.date}</div>
                                                        <div>{b.time}</div>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>{b.location?.city || '—'}</td>
                                                    <td><StatusBadge status={b.status} /></td>
                                                </tr>
                                            ))}
                                            {filteredBookings.length === 0 && <EmptyRow cols={7} message="No bookings match your filters." />}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── WORKERS ── */}
                    {activeTab === 'workers' && (
                        <div>
                            <div className="page-header">
                                <h2><i className="fas fa-hard-hat" style={{ marginRight: '0.5rem' }} />Workers & Verification</h2>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{filteredWorkers.length} workers</span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                    <i className="fas fa-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input className="form-input" style={{ padding: '0.6rem 1rem 0.6rem 2.25rem' }}
                                        placeholder="Search by name, email, profession, city..."
                                        value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                                </div>
                                {['All', 'Pending', 'Approved', 'Rejected', 'Not Submitted'].map(s => (
                                    <button key={s} onClick={() => setWorkerFilter(s)}
                                        style={{
                                            padding: '0.45rem 0.875rem', borderRadius: '99px', border: '1.5px solid',
                                            borderColor: workerFilter === s ? '#0f172a' : '#e2e8f0',
                                            background: workerFilter === s ? '#0f172a' : 'white',
                                            color: workerFilter === s ? 'white' : '#64748b',
                                            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
                                        }}>{s}</button>
                                ))}
                            </div>

                            <div className="table-card">
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead><tr><th>Worker</th><th>Profession</th><th>City</th><th>Contact</th><th>Jobs Done</th><th>Rating</th><th>Verify Status</th><th>Certificate</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {filteredWorkers.map(w => (
                                                <tr key={w._id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                            <Avatar name={w.name} photo={w.profilePhotoData} size={36} />
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{w.name}</div>
                                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{w.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{w.profession || '—'}</td>
                                                    <td>{w.city || '—'}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>{w.mobile || '—'}</td>
                                                    <td style={{ textAlign: 'center' }}>{w.completedJobs ?? 0}</td>
                                                    <td><Stars rating={w.avgRating} /></td>
                                                    <td><StatusBadge status={w.verificationStatus} /></td>
                                                    <td>
                                                        {/* Certificate from verification collection */}
                                                        {(verifications || []).find(v => v.email === w.email)?.certificateData ? (
                                                            <button className="view-cert-btn" onClick={() => {
                                                                const cert = (verifications || []).find(v => v.email === w.email)?.certificateData;
                                                                const win = window.open('');
                                                                win.document.write(`<img src="${cert}" style="max-width:100%"/>`);
                                                            }}>View</button>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>}
                                                    </td>
                                                    <td>
                                                        {w.verificationStatus === 'Pending' && (
                                                            <div className="admin-actions">
                                                                <button className="approve-icon-btn" title="Approve"
                                                                    onClick={() => {
                                                                        const ver = (verifications || []).find(v => v.email === w.email);
                                                                        if (ver) handleVerification(ver._id, 'Approved');
                                                                    }}>
                                                                    <i className="fas fa-check" />
                                                                </button>
                                                                <button className="reject-icon-btn" title="Reject"
                                                                    onClick={() => {
                                                                        const ver = (verifications || []).find(v => v.email === w.email);
                                                                        if (ver) handleVerification(ver._id, 'Rejected');
                                                                    }}>
                                                                    <i className="fas fa-times" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <button onClick={() => deleteWorker(w._id)}
                                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', marginTop: w.verificationStatus === 'Pending' ? '0.35rem' : 0 }}>
                                                            <i className="fas fa-trash" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredWorkers.length === 0 && <EmptyRow cols={9} message="No workers found." />}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CUSTOMERS ── */}
                    {activeTab === 'customers' && (
                        <div>
                            <div className="page-header">
                                <h2><i className="fas fa-users" style={{ marginRight: '0.5rem' }} />Customers</h2>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{filteredCustomers.length} registered</span>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '420px' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input className="form-input" style={{ padding: '0.6rem 1rem 0.6rem 2.25rem' }}
                                    placeholder="Search customers..."
                                    value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                            </div>

                            <div className="table-card">
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead><tr><th>Customer</th><th>Contact</th><th>City</th><th>Joined</th><th>Total Bookings</th><th>Last Service</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {filteredCustomers.map(c => (
                                                <tr key={c._id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                            <Avatar name={c.name} size={36} />
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>{c.mobile || '—'}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{c.address?.city || '—'}</td>
                                                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.bookingCount ?? 0}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{c.lastService || <span style={{ color: '#94a3b8' }}>None</span>}</td>
                                                    <td>
                                                        <button onClick={() => deleteCustomer(c._id)}
                                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer' }}>
                                                            <i className="fas fa-trash" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredCustomers.length === 0 && <EmptyRow cols={7} message="No customers found." />}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── REVIEWS ── */}
                    {activeTab === 'reviews' && (
                        <div>
                            <div className="page-header">
                                <h2><i className="fas fa-star" style={{ marginRight: '0.5rem' }} />Customer Reviews</h2>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{reviews.length} reviews</span>
                            </div>

                            {reviews.length === 0 ? (
                                <div className="table-card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⭐</div>
                                    <p>No reviews yet. Reviews appear after customers complete and rate a booking.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {reviews.map(r => (
                                        <div key={r._id} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.clientName}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.service}</div>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                                            </div>
                                            <Stars rating={r.rating} />
                                            <p style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.5, fontStyle: 'italic' }}>
                                                "{r.feedback}"
                                            </p>
                                            {r.workerName && (
                                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                                                    <i className="fas fa-hard-hat" style={{ marginRight: '0.35rem' }} />{r.workerName}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default AdminPage;
