"use client";
import React, { useState } from 'react';
import '@/app/styles/Landingpage.css'; // Import the CSS file
import Image from 'next/image';

const LandingPage: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
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
              <a href="#">HOME</a>
              <a href="About">ABOUT</a>
              <a href="course">COURSE</a>
            </div>
          )} 
          <div className="logo-container">
            <Image src="/foxlogo.png" alt="LERNOX Logo" width={40} height={40} />
            <span className="logo-text text-black">LERNOX</span>
          </div>
        </div>
        <div className="nav-right">
          <a href="sign-in">LOGIN</a>
        </div>
      </nav>
      {/* Upper Section */}
      <div className="upper-image">
        <section className="upper-section">
          <div className="upper-left">
            <h1 className="hero-text">LERNOX</h1>
            <p className="hero-paragraph">
              Welcome to LERNOX, where innovation meets education. Our platform offers cutting-edge courses designed to help you achieve your goals and transform your future. Join us today and take the first step towards success!
            </p>
          </div>
          <div className="upper-right">
            {/* <Image src="/bookStack.png" alt="" width={600} height={800} className="hero-image" /> */}
          </div>
        </section>
      </div>

      {/* Four Boxes Section */}
    
      <section className="boxes-section">
        <div className="box">
          <div className="box-image">
            <Image src="/one.jpg" alt="Box 1" width={200} height={200} />
          </div>
          <div className="box-description">
            <p>Discover a place where knowledge meets opportunity. At [Your College Name], we empower students with a world-class education, innovative programs, and a vibrant campus life. Your future starts here!</p>
          </div>
        </div>
        <div className="box">
          <div className="box-image">
            <Image src="/two.jpg" alt="Box 2" width={200} height={200} />
          </div>
          <div className="box-description">
            <p>Our rigorous academic programs are designed to challenge and inspire. With expert faculty, state-of-the-art facilities, and hands-on learning experiences, we prepare students for success in their careers and beyond.</p>
          </div>
        </div>
        <div className="box">
          <div className="box-image">
            <Image src="/three.jpg" alt="Box 3" width={200} height={200} />
          </div>
          <div className="box-description">
            <p>Join a diverse and dynamic student community. From clubs and organizations to sports and cultural events, there’s always something exciting happening at Lernox. Make lifelong connections and unforgettable memories!</p>
          </div>
        </div>
        <div className="box">
          <div className="box-image">
            <Image src="/four.jpg" alt="Box 4" width={200} height={200} />
          </div>
          <div className="box-description">
            <p>At Lernox we prepare you for success beyond the classroom. With strong career support, internship opportunities, and a global alumni network, we help turn your dreams into reality.</p>
          </div>
        </div>
      
      </section>
      <a href="course" className='coursebtn'>JOIN US NOW</a>
      {/* Dark Section */}
      <section className="dark-section">
        <div className="dark-content">
          <p>Join us in shaping the future of education. Learn more about our mission and vision.</p>
          <a href="About" className="learn-more">Learn More About Us</a>
        </div>
      </section>

      {/* Bottom Navbar */}
      <nav className="bottom-navbar">
        <div className="icon-container">
          <a href="https://wa.me/your-whatsapp-link" target="_blank" rel="noopener noreferrer">
            <Image src="/whatsapp.png" alt="WhatsApp" width={24} height={24} />
          </a>
          <a href="https://instagram.com/your-instagram-link" target="_blank" rel="noopener noreferrer">
            <Image src="/instagram.png" alt="Instagram" width={24} height={24} />
          </a>
          <a href="https://twitter.com/your-twitter-link" target="_blank" rel="noopener noreferrer">
            <Image src="/twitter.png" alt="Twitter" width={24} height={24} />
          </a>
        </div>
        <div className="our-links">
          <h3>Our Links</h3>
          <a href="/courses">Courses</a>
          <a href="/blog">Blog</a>
          <a href="/contact">Contact</a>
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

export default LandingPage;