import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';

const ProfileBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cityFilter, setCityFilter] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  const service = searchParams.get('service') || 'Service';

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'client') navigate('/login');

    setLoading(true);
    api.get('/bookings/workers-ratings')
      .then(res => { setWorkers(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [navigate]);

  const cities = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
    "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
    "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
    "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
    "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
    "Vellore", "Viluppuram", "Virudhunagar"
  ];

  const getServiceIcon = () => {
    const lower = service.toLowerCase();
    if (lower.includes('plumb')) return 'fa-faucet';
    if (lower.includes('clean')) return 'fa-broom';
    if (lower.includes('elect')) return 'fa-bolt';
    if (lower.includes('paint')) return 'fa-paint-roller';
    if (lower.includes('ac')) return 'fa-snowflake';
    if (lower.includes('carpent')) return 'fa-hammer';
    return 'fa-tools';
  };

  const filteredWorkers = workers.filter(w => w.profession === service && (!cityFilter || w.city === cityFilter)); // I see the original just filtered by profession, but let's assume city filtering is done client side or needs a change. Actually the original filtered only by profession, then checked `cityFilter`. Wait, `!cityFilter` shown on screen meant it forced them to select.

  const handleBookNow = (worker) => {
    navigate(`/booking-page?workerId=${worker.workerId}&workerName=${encodeURIComponent(worker.name)}&service=${encodeURIComponent(service)}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="client" />

      <main style={{ flex: 1 }}>
        <section className="u-blueprint-bg" style={{ padding: 'var(--space-12) 0', backgroundColor: 'var(--teal-900)', color: 'var(--paper)' }}>
          <div className="l-container">
            <h1 className="u-mb-4" style={{ color: 'var(--turmeric-500)' }}>
              <i className={`fas ${getServiceIcon()}`} style={{marginRight: '12px'}}></i>
              {service} Professionals
            </h1>
            
            <div className="form-group" style={{ maxWidth: '400px', flexDirection: 'row', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '0 12px', border: '1px solid var(--teal-700)', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', color: 'var(--ink)' }}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="form-select"
                style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', borderLeft: 'none' }}
              >
                <option value="">Choose your city...</option>
                {cities.map((city, idx) => <option key={idx} value={city}>{city}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="u-ruler-ticks"></div>

        <section className="l-container" style={{ paddingBlock: 'var(--space-12)' }}>
          {!cityFilter ? (
            <div className="u-text-center">
              <i className="fas fa-search u-mb-4" style={{fontSize: '3rem', color: 'var(--line)'}}></i>
              <h3>Find Your Expert</h3>
              <p>Select your city above to discover available {service} professionals.</p>
            </div>
          ) : loading ? (
            <div className="tickets-grid">
              <div className="skeleton skeleton--card"></div>
              <div className="skeleton skeleton--card"></div>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="u-text-center">
              <i className="fas fa-user-slash u-mb-4" style={{fontSize: '3rem', color: 'var(--line)'}}></i>
              <h3>No Professionals Found</h3>
              <p>We couldn't find any pros in {cityFilter} right now.</p>
            </div>
          ) : (
            <div className="tickets-grid">
              {filteredWorkers.map(worker => (
                <div key={worker._id} className="ticket">
                  <div className="ticket__header">
                    <span className="ticket__id">{worker.isVerified ? 'VERIFIED' : 'PRO'}</span>
                    <span className="badge badge--accepted"><i className="fas fa-star" style={{marginRight: '4px'}}></i> {worker.rating !== 'N/A' ? worker.rating : 'New'}</span>
                  </div>
                  <div className="ticket__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div className="avatar" style={{ margin: 0, width: '48px', height: '48px', fontSize: '1.25rem' }}>
                      {worker.profilePhoto ? <img src={worker.profilePhoto} alt={worker.name} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{margin: 0}}>{worker.name}</h3>
                      <p className="u-mono" style={{fontSize: '0.875rem', color: 'var(--ink-soft)'}}>{worker.jobsDone} Jobs Done</p>
                    </div>
                  </div>
                  <div className="ticket__footer">
                    <button className="btn btn--accent" onClick={() => handleBookNow(worker)} style={{width: '100%'}}>
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer role="client" />
    </div>
  );
};

export default ProfileBooking;
