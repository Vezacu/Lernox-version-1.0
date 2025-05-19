"use client";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false); // Initializing a state variable 'darkMode' with a default value of false.

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode"); // Adding 'dark-mode' class to the body element when darkMode is true.
    } else {
      document.body.classList.remove("dark-mode"); // Removing 'dark-mode' class from the body element when darkMode is false.
    }
  }, [darkMode]);

  return (
    // DARK MODE TOGGLE
    <button
      onClick={() => setDarkMode(!darkMode)}
      className={`px-4 py-2 rounded-full ${
        darkMode ? "bg-[#08ff08] text-white" : "bg-black text-white"
      } transition`}
    >
      <Image
        src={darkMode ? "/light-mode-icon.png" : "/dark-mode-icon.png"}
        alt={darkMode ? "Light Mode" : "Dark Mode"}
        width={20}
        height={20}
      />
    </button>
    // Dark mode toggle button
  );
};

export default DarkModeToggle;
