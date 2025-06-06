import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Course, Prisma, Semester, Subject, SubjectOffering, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings"
import { auth } from "@clerk/nextjs/server";
import '@/components/cssfile/menuPages.css';

type TeacherList = Teacher & {
  subjectOfferings: (SubjectOffering & { subject: Subject; semester: Semester & { course: Course } })[];
};


const TeacherListPage = async ({ searchParams }: {
  searchParams: { [key: string]: string | undefined };
}) => {

   const {userId,sessionClaims } = await auth();
          const role = (sessionClaims?.metadata as {role?:string})?.role;
          const currentUserId = userId;

          const { page, courseId, semesterId, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  //URL PARAMS CONDITION
  const query: Prisma.TeacherWhereInput = {};
  //to protect query params, without filtering we cannot reach any data that should be private like wage etc..
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "courseId":
            query.subjectOfferings = {
              some: {
                semester: {
                  courseId: parseInt(value)
                }
              }
            };
            break;
          case "semesterId":
            query.subjectOfferings = {
              some: {
                semesterId: parseInt(value)
              }
            };
            break;
          default:
            break;
        }
      }
    }
  }

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Teacher ID",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  // subject and class removed
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Address",
    accessor: "address",
    className: "hidden lg:table-cell",
  },
  //Main page
  {
    header: "Courses",
    accessor: "courses",
    className: "hidden md:table-cell",
  },
  {
    header: "Semesters",
    accessor: "semesters",
    className: "hidden md:table-cell",
  },
  {
    header: "Subjects",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  //rows dats ^
  ...(role === "admin"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: TeacherList) => (
  <tr
    key={item.id}
    className="border-b text-sm border-gray-200 hover:bg-[#a8edea] darkHoverList"
  >
    <td className="flex items-center gap-4 p-4">
      <Image
        src={item.img || "/noAvatar.png"}
        alt=""
        width={40}
        height={40}
        className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
      />
      <div className="flex flex-col">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-xs text-gray-500">{item?.email}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">{item.username}</td>
    {/* removed subjects and classes */}
    <td className="hidden md:table-cell">{item.phone}</td>
    <td className="hidden md:table-cell">{item.address}</td>
    <td className="hidden md:table-cell">{Array.from(new Set(item.subjectOfferings.map(so => so.semester.course.name))).join(", ")}</td>
    <td className="hidden md:table-cell">{item.subjectOfferings.map(so => `Sem ${so.semester.number}`).filter((v, i, a) => a.indexOf(v) === i).join(", ")}</td>
    <td className="hidden md:table-cell">{item.subjectOfferings.map(so => so.subject.name).join(", ")}</td>
    
    <td>
      <div className="flex items-center gap-2">
        <Link href={`/list/teachers/${item.id}`}>
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
            <Image src="/view.png" alt="" width={16} height={16} />
          </button>
        </Link>
        {role === "admin" && (
          // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
          //   <Image src="/delete.png" alt="" width={16} height={16} />
          // </button>
          <FormContainer table="teacher" type="delete" id={item.id} />
        )}
      </div>
    </td>
  </tr>
);



  const [data, count] = await prisma.$transaction([

    prisma.teacher.findMany({
      where: query,


      include: {
        subjectOfferings: {
          include: {
            subject: true,
            semester: {include: {course: true}
          }
        }
      },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1)
    }),
    prisma.teacher.count({ where: query }),
  ]);



  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 teacherspage">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            
            {role === "admin" && (
              // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              //   <Image src="/plus.png" alt="" width={14} height={14} />
              // </button>
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherListPage;
