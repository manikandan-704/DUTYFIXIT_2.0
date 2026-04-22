import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const BookingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [serviceCategory, setServiceCategory] = useState(searchParams.get('service') || 'General Service');
    const [subService, setSubService] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    // Address Details
    const [locHouseNo, setLocHouseNo] = useState('');
    const [locStreet, setLocStreet] = useState('');
    const [locCity, setLocCity] = useState('');
    const [locPincode, setLocPincode] = useState('');
    const [locLandmark, setLocLandmark] = useState('');
    const [contact, setContact] = useState('');
    const [locType, setLocType] = useState('Home');
    
    // Worker Selection
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
        const role = localStorage.getItem('userRole');
        if (role !== 'client') {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (locCity && !searchParams.get('workerId')) {
            fetchWorkersForCity(locCity);
        }
    }, [locCity]);

    const fetchWorkersForCity = async (city) => {
        setLoadingWorkers(true);
        try {
            const res = await api.get('/verification', {
                params: { status: 'Approved', city, profession: serviceCategory }
            });
            setWorkersInCity(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingWorkers(false);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!selectedDate || !selectedTime) {
            Toastify({ text: 'Please select a date and time slot.', style: { background: '#ef4444' } }).showToast();
            return;
        }
        if (!locCity) {
            Toastify({ text: 'Please select your city.', style: { background: '#ef4444' } }).showToast();
            return;
        }

        setSubmitting(true);

        const bookingData = {
            clientName: localStorage.getItem('userName') || 'Guest User',
            clientEmail: localStorage.getItem('userEmail'),
            workerId: workerId,
            workerName: workerName,
            service: serviceCategory,
            subService: subService,
            date: selectedDate,
            time: selectedTime,
            contact: contact,
            location: {
                houseNo: locHouseNo,
                street: locStreet,
                city: locCity,
                pincode: locPincode,
                landmark: locLandmark,
                type: locType
            }
        };

        try {
            await api.post('/bookings', bookingData);
            Toastify({ text: '✅ Booking confirmed successfully!', style: { background: '#10b981' }, duration: 3000 }).showToast();
            setTimeout(() => navigate('/mybooking'), 1200);
        } catch (error) {
            console.error('Booking failed', error);
            Toastify({ text: 'Booking failed. Please try again.', style: { background: '#ef4444' } }).showToast();
            setSubmitting(false);
        }
    };

    return (
        <div className="bk-page-wrapper">
            <Navbar role="client" />

            <main className="bk-main">
                <div className="bk-progress-bar">
                    <div className="bk-progress-step bk-step-done">
                        <div className="bk-step-circle"><i className="fas fa-check"></i></div>
                        <span>Select Pro</span>
                    </div>
                    <div className="bk-progress-line bk-line-done"></div>
                    <div className="bk-progress-step bk-step-active">
                        <div className="bk-step-circle">2</div>
                        <span>Book Service</span>
                    </div>
                    <div className="bk-progress-line"></div>
                    <div className="bk-progress-step">
                        <div className="bk-step-circle">3</div>
                        <span>Confirmed</span>
                    </div>
                </div>

                <form className="bk-form-card" onSubmit={handleBooking}>
                    <h1 className="bk-form-title">
                        <i className="fas fa-clipboard-list"></i> Book a Service
                    </h1>

                    {workerName && (
                        <div className="bk-selected-worker-box">
                             <div className="bk-worker-avatar-mini">
                                {workerName.charAt(0).toUpperCase()}
                             </div>
                             <div className="bk-worker-info-mini">
                                <span className="bk-mini-label">Selected Professional</span>
                                <h4 className="bk-mini-name">{workerName}</h4>
                             </div>
                             <div className="bk-verified-badge">
                                <i className="fas fa-check-circle"></i> Verified
                             </div>
                        </div>
                    )}

                    <div className="bk-section">
                        <div className="bk-section-header">
                            <i className="fas fa-wrench"></i> Service Details
                        </div>
                        <div className="bk-grid-2">
                            <div className="bk-field">
                                <label className="bk-label">Service Category</label>
                                <input type="text" className="bk-input bk-input--readonly" value={serviceCategory} readOnly required />
                            </div>
                            <div className="bk-field">
                                <label className="bk-label">Description (What's wrong?)</label>
                                <textarea
                                    className="bk-textarea"
                                    maxLength="100"
                                    rows="2"
                                    placeholder="e.g., Tap leaking, Need fan installation..."
                                    value={subService}
                                    onChange={(e) => setSubService(e.target.value)}
                                    required
                                ></textarea>
                                <small className="bk-char-count">{subService.length}/100</small>
                            </div>
                        </div>
                    </div>

                    <div className="bk-section">
                        <div className="bk-section-header">
                            <i className="fas fa-calendar-alt"></i> Schedule
                        </div>
                        <div className="bk-grid-2">
                            <div className="bk-field">
                                <label className="bk-label">Preferred Date</label>
                                <input type="date" className="bk-input" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required />
                            </div>
                            <div className="bk-field">
                                <label className="bk-label">Time Slot</label>
                                <select className="bk-input" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} required>
                                    <option value="">Select Time Slot</option>
                                    {timeSlots.map(slot => (
                                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bk-section">
                        <div className="bk-section-header">
                            <i className="fas fa-map-marker-alt"></i> Location Details
                        </div>

                        <div className="bk-grid-2">
                            <div className="bk-field">
                                <label className="bk-label">City (District)</label>
                                <select className="bk-input" value={locCity} onChange={e => setLocCity(e.target.value)} required>
                                    <option value="">Select District</option>
                                    {cities.map((city, idx) => (
                                        <option key={idx} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="bk-field">
                                <label className="bk-label">Pincode</label>
                                <input type="text" className="bk-input" placeholder="600001" pattern="[0-9]{6}" maxLength="6" value={locPincode} onChange={e => setLocPincode(e.target.value.replace(/[^0-9]/g, ''))} required />
                            </div>
                        </div>

                        {locCity && !workerId && (
                            <div className="bk-worker-selection-area">
                                <h3 className="bk-selection-title">Select Professional in {locCity}</h3>
                                {loadingWorkers ? (
                                    <p className="bk-loading-text">Finding professionals...</p>
                                ) : workersInCity.length > 0 ? (
                                    <div className="bk-worker-grid-mini">
                                        {workersInCity.map(w => (
                                            <div 
                                                key={w._id} 
                                                className={`bk-mini-worker-card ${workerId === w._id ? 'bk-active' : ''}`}
                                                onClick={() => { setWorkerId(w._id); setWorkerName(w.name); }}
                                            >
                                                <div className="bk-mini-avatar">
                                                    {w.profilePhotoData ? <img src={w.profilePhotoData} alt={w.name} /> : w.name[0]}
                                                </div>
                                                <div className="bk-mini-details">
                                                    <span className="bk-mini-name">{w.name}</span>
                                                    <span className="bk-mini-rating"><i className="fas fa-star"></i> {w.rating || '5.0'}</span>
                                                </div>
                                                {workerId === w._id && <i className="fas fa-check-circle bk-check"></i>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="bk-empty-text">No professionals found in this city. You can still book, and we'll assign one!</p>
                                )}
                            </div>
                        )}

                        <div className="bk-grid-2">
                            <div className="bk-field">
                                <label className="bk-label">House / Flat No.</label>
                                <input type="text" className="bk-input" placeholder="No. 123" value={locHouseNo} onChange={e => setLocHouseNo(e.target.value)} required />
                            </div>
                            <div className="bk-field">
                                <label className="bk-label">Street / Area</label>
                                <input type="text" className="bk-input" placeholder="Main Street" value={locStreet} onChange={e => setLocStreet(e.target.value)} required />
                            </div>
                        </div>

                        <div className="bk-grid-2">
                            <div className="bk-field">
                                <label className="bk-label">Landmark</label>
                                <input type="text" className="bk-input" placeholder="Optional" value={locLandmark} onChange={e => setLocLandmark(e.target.value)} />
                            </div>
                            <div className="bk-field">
                                <label className="bk-label">Contact Number</label>
                                <input type="tel" className="bk-input" placeholder="9876543210" pattern="[0-9]{10}" maxLength="10" value={contact} onChange={e => setContact(e.target.value.replace(/[^0-9]/g, ''))} required />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="bk-submit-btn" disabled={submitting}>
                        {submitting ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                </form>
            </main>

            <Footer role="client" />
        </div>
    );
};

export default BookingPage;
