"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import './course.css';  // Importing CSS file
import Image from 'next/image';
import '@/app/styles/Landingpage.css';
import '../styles/Landingpage.css';
import Link from 'next/link';


export default function Courses() {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
    const toggleDropdown = (event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent event bubbling
      setIsDropdownOpen(!isDropdownOpen);
    };

  const courses = [
    { 
      name: "BCA", 
      desc: "A three-year degree program focusing on computer applications.", 
      image: "/one.jpg",
      pdfLink: "https://drive.google.com/file/d/1rDw7vOJ-KtYObX0rqw3lITiOlm3-0nHl/view?usp=drive_link" 
  },

    { name: "MCA",
       desc: "A three-year postgraduate program in advanced computer applications.",
        image: "/two.jpg",
        pdfLink: "https://drive.google.com/file/d/1ASlpi2n7RupwoJcSvAwlo2lZJJTMWKB0/view?usp=drive_link" 
      },

    { name: "B.Tech",
       desc: "A four-year engineering program combining theory with practical experience.",
        image: "/three.jpg",
        pdfLink: "https://drive.google.com/file/d/1ASlpi2n7RupwoJcSvAwlo2lZJJTMWKB0/view?usp=drive_link"
       },

    { name: "M.Tech",
       desc: "A professional postgraduate degree preparing students for advanced engineering roles.",
        image: "/four.jpg",
        pdfLink: "https://drive.google.com/file/d/1ASlpi2n7RupwoJcSvAwlo2lZJJTMWKB0/view?usp=drive_link" 
      },

     
  ];

  const handleCourseSelect = (course:string) => {
    setSelectedCourse(course);
    router.push(`/admission?course=${course}`);
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
      
    </nav>
    
    {/* Hero Section with Campus Image */}
      <div className="hero-section">
        <Image src="/campus.jpg" alt="Campus" className="campus-image" width={1200} height={400} />
        <div className="hero-overlay">
          <h1>Our Courses</h1>
          <p>Explore cutting-edge programs tailored for your future.</p>
        </div>
      </div>
       
       {/* Course Grid */}
      <div className="course-grid">
        {courses.map((course) => (
          <div key={course.name} className="course-card">
            <Image src={course.image} alt={course.name} width={300} height={200} className="course-image" />
            <div className="course-content">
              <h2 >{course.name}</h2>
              <p>{course.desc}</p>
              <Link href={course.pdfLink} target="_blank" rel="noopener noreferrer" className="pdf-link">
                For More Information (Download PDF)
              </Link>
              <button
                className="apply-button"
                onClick={() => handleCourseSelect(course.name)}
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>

       {/* Bottom Navbar */}
       <nav className="bottom-navbar">
              <div className="icon-container">
               <Link href="https://chat.whatsapp.com/JscRKUQ5m8V6dt6an5v6C3" target="_blank" rel="noopener noreferrer">
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
}
