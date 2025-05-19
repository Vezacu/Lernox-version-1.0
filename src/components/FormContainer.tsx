
import { Form } from "react-hook-form";
import FormModal from "./FormModal";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import StudentForm from "./forms/StudentForm";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "course"
    | "subjectOffering"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  relatedData?: any; // Add this to support external relatedData passing
};

const FormContainer = async ({ table, type, data, id, relatedData: externalRelatedData }: FormContainerProps) => {
  // If external related data is provided, use it. Otherwise, initialize an empty object
  let relatedData = externalRelatedData || {};

  // Only fetch related data if not provided externally and not a delete operation
  if (!externalRelatedData && type !== "delete") {
    switch (table) {
      case "subject":
        // No additional data needed for subjects
        break;

      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        const teacherCourses = await prisma.course.findMany({
          select: { id: true, name: true, code: true },
        });
        const teacherSemesters = await prisma.semester.findMany({
          select: { id: true, number: true, courseId: true },
        });
        const teacherSubjectOfferings = await prisma.subjectOffering.findMany({
          select: {
            id: true,
            subjectId: true,
            semesterId: true,
            subject: {
              select: { name: true },
            },
            semester: {
              select: { number: true },
            },
          },
        });

        relatedData = {
          subjects: teacherSubjects,
          courses: teacherCourses,
          semesters: teacherSemesters,
          subjectOfferings: teacherSubjectOfferings,
        };
        break;

      //CT
      case "student":
        const studentCourses = await prisma.course.findMany();
        const studentSemesters = await prisma.semester.findMany({
          where: { courseId: data?.courseId },
        });
        relatedData = {
          courses: studentCourses,
          semesters: studentSemesters,
        };
        break;

      //CT
      case "subjectOffering":
        const subjects = await prisma.subject.findMany();
        const courses = await prisma.course.findMany();
        const semesters = await prisma.semester.findMany();
        const teachers = await prisma.teacher.findMany();

        relatedData = {
          subjects,
          courses,
          semesters,
          teachers,
        };
        break;
      //CT

      // case "exam":
      //   const { userId, sessionClaims } = await auth();
      //   const role = (
      //     sessionClaims?.metadata as {
      //       role?: "admin" | "teacher" | "student" | "parent";
      //     }
      //   )?.role;
      //   const examLessons = await prisma.lesson.findMany({
      //     where: {
      //       ...(role === "teacher" ? { teacherId: userId! } : {}),
      //     },
      //     select: { id: true, name: true },
      //   });
      //   relatedData = { lessons: examLessons };
      //   break;

      // Add to the existing switch case
      case "attendance":
        const attendanceStudents = await prisma.student.findMany();
        const attendanceLessons = await prisma.lesson.findMany({
          include: {
            subjectOffering: {
              include: {
                subject: true,
                semester: true,
              },
            },
          },
        });
        relatedData = {
          students: attendanceStudents,
          lessons: attendanceLessons,
        };
        break;

      // Add new case for assignment
      case "assignment":
        const assignmentCourses = await prisma.course.findMany({
          select: { id: true, name: true, code: true, duration: true },
        });
        
        // If we have a course ID in the data, filter semesters by it
        const assignmentSemesters = await prisma.semester.findMany({
          where: data?.courseId ? { courseId: data.courseId } : {},
          select: { 
            id: true, 
            number: true, 
            courseId: true, 
            startDate: true, 
            endDate: true 
          },
          orderBy: { number: 'asc' }
        });
        
        relatedData = {
          courses: assignmentCourses,
          semesters: assignmentSemesters
        };
        break;
        
      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

const forms = {
  student: (setOpen: any, type: string, data?: any, relatedData?: any) => (
    <StudentForm
      type={type as "create" | "update"}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  // ...other forms
};

export default FormContainer;
