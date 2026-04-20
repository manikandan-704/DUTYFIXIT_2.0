import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ClientPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Logic for search execution
    console.log("Searching for:", searchQuery);
    // Maybe filter the grid below
  };

  const handleServiceClick = (service) => {
    navigate(`/profile-booking?service=${service}`);
  };

  const services = [
    { name: 'Plumbing', img: '/images/plumbing.jpg' },
    { name: 'Electrical', img: '/images/electrician.jpg' },
    { name: 'Cleaning', img: '/images/cleaning.jpg' },
    { name: 'Painting', img: '/images/painter.jpg' },
    { name: 'Carpentry', img: '/images/carpenter.jpg' },
    { name: 'AC Service', img: '/images/ac.jpg' },
    { name: 'CCTV Service', img: '/images/cctv.jpg' },
    { name: 'Interior Design', img: '/images/interior.jpg' },
    { name: 'Civil Service', img: '/images/civil.jpg' },
    { name: 'RO Purifier', img: '/images/ro.jpg' },
  ];

  return (
    <>
      <Navbar role="client" />

      <main className="container-xl">
        {/* Hero Section */}
        <section className="client-hero-section">
          <div className="client-hero-content">
            <h1 className="client-hero-title">Home services, on demand.</h1>
            <p className="client-hero-subtitle">Expert professionals for all your home needs.</p>

            <form className="search-container" onSubmit={handleSearch}>
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search for 'Plumbing', 'Cleaning'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </section>

        {/* Services Section */}
        <h2 className="section-title">Home Services</h2>

        <div className="client-services-grid">
          {services
            .filter(svc => svc.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((svc, index) => (
            <div 
              key={index} 
              className="client-service-card" 
              onClick={() => handleServiceClick(svc.name)}
            >
              <img src={svc.img} alt={svc.name} className="client-service-img" />
              <div className="client-service-name">{svc.name}</div>
            </div>
          ))}
        </div>
      </main>

      <Footer role="client" />
    </>
  );
};

export default ClientPage;
