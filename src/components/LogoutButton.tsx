"use client";

import { useClerk } from "@clerk/nextjs";
import Image from "next/image";

export default function LogoutButton() {
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      // First sign out with Clerk
      await signOut();
      
      // Then force a direct browser redirect to sign-in
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout error:", error);
      // If there's an error, try the direct approach
      window.location.href = "/sign-in";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center lg:justify-start w-full gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight dark:hover:bg-gray-700 text-left"
    >
      <Image src="/logout.png" alt="" width={20} height={20} />
      <span className="hidden lg:block">Logout</span>
    </button>
  );
}
