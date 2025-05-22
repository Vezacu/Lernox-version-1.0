import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma, Subject, Course, Semester, Teacher } from "@prisma/client";
import Image from "next/image";
import { redirect } from "next/navigation";
import '@/components/cssfile/menuPages.css';

type SubjectOfferingList = {
  id: number;
  subject: Subject;
  semester: Semester & { course: Course };
  teacher: Teacher;
};

const SubjectOfferingsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Check for admin role
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/");
  }

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Query construction
  const query: Prisma.SubjectOfferingWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          case "courseId":
            query.semester = {
              courseId: parseInt(value)
            };
            break;
          case "semesterId":
            query.semesterId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
        }
      }
    }
  }

  const columns = [
    {
      header: "Subject",
      accessor: "subject",
    },
    {
      header: "Course",
      accessor: "course",
      className: "hidden md:table-cell",
    },
    {
      header: "Semester",
      accessor: "semester",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "actions",
    },
  ];

  const renderRow = (item: SubjectOfferingList) => (
    <tr
      key={item.id}
      className="border-b text-sm border-gray-200 hover:bg-[#a8edea] darkHoverList"
    >
      <td className="p-4">{item.subject.name}</td>
      <td className="hidden md:table-cell">{item.semester.course.name}</td>
      <td className="hidden md:table-cell">Semester {item.semester.number}</td>
      <td className="hidden md:table-cell">{item.teacher.name}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormContainer 
            table="subjectOffering" 
            type="update" 
            data={item} 
          />
          <FormContainer 
            table="subjectOffering" 
            type="delete" 
            id={item.id} 
          />
        </div>
      </td>
    </tr>
  );

  const [data, count] = await prisma.$transaction([
    prisma.subjectOffering.findMany({
      where: query,
      include: {
        subject: true,
        semester: {
          include: {
            course: true,
          },
        },
        teacher: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.subjectOffering.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 subjectOfferingpage">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Subject Offerings
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <FormContainer table="subjectOffering" type="create" />
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default SubjectOfferingsPage;