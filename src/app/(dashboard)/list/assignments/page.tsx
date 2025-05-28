import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AssignmentFilters from "@/components/AssignmentFilters";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Assignment, Prisma } from "@prisma/client";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import InteractiveRow from "@/components/InteractiveRow";
import { format } from "date-fns";
import '@/components/cssfile/menuPages.css';

// Original assignment type from database
type AssignmentData = Assignment & {
  course: { name: string } | null;
  semester: { number: number } | null;
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Add authorization check
  if (!userId || !["admin", "teacher", "student", "parent"].includes(role?.toLowerCase() || "")) {
    redirect("/sign-in");
  }
  
  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Course", 
      accessor: "course",
    },
    {
      header: "Semester",
      accessor: "semester",
    },
    {
      header: "Start Date",
      accessor: "startDate",
    },
    {
      header: "Due Date",
      accessor: "endDate",
    },
    {
      header: "Actions", // Always show Actions column
      accessor: "action",
    }
  ];
  
  const { page, courseId, semesterId, status, sort, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.AssignmentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }
  
  // Add course filter
  if (courseId) {
    query.courseId = parseInt(courseId);
  }
  
  // Add semester filter
  if (semesterId) {
    query.semesterId = parseInt(semesterId);
  }
  
  // Add status filter (upcoming, active, past)
  if (status) {
    const now = new Date();
    
    switch (status) {
      case "upcoming":
        query.startDate = { gt: now };
        break;
      case "active":
        query.startDate = { lte: now };
        query.dueDate = { gte: now };
        break;
      case "past":
        query.dueDate = { lt: now };
        break;
    }
  }

  // Determine sort order
  let orderBy: Prisma.AssignmentOrderByWithRelationInput;
  
  if (sort) {
    orderBy = {
      title: sort === 'asc' ? 'asc' : 'desc'
    };
  } else {
    orderBy = { 
      // Use dueDate as the default sort field 
      dueDate: 'desc' as Prisma.SortOrder
    };
  }

  // Get courses and semesters for filters
  const courses = await prisma.course.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  
  const semesters = await prisma.semester.findMany({
    select: { id: true, number: true, courseId: true },
    orderBy: { number: 'asc' }
  });

  const data = await prisma.assignment.findMany({
    where: query,
    include: {
      course: {
        select: { 
          name: true 
        }
      },
      semester: {
        select: { 
          number: true 
        }
      }
    },
    orderBy: orderBy,
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
  });

  const count = await prisma.assignment.count({ where: query });

  // Create a related data object that contains courses and semesters
  const formRelatedData = {
    courses,
    semesters
  };

  // Modify the renderRow function to show view button for students
  const renderRow = (assignment: AssignmentData) => {
    return (
      <tr className="border-b border-gray-200 enrollmenthover" key={assignment.id}>
        <td className="p-3">{assignment.title}</td>
        <td className="p-3">{assignment.course?.name || "N/A"}</td>
        <td className="p-3">{assignment.semester ? `Semester ${assignment.semester.number}` : "N/A"}</td>
        <td className="p-3">{format(new Date(assignment.startDate), "MMM dd, yyyy")}</td>
        <td className="p-3">{format(new Date(assignment.dueDate), "MMM dd, yyyy")}</td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer 
                  table="assignment" 
                  type="update" 
                  data={assignment} 
                  relatedData={formRelatedData}
                />
                <FormContainer 
                  table="assignment" 
                  type="delete" 
                  id={assignment.id}
                />
              </>
            )}
            {/* View button shown to all roles */}
            <a 
              href={`/list/assignments/${assignment.id}`}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#08FF08] "
            >
              <Image src="/view.png" alt="View" width={14} height={14} />
            </a>
          </div>
        </td>
      </tr>
    );
  };

  // Update the return JSX to show/hide create button based on role
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 assignmentpage">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Assignments
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            
            {(role === "admin" || role === "teacher") && (
              <FormContainer 
                table="assignment" 
                type="create"
                relatedData={formRelatedData}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* FILTERS */}
      <div className="my-4">
        <AssignmentFilters courses={courses} semesters={semesters} />
      </div>
      
      {/* LIST */}
      {data.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No assignments found</p>
        </div>
      ) : (
        <Table columns={columns} renderRow={renderRow} data={data} />
      )}
      
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;
