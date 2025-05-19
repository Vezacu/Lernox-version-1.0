"use client"
import React, { useState } from 'react';
import './aboutpage.css'; 
import Image from 'next/image';
import '../homepage/Landingpage.css';
import DarkModeToggle from '@/components/darkmode/darkmode';
import Link from 'next/link';


const AboutPage = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    setIsDropdownOpen(!isDropdownOpen);
  };
  return (
    <div className="flex items-center container">
    {/* Top Navbar */}
    <nav className="navbar">
      <div className="nav-left">
       
        {/* Dropdown Toggle Button */}
        <button onClick={toggleDropdown} className="dropdown-toggle">
          <Image src="/bar.png" alt="Menu" width={24} height={24} />
        </button>
        {/* Dropdown Menu */}
        {isDropdownOpen && (
            <div className="dropdown-menu">
              <Link href="/">HOME</Link>
              <Link href="/about">About</Link>
              <Link href="/course">COURSE</Link>
            </div>
          )}
        <div className="logo-container">
          <Image src="/foxlogo.png" alt="LERNOX Logo" width={40} height={40}  />
          <span className="logo-text text-black">LERNOX</span>
        </div>
      </div>
      <div className="nav-right">
      <Link href="/sign-in" className="login-btn">LOGIN</Link>

        
      </div>
    </nav>
      {/* About Section */}
      <section className="about-section">
        <div className="about-content">
          <h1 className="about-title">About Us</h1>
          <p className="about-description">
            Welcome to the future of innovation. We are Link team of passionate individuals dedicated to pushing the boundaries of technology and design. Our mission is to create solutions that not only solve problems but also inspire and transform the way we interact with the world.
          </p>
          <div className="about-features">
            <div className="feature-card">
              <h2>Innovation</h2>
              <p>We thrive on creativity and cutting-edge technology to deliver groundbreaking solutions.</p>
            </div>
            <div className="feature-card">
              <h2>Collaboration</h2>
              <p>Our team works together seamlessly, combining diverse skills to achieve extraordinary results.</p>
            </div>
            <div className="feature-card">
              <h2>Sustainability</h2>
              <p>We are committed to building Link sustainable future through eco-friendly practices and technologies.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Bottom Navbar */}
           <nav className="bottom-navbar">
             <div className="icon-container">
               <Link href="https://wa.me/your-whatsapp-link" target="_blank" rel="noopener noreferrer">
                 <Image src="/whatsapp.png" alt="WhatsApp" width={24} height={24} className='butttonIcon'/>
               </Link>
               <Link href="https://instagram.com/your-instagram-link" target="_blank" rel="noopener noreferrer">
                 <Image src="/instagram.png" alt="Instagram" width={24} height={24} className='butttonIcon'/>
               </Link>
               <Link href="https://twitter.com/your-twitter-link" target="_blank" rel="noopener noreferrer">
                 <Image src="/twitter.png" alt="Twitter" width={24} height={24} className='butttonIcon'/>
               </Link>
             </div>
             <div className="our-links">
               <h3>Our Links</h3>
               <Link href="/course">Courses</Link>
               <Link href="/blog">Blog</Link>
               <Link href="/contact">Contact</Link>
             </div>
             <div className="address-contact">
               <h3>Address and Contact</h3>
               <p>123 College Street, City</p>
               <p>Email: info@lernox.com</p>
               <p>Phone: +123 456 7890</p>
             </div>
           </nav>
    </div>
  );
};

export default AboutPage;