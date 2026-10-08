import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ClientPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleServiceClick = (service) => {
    navigate(`/profile-booking?service=${service}`);
  };

  const services = [
    { name: 'Plumbing', icon: 'fa-faucet' },
    { name: 'Electrical', icon: 'fa-bolt' },
    { name: 'Cleaning', icon: 'fa-broom' },
    { name: 'Painting', icon: 'fa-paint-roller' },
    { name: 'Carpentry', icon: 'fa-hammer' },
    { name: 'AC Service', icon: 'fa-snowflake' },
    { name: 'CCTV Service', icon: 'fa-video' },
    { name: 'Interior Design', icon: 'fa-couch' },
    { name: 'Civil Service', icon: 'fa-hard-hat' },
    { name: 'RO Purifier', icon: 'fa-tint' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar role="client" />

      <main style={{ flex: 1 }}>
        <section style={{ padding: 'var(--space-12) 0', backgroundColor: 'var(--teal-900)', color: 'var(--paper)' }} className="u-blueprint-bg">
          <div className="l-container">
            <h1 style={{ color: 'var(--turmeric-500)', marginBottom: 'var(--space-4)' }}>What do you need fixing today?</h1>
            <form className="form-group" style={{ maxWidth: '600px', flexDirection: 'row', gap: 0 }} onSubmit={handleSearch}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search for 'Plumbing', 'Cleaning'..."
                style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', borderRight: 'none' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn--primary" style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', border: '1px solid var(--teal-700)' }}>
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>
        </section>

        <div className="u-ruler-ticks"></div>

        <section className="l-container" style={{ paddingBlock: 'var(--space-12)' }}>
          <h2 className="u-mb-6">Categories</h2>
          <div className="category-grid">
            {services
              .filter(svc => svc.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((svc, index) => (
              <button 
                key={index} 
                className="category-tile" 
                onClick={() => handleServiceClick(svc.name)}
              >
                <i className={`fas ${svc.icon} category-tile__icon`}></i>
                <div className="category-tile__name">{svc.name}</div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <Footer role="client" />
    </div>
  );
};

export default ClientPage;
