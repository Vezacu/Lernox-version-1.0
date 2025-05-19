import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import StudentFilters from "@/components/StudentFilters"; // Import the new component
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma, Student, Course, Semester } from "@prisma/client"; //CT
import Image from "next/image";
import Link from "next/link";

type StudentList = Student & { course: Course; currentSemester: Semester }; //CT
//CT

const StudentListPage = async ({
  searchParams,
  courses,
  semesters,
}: {
  searchParams: { [key: string]: string | undefined };
  courses: Course[];
  semesters: Semester[];
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, sort, courseId, semesterId, ...queryParams } = searchParams; // Extract search parameters from URL

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.StudentWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            query.currentSemester = {
              subjectOfferings: {
                some: {
                  teacherId: value,
                },
              },
            };
            break;
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // Add courseId filter to the query
  
  const orderBy: Prisma.StudentOrderByWithRelationInput = {};
  if (sort === "asc" || sort === "desc") {
    orderBy.name = sort;
  }

  if (courseId) {
    const parsedCourseId = parseInt(courseId);
    if (!isNaN(parsedCourseId)) {
      query.courseId = parsedCourseId;
    }
  }
  
  // Add semesterId filter with safer parsing
  if (semesterId) {
    const parsedSemesterId = parseInt(semesterId);
    if (!isNaN(parsedSemesterId)) {
      query.currentSemesterId = parsedSemesterId;
    }
  }

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    // {
    //   header: "Grade",
    //   accessor: "grade",
    //   className: "hidden md:table-cell",
    // },
    {
      //CT to
      header: "Course",
      accessor: "course",
      className: "hidden md:table-cell",
    },
    {
      header: "Semester",
      accessor: "semester",
      className: "hidden md:table-cell",
    }, //this

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
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: StudentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
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
          <p className="text-xs text-gray-500">
            {item.course?.name} - Semester {item.currentSemester?.number}
          </p>{" "}
          {/*CT*/}
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">{item.course?.name}</td> {/*CT*/}
      <td className="hidden md:table-cell">
        Sem {item.currentSemester?.number}
      </td>{" "}
      {/*CT*/}
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <FormContainer table="student" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );
  const [data, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: {
        course: true,
        currentSemester: {
          select: {
            id: true,
            number: true,
          },
        },
      } as Prisma.StudentInclude,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy,
    }),
    prisma.student.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Students</h1>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <StudentFilters courses={courses} semesters={semesters} />{" "}
          {/* Replace buttons with the new component */}
          {role === "admin" && <FormContainer table="student" type="create" />}
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const [courses, semesters] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        duration: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.semester.findMany({
      select: {
        id: true,
        number: true,
        courseId: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        number: 'asc',
      },
    }),
  ]);

  return <StudentListPage searchParams={searchParams} courses={courses} semesters={semesters} />;
}