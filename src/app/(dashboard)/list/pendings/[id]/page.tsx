import prisma from "@/lib/prisma";
import Image from "next/image";
import '@/components/cssfile/menuPages.css';
import Link from "next/link";

const ViewPaymentPage = async ({ params }: { params: { id: string } }) => {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      admission: true,
    },
  });

  if (!payment) {
    return <div>Payment not found</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 pendingIDpage">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Student Details</h1>
      <Link 
        href="/list/pendings" 
        className="bg-[#40e0d0] hover:bg-gray-300 px-4 py-2 pr-8 pl-8 rounded-lg text-black"
      >
        Back
      </Link>
    </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Information Card */}
        <div className="bg-white p-6 rounded-lg studentIDpageInner">
          <h2 className="text-lg font-semibold mb-4 text-gray-400">Student Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{payment.admission.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Surname</p>
                <p className="font-medium">{payment.admission.studentSurname}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{payment.admission.email}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{payment.admission.phone}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{payment.admission.address}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Birthday</p>
                <p className="font-medium">{payment.admission.birthday.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Type</p>
                <p className="font-medium">{payment.admission.bloodType}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Sex</p>
              <p className="font-medium">{payment.admission.sex}</p>
            </div>
          </div>
        </div>
        
        {/* Payment Information Card */}
        <div className="bg-white p-6 rounded-lg studentIDpageInner">
          <h2 className="text-lg font-semibold mb-4 text-gray-400">Payment Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium text-xl">₹{payment.amount}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                payment.status === "APPROVED" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {payment.status}
              </span>
            </div>
            
            {payment.img && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Payment Screenshot</p>
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Image
                    src={payment.img}
                    alt="Payment Screenshot"
                    width={400}
                    height={300}
                    className="rounded-md w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPaymentPage;