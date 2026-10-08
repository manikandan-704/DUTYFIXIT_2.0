import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const [serviceCategory] = useState(searchParams.get('service') || 'General Service');
  const [subService, setSubService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [locHouseNo, setLocHouseNo] = useState('');
  const [locStreet, setLocStreet] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locPincode, setLocPincode] = useState('');
  const [locLandmark, setLocLandmark] = useState('');
  const [locType, setLocType] = useState('Home');
  const [contact, setContact] = useState('');

  const [workerId, setWorkerId] = useState(searchParams.get('workerId') || '');
  const [workerName, setWorkerName] = useState(searchParams.get('workerName') || '');
  const [workersInCity, setWorkersInCity] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

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

  const timeSlots = [
    { value: '09:00 AM', label: '09:00 AM – 10:00 AM' },
    { value: '10:00 AM', label: '10:00 AM – 11:00 AM' },
    { value: '11:00 AM', label: '11:00 AM – 12:00 PM' },
    { value: '02:00 PM', label: '02:00 PM – 03:00 PM' },
    { value: '03:00 PM', label: '03:00 PM – 04:00 PM' },
    { value: '04:00 PM', label: '04:00 PM – 05:00 PM' },
  ];

  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'client') navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (locCity && !searchParams.get('workerId')) {
      setLoadingWorkers(true);
      api.get('/verification', { params: { status: 'Approved', city: locCity, profession: serviceCategory } })
        .then(res => setWorkersInCity(res.data))
        .catch(() => {})
        .finally(() => setLoadingWorkers(false));
    }
  }, [locCity, searchParams, serviceCategory]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !locCity) {
      Toastify({ text: 'Please fill all required fields.', className: 'Toastify__toast--error', duration: 3000 }).showToast();
      return;
    }

    setSubmitting(true);
    const bookingData = {
      clientName: localStorage.getItem('userName') || 'Guest User',
      clientEmail: localStorage.getItem('userEmail'),
      workerId, workerName, service: serviceCategory, subService,
      date: selectedDate, time: selectedTime, contact,
      location: { houseNo: locHouseNo, street: locStreet, city: locCity, pincode: locPincode, landmark: locLandmark, type: locType }
    };

    try {
      await api.post('/bookings', bookingData);
      Toastify({ text: '✅ Booking confirmed successfully!', className: 'Toastify__toast--success', duration: 3000 }).showToast();
      setTimeout(() => navigate('/mybooking'), 1200);
    } catch {
      Toastify({ text: 'Booking failed.', className: 'Toastify__toast--error', duration: 3000 }).showToast();
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="client" />

      <main className="l-container" style={{ flex: 1, paddingBlock: 'var(--space-8)' }}>
        <h1 className="u-mb-8">Book a Service</h1>

        <div className="booking-layout">
          <form className="booking-form" onSubmit={handleBooking} id="bookingForm">
            
            <div className="booking-section">
              <h2 className="booking-section__title"><i className="fas fa-wrench"></i> Service Details</h2>
              <div className="form-group">
                <label className="form-label">Service Category</label>
                <input type="text" className="form-input" value={serviceCategory} readOnly disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Description (What's wrong?)</label>
                <textarea className="form-textarea" value={subService} onChange={(e) => setSubService(e.target.value)} required placeholder="e.g. Tap leaking in the kitchen"></textarea>
              </div>
            </div>

            <div className="booking-section">
              <h2 className="booking-section__title"><i className="fas fa-calendar-alt"></i> Schedule</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <select className="form-select" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} required>
                    <option value="">Select Time</option>
                    {timeSlots.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="booking-section">
              <h2 className="booking-section__title"><i className="fas fa-map-marker-alt"></i> Location & Contact</h2>
              
              <div className="form-group u-mb-4">
                <label className="form-label">Contact Number</label>
                <input type="tel" className="form-input" value={contact} onChange={e => setContact(e.target.value)} required placeholder="e.g. 9876543210" pattern="[0-9]{10}" />
              </div>

              <div className="form-grid u-mb-4">
                <div className="form-group">
                  <label className="form-label">House/Flat No.</label>
                  <input type="text" className="form-input" value={locHouseNo} onChange={e => setLocHouseNo(e.target.value)} required placeholder="e.g. 104, B Block" />
                </div>
                <div className="form-group">
                  <label className="form-label">Street / Area</label>
                  <input type="text" className="form-input" value={locStreet} onChange={e => setLocStreet(e.target.value)} required placeholder="e.g. MG Road" />
                </div>
              </div>

              <div className="form-grid u-mb-4">
                <div className="form-group">
                  <label className="form-label">Landmark (Optional)</label>
                  <input type="text" className="form-input" value={locLandmark} onChange={e => setLocLandmark(e.target.value)} placeholder="e.g. Near Apollo Hospital" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address Type</label>
                  <select className="form-select" value={locType} onChange={e => setLocType(e.target.value)} required>
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select className="form-select" value={locCity} onChange={e => setLocCity(e.target.value)} required>
                    <option value="">Select City</option>
                    {cities.map((city, idx) => <option key={idx} value={city}>{city}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" className="form-input" value={locPincode} onChange={e => setLocPincode(e.target.value.replace(/[^0-9]/g, ''))} maxLength="6" required />
                </div>
              </div>

              {locCity && !searchParams.get('workerId') && (
                <div className="u-mb-6">
                  <label className="form-label">Available Professionals in {locCity}</label>
                  {loadingWorkers ? <p>Loading...</p> : workersInCity.length === 0 ? <p className="u-mono" style={{color: 'var(--clay-600)'}}>No professionals found.</p> : (
                    <div style={{display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px'}}>
                      {workersInCity.map(w => (
                        <div 
                          key={w._id} 
                          className={`chip ${workerId === w.workerId ? 'chip--active' : ''}`}
                          onClick={() => { setWorkerId(w.workerId); setWorkerName(w.name); }}
                        >
                          {w.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </form>

          {/* Right side summary */}
          <div className="booking-summary u-blueprint-bg">
            <h3 className="u-mb-4" style={{color: 'var(--turmeric-500)'}}>Order Summary</h3>
            <div className="booking-summary__row">
              <span>Service</span>
              <span className="u-mono">{serviceCategory}</span>
            </div>
            {workerName && (
              <div className="booking-summary__row">
                <span>Professional</span>
                <span className="u-mono">{workerName}</span>
              </div>
            )}
            <div className="booking-summary__row">
              <span>Date</span>
              <span className="u-mono">{selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN') : '--'}</span>
            </div>
            <div className="booking-summary__row">
              <span>Time</span>
              <span className="u-mono">{selectedTime || '--'}</span>
            </div>
            <div className="booking-summary__row booking-summary__row--total">
              <span>Inspection Fee</span>
              <span className="u-mono" style={{color: 'var(--turmeric-500)'}}>To be decided</span>
            </div>
            
            <button type="submit" form="bookingForm" className="btn btn--accent u-mt-6" style={{width: '100%'}} disabled={submitting}>
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </div>

      </main>

      <Footer role="client" />
    </div>
  );
};

export default BookingPage;
