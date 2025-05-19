import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import VerifyPaymentButton from "@/components/VerifyPaymentButton";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { PaymentStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

// Define the courses locally (same as in AdmissionPage)
const courses = [
  { id: "1", name: "BCA" },
  { id: "2", name: "MCA" },
  { id: "3", name: "B.Tech" },
  { id: "4", name: "M.Tech" },
];

const PendingPaymentsPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const { page, sort, status } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Filter conditions
  const statusFilter = status === "verified" ? PaymentStatus.APPROVED : PaymentStatus.PENDING;

  const query: any = {
    status: statusFilter,
  };

  const orderBy: any = {};
  if (sort === "asc" || sort === "desc") {
    orderBy.studentName = sort;
  }

  const data = await prisma.payment.findMany({
    where: query,
    include: {
      admission: true,
    },
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
    orderBy,
  });

  const totalPayments = await prisma.payment.count({
    where: query,
  });

  const columns = [
    { header: "Student Name", accessor: "name" },
    { header: "Surname", accessor: "surname" },
    { header: "Course", accessor: "course" },
    { header: "Created Date", accessor: "createdAt" },
    { header: "Status", accessor: "status" },
    { header: "Receipt", accessor: "receipt" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => {
    console.log("Admission Data:", item.admission); // Debugging
    const course = courses.find(course => course.id === item.admission.courseId);
    console.log("Course Found:", course); // Debugging

    return (
      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-100/50 transition-colors">
        <td className="p-1">{item.admission.studentName}</td>
        <td className="p-1">{item.admission.studentSurname}</td>
        <td className="p-1">{course ? course.name : "N/A"}</td>
        <td className="p-1">{new Date(item.createdAt).toLocaleDateString()}</td>
        <td className="p-1">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            item.status === PaymentStatus.PENDING
              ? "bg-yellow-500/20 text-yellow-600"
              : "bg-green-500/20 text-green-600"
          }`}>
            {item.status}
          </span>
        </td>
        <td className="p-1">
          <Link href={`/list/pendings/${item.id}`}>
          <button className="p-1 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all">
  View receipt
</button>
          </Link>
        </td>
        <td className="p-4 flex gap-2">
          {item.status === PaymentStatus.PENDING && (
            <VerifyPaymentButton paymentId={item.id} />
          )}
        </td>
      </tr>
    );
  };

  const totalPages = Math.ceil(totalPayments / ITEM_PER_PAGE);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }}>
      <div className="bg-white/70 backdrop-blur-lg rounded-lg shadow-2xl p-6">
       <h1 className="text-2xl font-bold mb-6">
  {status === "verified" ? "Verified Payments" : "Pending Payments"}
</h1>
        <div className="flex items-center justify-between mb-6">
          <TableSearch />
          <div className="flex gap-2">
  <Link href="?status=pending">
    <button
      className={`px-4 py-2 rounded-lg transition-all ${
        status === "pending"
          ? "bg-gradient-to-r from-[#40e0d0] to-[#20c5b5] text-white hover:from-[#1ba396] hover:to-[#158277]"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      Pending
    </button>
  </Link>
  <Link href="?status=verified">
    <button
      className={`px-4 py-2 rounded-lg transition-all ${
        status === "verified"
          ? "bg-gradient-to-r from-[#40e0d0] to-[#20c5b5] text-white hover:from-[#1ba396] hover:to-[#158277]"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      Verified
    </button>
  </Link>
</div>
        </div>
        <div className="overflow-x-auto">
          <Table columns={columns} renderRow={renderRow} data={data || []} />
        </div>
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination page={p} count={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingPaymentsPage;