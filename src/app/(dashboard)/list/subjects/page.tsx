import FormContainer from "@/components/FormContainer";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import '@/components/cssfile/menuPages.css';

type SubjectList = Subject & { teachers: Teacher[] }

const SubjectsPage = async ({ searchParams }: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Check for admin role
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // if (role !== "admin") {
  //   redirect("/");
  // }

  const { page, search } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.SubjectWhereInput = {};
  if (search) {
    query.name = { contains: search, mode: "insensitive" };
  }

  const columns = [
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Actions",
      accessor: "actions",
    },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b text-sm border-gray-200 hover:bg-[#a8edea] darkHoverList">
      <td className="p-4">{item.name}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormContainer 
            table="subject" 
            type="update" 
            data={item} 
          />
          <FormContainer 
            table="subject" 
            type="delete" 
            id={item.id} 
          />
        </div>
      </td>
    </tr>
  );

  const [data, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.subject.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 subjectpage">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Subjects</h1>
        <div className="flex items-center gap-4">
          <TableSearch />
          <FormContainer table="subject" type="create" />
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default SubjectsPage;
