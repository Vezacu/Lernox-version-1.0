"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import '../styles/Landingpage.css';

const HomePage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        const role = user?.publicMetadata?.role;
        router.replace(`/${role || "dashboard"}`);
      } else {
        setCheckingAuth(false);
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (checkingAuth) {
    return <div className="h-screen flex justify-center items-center bg-gray-900 text-white">...</div>;
  }

  

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };


  return (
    <div className="flex flex-col  w-full min-h-full">
  

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
            <Image src="/lernoxlogo.png" alt="LERNOX Logo" width={40} height={40} />
            <span className="logo-text text-black">LERNOX</span>
          </div>
        </div>
        <div className="nav-right">
          <button onClick={() => setShowLogin(true)} className="login-btn color-black ">LOGIN</button>
        </div>
      </nav>

      {showLogin ? (
        <div className="h-screen flex justify-center items-center  bg-gradient-to-br from-[#f5f7fa] to-[#e9e4f0] dark:from-#c3cfe2] dark:to-[#111827]   signinbg ">
          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/30 dark:border-white/20 max-w-md w-full">
            <h1 className="text-3xl font-bold flex items-center gap-2  mb-4">
              <Image src="/lernoxlogo.png" alt="LERNOX" width={45} height={45} />
              LΣRNϴX
            </h1>
            <h2 className="text-gray-800 mb-2 mt-8">Sign in to your account</h2>
            <SignIn.Root>
              <SignIn.Step name="start" className="flex flex-col gap-4">
                <Clerk.GlobalError />
                <Clerk.Field name="identifier" className="flex flex-col gap-1">
                  <Clerk.Label className="text-sm text-gray-600">Username</Clerk.Label>
                  <Clerk.Input className="border border-gray-600 p-2 rounded-md bg-gray-200 text-black " type="text" />
                  <Clerk.FieldError className="text-sm text-red-400" />
                </Clerk.Field>
                <Clerk.Field name="password" className="flex flex-col gap-1">
                  <Clerk.Label className="text-sm text-gray-600">Password</Clerk.Label>
                  <Clerk.Input className="border border-gray-600 p-2 rounded-md bg-gray-200 text-black" type="password" />
                  <Clerk.FieldError className="text-sm text-red-400" />
                </Clerk.Field>
                <SignIn.Action submit className="mt-4 bg-[#08FF08] hover:bg-green-600 transition-all  font-semibold py-2 rounded-md text-black">
                  Sign In
                </SignIn.Action>
              </SignIn.Step>
            </SignIn.Root>
            <button onClick={() => setShowLogin(false)} className="mt-4 text-[#40e0d0] hover:text-green-300 underline">
              Back to Home
            </button>
          </div>
        </div>
      ) : (
        <>
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
            <Image src="/three3.jpg" alt="Box 3" width={200} height={200} />
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
      <Link href="/course" className="coursebtn">JOIN US NOW</Link>

      {/* Dark Section */}
      <section className="dark-section">
        <div className="dark-content">
          <p>Join us in shaping the future of education. Learn more about our mission and vision.</p>
          <Link href="/about" className="learn-more">Learn More About Us</Link>
        </div>
      </section>

      {/* Bottom Navbar */}
      <nav className="bottom-navbar">
        <div className="icon-container">
          <Link href="https://chat.whatsapp.com/JscRKUQ5m8V6dt6an5v6C3" target="_blank" rel="noopener noreferrer">
  <Image src="/whatsapp.png" alt="WhatsApp" width={24} height={24} className='butttonIcon'/>
</Link>
          <a href="https://www.instagram.com/lernox3?igsh=eTg0OGc5Ymo1cjVp" target="_blank" rel="noopener noreferrer">
            <Image src="/instagram.png" alt="Instagram" width={24} height={24} className="butttonIcon" />
          </a>
          <a href="https://twitter.com/your-twitter-link" target="_blank" rel="noopener noreferrer">
            <Image src="/twitter.png" alt="Twitter" width={24} height={24} className="butttonIcon" />
          </a>
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
        </>
      )}
    </div>
  );
};

export default HomePage;