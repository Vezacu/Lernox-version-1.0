"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const DropdownMenu = ({
  menuItems,
  role,
}: {
  menuItems: any[];
  role: string;
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="mt-4 text-l">
      {/* Dropdown Toggle Button */}
      <button onClick={toggleDropdown} className="dropdown-toggle">
        <Image
          src="/bar.png"
          alt="Menu"
          width={24}
          height={24}
          className="w-6 h-6 sm:w-5 sm:h-5 md:w-4 md:h-4 xl:w-[16px] min-w-[16px] min-h-[16px]"
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {menuItems.map((i) => (
            <div className="flex flex-col gap-1" key={i.title}>
              {/* Show title on all screens */}
              <span className="text-black font-bold my-4 MenuOther pl-4">
                {i.title}
              </span>
              {i.items.map((item: any) => {
                if (item.visible.includes(role)) {
                  return (
                    <Link
                      href={item.href}
                      key={item.label}
                      className="flex items-center gap-4 py-2.5 md:px-2 rounded-md hover:bg-black hover:text-white menuhover"
                    >
                      {/* Icon */}
                      <Image
                        src={item.icon}
                        alt=""
                        width={25}
                        height={25}
                        className="menu-icon"
                      />
                      {/* Show label on all screens */}
                      <span>{item.label}</span>
                    </Link>
                  );
                }
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
