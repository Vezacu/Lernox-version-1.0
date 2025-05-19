"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function LogoutPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await signOut();
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback
      window.location.href = "/sign-in";
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e9e4f0] dark:from-#c3cfe2] dark:to-[#111827] p-4">
    <div className="bg-white/20 dark:bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/30 dark:border-white/20 max-w-md w-full">
      <div className="text-center mb-6">
        <div className="mb-4 flex justify-center">
          <Image
            src="/logout.png"
            alt="Logout Icon"
            width={56}
            height={56}
            className="opacity-90"
          />
        </div>
        <h1 className="text-3xl font-semibold  text-gray-800 mb-2">Log Out</h1>
        <p className="text-[#40e0d0] text-[#40e0d0] text-sm">
          Are you sure you want to log out?
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          You’ll need to sign in again to access your account.
        </p>
      </div>
  
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <button
          onClick={handleCancel}
          disabled={isLoggingOut}
          className="px-6 py-2 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white/30 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmLogout}
          disabled={isLoggingOut}
          className="px-6 py-2 bg-[#40e0d0] hover:bg-gray-600 rounded-lg transition disabled:opacity-60"
        >
          {isLoggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>
  
      {isLoggingOut && (
        <div className="mt-6 text-center">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Logging out...</p>
        </div>
      )}
    </div>
  </div>
  
  );
}
