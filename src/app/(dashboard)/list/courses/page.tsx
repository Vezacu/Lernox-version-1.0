import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Course, Prisma } from "@prisma/client";
import Image from "next/image";

type CourseList = Course & {
  semesters: { number: number }[];  // Change this to match Prisma schema
};

// Helper function to get first and last semester
const getSemesterCount = (item: CourseList) => {
  const sortedSemesters = item.semesters
    .map(sem => sem.number)
    .sort((a, b) => a - b);
    
  if (sortedSemesters.length === 0) return [];
  if (sortedSemesters.length === 1) return sortedSemesters;
  
  return [
    sortedSemesters[0], 
    sortedSemesters[sortedSemesters.length - 1]
  ];
};

const CourseListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as {role?:string})?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.CourseWhereInput = {};
  
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const columns = [
    {
      header: "Course Name",
      accessor: "name",
    },
    {
      header: "Duration (Years)",
      accessor: "duration",
      className: "hidden md:table-cell",
    },
    {
      header: "Semesters",
      accessor: "semesters",
      className: "hidden md:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];
  
  const renderRow = (item: CourseList) => {
    const semesterNumbers = getSemesterCount(item);
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.name}</td>
        <td className="hidden md:table-cell">{item.duration}</td>
        <td className="hidden md:table-cell">
          <div className="flex gap-2 flex-wrap">
            {semesterNumbers.length > 0 && (
              <>
                <span 
                  key={semesterNumbers[0]}
                  className="px-2 py-1 bg-[#08FF08]  text-black-800 rounded-full text-xs"
                >
                  Sem {semesterNumbers[0]}
                </span>
                {semesterNumbers.length > 1 && (
                  <>
                    <span className="px-2 py-1 text-xs"> - </span>
                    <span 
                      key={semesterNumbers[1]}
                      className="px-2 py-1 bg-[#08FF08] text-black-800 rounded-full text-xs"
                    >
                      Sem {semesterNumbers[1]}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </td>
        <td>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <FormContainer table="course" type="update" data={item} />
                <FormContainer table="course" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const [data, count] = await prisma.$transaction([
    prisma.course.findMany({
      where: query,
      include: {
        semesters: {
          orderBy: {
            number: 'asc'
          }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1)
    }),
    prisma.course.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Courses</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="course" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default CourseListPage;