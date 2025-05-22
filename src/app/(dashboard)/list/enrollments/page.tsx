import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import EnrollmentManager from "@/components/EnrollmentManager";
import { z } from "zod";
import { enrollStudent, batchEnroll, removeEnrollment } from "@/lib/actions";
import '@/components/cssfile/menuPages.css';
// Enrollment form schema
const enrollmentFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  subjectOfferingId: z.coerce.number().min(1, "Subject offering is required"),
});

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Check permissions
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-md">
        You don&apos;t have permission to access this page.
      </div>
    );
  }

  // Parse filter parameters
  const courseId = searchParams.courseId ? parseInt(searchParams.courseId) : undefined;
  const semesterId = searchParams.semesterId ? parseInt(searchParams.semesterId) : undefined;
  const studentId = searchParams.studentId;

  // Build query conditions
  let whereCondition: any = {};

  if (role === "teacher") {
    // Teachers can only see enrollments for their subject offerings
    whereCondition.subjectOffering = {
      teacherId: userId,
    };
  }

  if (courseId) {
    whereCondition.subjectOffering = {
      ...whereCondition.subjectOffering,
      semester: {
        ...whereCondition.subjectOffering?.semester,
        courseId,
      },
    };
  }

  if (semesterId) {
    whereCondition.subjectOffering = {
      ...whereCondition.subjectOffering,
      semesterId,
    };
  }

  if (studentId) {
    whereCondition.studentId = studentId;
  }

  // Fetch enrollments with related data
  const enrollments = await prisma.enrollment.findMany({
    where: whereCondition,
    include: {
      student: true,
      subjectOffering: {
        include: {
          subject: true,
          semester: {
            include: {
              course: true,
            },
          },
          teacher: true,
        },
      },
    },
    orderBy: [
      { student: { surname: "asc" } },
      { student: { name: "asc" } },
    ],
  });

  // Fetch courses
  const courses = await prisma.course.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch semesters with appropriate filtering
  const semestersQuery: any = {};
  if (courseId) {
    semestersQuery.courseId = courseId;
  }

  const semesters = await prisma.semester.findMany({
    where: semestersQuery,
    orderBy: [
      { courseId: "asc" },
      { number: "asc" },
    ],
  });

  // Fetch students with appropriate filtering
  const studentsQuery: any = {};
  if (courseId) {
    studentsQuery.courseId = courseId;
  }
  if (semesterId) {
    studentsQuery.currentSemesterId = semesterId;
  }

  const students = await prisma.student.findMany({
    where: studentsQuery,
    orderBy: [
      { surname: "asc" },
      { name: "asc" },
    ],
  });

  // Fetch subject offerings with appropriate filtering
  const subjectOfferingsQuery: any = {};
  if (role === "teacher") {
    subjectOfferingsQuery.teacherId = userId;
  }
  if (courseId) {
    subjectOfferingsQuery.semester = {
      ...subjectOfferingsQuery.semester,
      courseId,
    };
  }
  if (semesterId) {
    subjectOfferingsQuery.semesterId = semesterId;
  }

  const subjectOfferings = await prisma.subjectOffering.findMany({
    where: subjectOfferingsQuery,
    include: {
      subject: true,
      semester: {
        include: {
          course: true,
        },
      },
      teacher: true,
    },
    orderBy: [
      { semester: { courseId: "asc" } },
      { semester: { number: "asc" } },
      { subject: { name: "asc" } },
    ],
  });

  return (
    <div className="m-4">
      <EnrollmentManager
        initialEnrollments={enrollments}
        students={students}
        subjectOfferings={subjectOfferings}
        courses={courses}
        semesters={semesters}
        enrollStudent={enrollStudent}
        batchEnroll={batchEnroll}
        removeEnrollment={removeEnrollment}
      />
    </div>
  );
}
