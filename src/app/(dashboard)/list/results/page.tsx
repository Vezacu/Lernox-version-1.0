import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import ResultList from "@/components/ResultList";
import { Prisma } from "@prisma/client";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, courseId, semesterId, subjectId, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build the query
  const query: Prisma.StudentWhereInput = {};
  
  if (queryParams.search) {
    query.name = { contains: queryParams.search, mode: "insensitive" };
  }

  if (courseId) {
    const parsedCourseId = parseInt(courseId);
    if (!isNaN(parsedCourseId)) {
      query.courseId = parsedCourseId;
    }
  }

  if (semesterId) {
    const parsedSemesterId = parseInt(semesterId);
    if (!isNaN(parsedSemesterId)) {
      query.currentSemesterId = parsedSemesterId;
    }
  }

  // First, get the students data
  const [data, count] = await Promise.all([
    prisma.student.findMany({
      where: query,
      select: {
        id: true,  // This is the Clerk-generated ID
        name: true,
        surname: true,
        course: true,
        currentSemester: {
          select: {
            id: true,
            number: true,
          },
        },
        results: subjectId ? {
          where: {
            subjectId: parseInt(subjectId)
          },
          select: {
            id: true,
            internal: true,
            external: true,
            attendance: true,
            total: true,
            subjectId: true
          }
        } : false
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        surname: 'asc'
      },
    }),
    prisma.student.count({ where: query })
  ]);

  // Add debug logging
  console.log('Student data:', data.map(student => ({ id: student.id, name: student.name })));

  // Then get the rest of the data using the first student's ID
  const [courses, semesters, subjects, attendance] = await Promise.all([
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
    // Update subjects query to match your schema
    prisma.subject.findMany({
      where: {
        subjectOfferings: {
          some: {
            semesterId: semesterId ? parseInt(semesterId) : undefined,
            enrollments: {
              some: {
                studentId: data[0]?.id || '',
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        subjectOfferings: {
          where: {
            semesterId: semesterId ? parseInt(semesterId) : undefined,
            enrollments: {
              some: {
                studentId: data[0]?.id || '',
                status: 'ACTIVE'
              }
            }
          },
          select: {
            id: true,
            semester: true
          }
        },
        results: true // Include results if needed
      }
    }),
    prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        lesson: {
          subjectOffering: {
            semesterId: semesterId ? parseInt(semesterId) : undefined
          }
        }
      },
      _count: {
        present: true,
        id: true
      }
    })
  ]);

  // Log for debugging
  console.log('Fetched subjects:', subjects);

  return (
    <ResultList
      data={data}
      count={count}
      page={p}
      courses={courses}
      semesters={semesters}
      subjects={subjects}
      attendance={attendance}
      role={role}
    />
  );
}