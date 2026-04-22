import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ProfileBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cityFilter, setCityFilter] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  const service = searchParams.get('service') || 'Service';

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'client') {
      navigate('/login');
    }

    setLoading(true);
    api.get('/bookings/workers-ratings')
      .then(res => {
        setWorkers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed fetching workers", err);
        setLoading(false);
      });
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

  const filteredWorkers = workers.filter(w => w.profession === service);

  const handleBookNow = (worker) => {
    navigate(`/booking-page?workerId=${worker.workerId}&service=${encodeURIComponent(service)}`);
  };

  const renderStars = (rating) => {
    const numRating = parseFloat(rating) || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(numRating)) {
        stars.push(<i key={i} className="fas fa-star pb-star-filled"></i>);
      } else if (i - 0.5 <= numRating) {
        stars.push(<i key={i} className="fas fa-star-half-alt pb-star-filled"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star pb-star-empty"></i>);
      }
    }
    return stars;
  };

  return (
    <>
      <Navbar role="client" />

      <main className="pb-main">
        {/* Hero Banner */}
        <div className="pb-hero">
          <div className="pb-hero-pattern"></div>
          <div className="pb-hero-content">
            <div className="pb-hero-icon">
              <i className={`fas ${getServiceIcon()}`}></i>
            </div>
            <h1 className="pb-hero-title">Professional {service}</h1>
            <p className="pb-hero-subtitle">
              Verified experts in your area — book with confidence
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pb-filter-bar">
          <div className="pb-filter-inner">
            <div className="pb-filter-label">
              <i className="fas fa-map-marker-alt"></i>
              <span>Select Location</span>
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pb-city-select"
              id="city-filter-select"
            >
              <option value="">Choose your city...</option>
              {cities.map((city, idx) => (
                <option key={idx} value={city}>{city}</option>
              ))}
            </select>
            {cityFilter && (
              <button className="pb-clear-filter" onClick={() => setCityFilter('')}>
                <i className="fas fa-times"></i> Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="pb-results-section">
          {!cityFilter ? (
            <div className="pb-empty-state">
              <div className="pb-empty-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>Find Your Expert</h3>
              <p>Select your city above to discover available <strong>{service}</strong> professionals near you.</p>
            </div>
          ) : loading ? (
            <div className="pb-loading-state">
              <div className="pb-spinner"></div>
              <p>Searching for professionals in <strong>{cityFilter}</strong>…</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="pb-empty-state">
              <div className="pb-empty-icon pb-empty-icon--warning">
                <i className="fas fa-user-slash"></i>
              </div>
              <h3>No Professionals Found</h3>
              <p>We couldn't find any <strong>{service}</strong> pros in <strong>{cityFilter}</strong> right now. Please check back later or try a different city.</p>
            </div>
          ) : (
            <>
              <div className="pb-results-header">
                <h2>
                  <i className="fas fa-users"></i>
                  {filteredWorkers.length} {service} Professional{filteredWorkers.length !== 1 ? 's' : ''} in {cityFilter}
                </h2>
              </div>
              <div className="pb-workers-grid">
                {filteredWorkers.map(worker => (
                  <div key={worker._id} className="pb-worker-card" id={`worker-${worker.workerId}`}>
                    <div className="pb-worker-card-header">
                      <div className="pb-worker-avatar">
                        {worker.profilePhoto ? (
                          <img src={worker.profilePhoto} alt={worker.name} />
                        ) : (
                          <span>{worker.name.charAt(0).toUpperCase()}</span>
                        )}
                        {worker.isVerified && (
                          <div className="pb-verified-badge" title="Verified Professional">
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                      </div>

                      <div className="pb-worker-info">
                        <h3 className="pb-worker-name">{worker.name}</h3>
                        <p className="pb-worker-profession">
                          <i className={`fas ${getServiceIcon()}`}></i> {worker.profession}
                        </p>
                      </div>
                    </div>

                    <div className="pb-worker-stats">
                      <div className="pb-stat">
                        <div className="pb-stat-value">
                          <div className="pb-stars">{renderStars(worker.rating)}</div>
                          <span className="pb-rating-num">{worker.rating !== 'N/A' ? worker.rating : '—'}</span>
                        </div>
                        <div className="pb-stat-label">Rating</div>
                      </div>
                      <div className="pb-stat-divider"></div>
                      <div className="pb-stat">
                        <div className="pb-stat-value">
                          <span className="pb-jobs-num">{worker.jobsDone}</span>
                        </div>
                        <div className="pb-stat-label">Jobs Done</div>
                      </div>
                    </div>

                    <button
                      className="pb-book-btn"
                      onClick={() => handleBookNow(worker)}
                      id={`book-${worker.workerId}`}
                    >
                      <i className="fas fa-calendar-check"></i> Book Now
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer role="client" />
    </>
  );
};

export default ProfileBooking;
