
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import '@/components/cssfile/menuPages.css';
const ProfilePage = async () => {
  // Get current user and role from Clerk
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const role = (user.publicMetadata.role as string || "user").toLowerCase();
  const clerkId = user.id; // Use the Clerk user ID directly

  console.log("Debug - Clerk User ID:", clerkId); 
  console.log("Debug - Role:", role);

  // Initialize profileData with Clerk data first
  let profileData = {
    id: clerkId,
    name: user.firstName || "",
    surname: user.lastName || "",
    email: user.emailAddresses[0]?.emailAddress || "",
    phone: user.phoneNumbers[0]?.phoneNumber || "",
    img: "/noAvatar.png",
    role: role,
    bloodType: "",
    birthday: null,
    course: null,
    profession: "",
    address: "", // Will be populated from database if available
    city: "",
    country: "",
    gender: "",
    joinDate: new Date(user.createdAt),
  };

  try {
    // Log the query parameters
    console.log("Debug - Query params:", { role, clerkId });

    // Use a more reliable role check
    switch (role) {
      case "teacher":
        const teacher = await prisma.teacher.findUnique({
          where: {
            id: clerkId // Using ID instead of userId
          },
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
            address: true,
            img: true,
            createdAt: true
          }
        });

        console.log("Found teacher:", teacher); // Debug log

        if (teacher) {
          profileData = {
            ...profileData,
            id: teacher.id,
            name: teacher.name || profileData.name,
            surname: teacher.surname || profileData.surname,
            email: teacher.email || profileData.email,
            phone: teacher.phone || profileData.phone,
            address: teacher.address || "",
            img: teacher.img || profileData.img,
            joinDate: teacher.createdAt
          };
        }
        break;

      case "student":
        const student = await prisma.student.findUnique({
          where: {
            id: clerkId // Using ID instead of userId
          },
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
            address: true,
            img: true,
            createdAt: true
          }
        });

        console.log("Found student:", student); // Debug log

        if (student) {
          profileData = {
            ...profileData,
            id: student.id,
            name: student.name || profileData.name,
            surname: student.surname || profileData.surname,
            email: student.email || profileData.email,
            phone: student.phone || profileData.phone,
            address: student.address || "",
            img: student.img || profileData.img,
            joinDate: student.createdAt
          };
        }
        break;

      case "parent":
        const parent = await prisma.parent.findUnique({
          where: {
            id: clerkId // Using ID instead of userId
          },
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
            address: true,
            createdAt: true
          }
        });

        console.log("Found parent:", parent); // Debug log

        if (parent) {
          profileData = {
            ...profileData,
            id: parent.id,
            name: parent.name || profileData.name,
            surname: parent.surname || profileData.surname,
            email: parent.email || profileData.email,
            phone: parent.phone || profileData.phone,
            address: parent.address || "",
            joinDate: parent.createdAt
          };
        }
        break;

      default:
        // For users with no specific role or unknown roles
        console.log("No specific role handler for:", role);
    }

    // Debug log the final profile data
    console.log("Final profile data:", profileData);

  } catch (error) {
    console.error("Error fetching profile data:", error);
  }

  // Add console log to debug the contact information
  console.log("Profile Contact Info:", {
    email: profileData.email,
    phone: profileData.phone,
    address: profileData.address
  });

  // Format gender for display
  const formatGender = (gender: string) => {
    if (!gender) return "Not specified";
    
    // If it's from the enum (MALE, FEMALE, OTHER)
    if (gender === "MALE") return "Male";
    if (gender === "FEMALE") return "Female";
    if (gender === "OTHER") return "Other";
    
    return gender;
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 profilepage">
      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 profilecard">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-40 h-40 rounded-2xl overflow-hidden ">
                <Image 
                  src={profileData.img} 
                  alt="Profile Picture" 
                  width={160} 
                  height={160} 
                  className="w-full h-full  object-cover"
                />
              </div>
              <span className="absolute bottom-2 right-2 bg-green-500 p-1.5 rounded-full ring-4 ring-white ">
                <div className="w-3 h-3 rounded-full bg-white"></div>
              </span>
            </div>

            {/* Profile Header Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profileData.name} {profileData.surname}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium capitalize">
                  {profileData.role}
                </span>
                {profileData.profession && (
                  <span className="text-gray-500">{profileData.profession}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className=" rounded-2xl shadow-sm p-8 profilecard">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                 <div className="w-5 h-5">
      <Image
        src="/profile.png"
        alt="Profile"
        width={20}
        height={20}
        className="rounded-full object-cover"
      />
    </div>
              </div>
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium  mb-1">Full Name</h3>
                <p className="text-gray-500">{profileData.name} {profileData.surname}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium  mb-1">Role</h3>
                <p className="text-gray-500 capitalize">{profileData.role}</p>
              </div>
              {profileData.gender && (
                <div>
                  <h3 className="text-sm font-medium  mb-1">Gender</h3>
                  <p className="text-gray-500">{formatGender(profileData.gender)}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium  mb-1">Member Since</h3>
                <p className="text-gray-500">
                  {profileData.joinDate 
                    ? new Date(profileData.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className=" rounded-2xl shadow-sm p-8 profilecard">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                 <div className="w-5 h-5">
      <Image
        src="/contact.png"
        alt="Profile"
        width={20}
        height={20}
        className="rounded-full object-cover"
      />
    </div>
              </div>
              <h2 className="text-xl font-semibold">Contact Information</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium  mb-1">Email Address</h3>
                <div className="flex items-center">
                  <p className="text-gray-500">
                    {profileData.email || "Not provided"}
                  </p>
                  {profileData.email && (
                    <a href={`mailto:${profileData.email}`} className="ml-2 text-blue-500 hover:text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium  mb-1">Phone Number</h3>
                <div className="flex items-center">
                  <p className="text-gray-500">
                    {profileData.phone || "Not provided"}
                  </p>
                  {profileData.phone && (
                    <a href={`tel:${profileData.phone}`} className="ml-2  hover:text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium  mb-1">Address</h3>
                <p className="text-gray-500">
                  {profileData.address || "Not provided"}
                </p>
              </div>
              {(profileData.city || profileData.country) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                  <p className="text-gray-900">
                    {[profileData.city, profileData.country].filter(Boolean).join(", ") || "Not provided"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
