// app/components/Navbar.tsx (Client Component)
"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import DarkModeToggle from "./darkmode/darkmode";

const Navbar = () => {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between p-4">
      <div className="logo"></div>
      <span
        className="hidden lg:block logoName text-black text-l pl-2 pr-4 font-bold"
      >
        LERNOX
      </span>
           {/* SEARCH BAR */}
           <div className="hidden md:flex items-center gap-2 text-xs rounded-full bg-white ring-[1.9px] ring-gray-300 px-4 flex-none flex-shrink w-[15rem]">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-full p-2 bg-white outline-none dark:text-black"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        { /*<div className="bg-[#08FF08] rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <div className="bg-[#08FF08] rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-black text-white rounded-full text-xs dark:bg-white dark:text-black">
            1
          </div>
        </div>*/}
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium"></span>
          <span className="text-[15px] text-gray-500 text-right">
            {user?.publicMetadata?.role as string}
          </span>
        </div>
        <UserButton />
        <DarkModeToggle />
      </div>
    </div>
  );
};

export default Navbar;