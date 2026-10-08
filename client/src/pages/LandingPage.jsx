import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
            <header className="nav">
                <div className="l-container nav__inner">
                    <button className="nav__brand">
                        <i className="fas fa-tools"></i>
                        <span>DutyFix IT</span>
                    </button>
                    <button 
                        className="btn btn--primary" 
                        onClick={() => navigate('/login')}
                    >
                        Login / Sign Up
                    </button>
                </div>
            </header>

            <main style={{ flex: 1 }}>
                <section className="landing-hero u-blueprint-bg" style={{color: 'var(--paper)'}}>
                    <div className="l-container">
                        <div className="landing-hero__content">
                            <h1 className="landing-hero__title" style={{color: 'var(--turmeric-500)'}}>Expert home services you can trust.</h1>
                            <p className="landing-hero__subtitle" style={{color: 'var(--paper-sunk)'}}>
                                Fast, reliable, and professional maintenance solutions tailored to your household needs. We fix it right, the first time.
                            </p>
                            <div className="landing-hero__actions">
                                <button className="btn btn--accent" onClick={() => navigate('/login')}>Book a Service</button>
                                <button className="btn btn--ghost" style={{borderColor: 'var(--paper)', color: 'var(--paper)'}} onClick={() => navigate('/login')}>Join as a Professional</button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="u-ruler-ticks"></div>

                <section className="landing-services">
                    <div className="l-container">
                        <h2 className="u-mb-8">Popular Services</h2>
                        <div className="landing-services__grid">
                            
                            <div className="service-tile">
                                <div className="service-tile__img-wrapper">
                                    <img src="/images/plumbing.jpg" alt="Plumbing" className="service-tile__img" />
                                </div>
                                <div className="service-tile__content">
                                    <h3 className="service-tile__title">Plumbing</h3>
                                    <p className="service-tile__desc">Fix leaks, clear drains, and install new fixtures with verified professionals.</p>
                                </div>
                            </div>

                            <div className="service-tile">
                                <div className="service-tile__img-wrapper">
                                    <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2669&auto=format&fit=crop" alt="Electrical" className="service-tile__img" />
                                </div>
                                <div className="service-tile__content">
                                    <h3 className="service-tile__title">Electrical</h3>
                                    <p className="service-tile__desc">Certified electricians ensuring your home's safety and power efficiency.</p>
                                </div>
                            </div>

                            <div className="service-tile">
                                <div className="service-tile__img-wrapper">
                                    <img src="/images/carpenter.jpg" alt="Carpentry" className="service-tile__img" />
                                </div>
                                <div className="service-tile__content">
                                    <h3 className="service-tile__title">Carpentry</h3>
                                    <p className="service-tile__desc">Custom woodwork, furniture repair, and professional installations.</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                <section className="landing-pro">
                    <div className="l-container">
                        <h2>For Professionals</h2>
                        <p style={{maxWidth: '600px', marginTop: '16px'}}>
                            We operate on a transparent lead-unlock model. Browse incoming client requests for free. Only pay when you're ready to take the job.
                        </p>
                        
                        <div className="landing-pro__box">
                            <div className="landing-pro__price">₹100</div>
                            <p className="u-mono" style={{color: 'var(--paper-sunk)', marginTop: '8px', fontSize: '0.875rem'}}>Flat fee per accepted lead. No hidden commissions.</p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
