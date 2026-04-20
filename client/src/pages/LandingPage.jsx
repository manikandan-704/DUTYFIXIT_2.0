import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <header className="header">
                <img src="/images/logo.jpg" alt="DutyFix IT" className="logo-image" />
                <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="auth-container" title="Login / Sign Up">
                    <span className="auth-text">Login / Sign Up</span>
                    <div className="account-container">
                        <svg className="account-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </a>
            </header>

            <main>
                <div className="hero-container">
                    <h1 className="company-tagline">Expert home services you can trust.</h1>
                    <p className="company-description">DutyFixit provides fast, reliable, and professional maintenance solutions tailored to your needs.</p>
                </div>

                <section className="services-section">
                    <div className="services-grid">
                        <div className="service-card">
                            <img src="/images/carpenter.jpg" alt="carpenter" className="service-image" />
                            <div className="service-info">
                                <h3 className="service-title">Carpenter</h3>
                                <p className="service-desc">Skilled technicians ready to handle electrical, plumbing, and mechanical repairs with precision.</p>
                            </div>
                        </div>

                        <div className="service-card">
                            <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2669&auto=format&fit=crop" alt="Electrician working" className="service-image" />
                            <div className="service-info">
                                <h3 className="service-title">Electrical Services</h3>
                                <p className="service-desc">Certified electricians ensuring your home's safety and power efficiency.</p>
                            </div>
                        </div>

                        <div className="service-card">
                            <img src="/images/plumbing.jpg" alt="plumbing" className="service-image" />
                            <div className="service-info">
                                <h3 className="service-title">Maintenance & Cleaning</h3>
                                <p className="service-desc">Comprehensive home maintenance and cleaning services to keep your space pristine.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default LandingPage;
