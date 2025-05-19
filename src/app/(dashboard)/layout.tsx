import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   
      <div className="h-screen flex background">
        {/* LEFT */}
        <div className="w-[16%] md:w-[6%] text-black lg:w-[6%] xl:w-[5%] p-4 leftbg">
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start gap-2"
          >
            {/* Add your logo or icon here */}
          </Link>
          <Menu />
        </div>
  
        {/* RIGHT */}
        <div className="flex-1 bg-[#efe4e] overflow-scroll flex flex-col rightbg">
          <Navbar />
          {children}
        </div>
      </div>
    );
  }