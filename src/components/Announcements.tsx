import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const Announcements = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Get student/teacher details to filter by course/semester
  let whereCondition: any = {};
  
  if (role !== "admin") {
    switch(role) {
      case "student":
        const student = await prisma.student.findUnique({
          where: { id: userId! },
          select: { courseId: true, currentSemesterId: true }
        });
        whereCondition = {
          OR: [
            { courseId: null, semesterId: null }, // Global announcements
            { courseId: student?.courseId },
            { semesterId: student?.currentSemesterId }
          ]
        };
        break;

      case "teacher":
        const teacher = await prisma.teacher.findUnique({
          where: { id: userId! },
          select: {
            subjectOfferings: {
              select: { 
                semesterId: true,
                semester: {
                  select: { courseId: true }
                }
              }
            }
          }
        });
        const teacherSemesters = teacher?.subjectOfferings.map(so => so.semesterId) || [];
        const teacherCourses = teacher?.subjectOfferings.map(so => so.semester.courseId) || [];
        whereCondition = {
          OR: [
            { courseId: null, semesterId: null }, // Global announcements
            { courseId: { in: teacherCourses } },
            { semesterId: { in: teacherSemesters } }
          ]
        };
        break;

      case "parent":
        const parent = await prisma.parent.findUnique({
          where: { id: userId! },
          select: {
            students: {
              select: {
                courseId: true,
                currentSemesterId: true
              }
            }
          }
        });
        const studentCourses = parent?.students.map(s => s.courseId).filter(Boolean) || [];
        const studentSemesters = parent?.students.map(s => s.currentSemesterId).filter(Boolean) || [];
        whereCondition = {
          OR: [
            { courseId: null, semesterId: null }, // Global announcements
            { courseId: { in: studentCourses } },
            { semesterId: { in: studentSemesters } }
          ]
        };
        break;
    }
  }

  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { date: "desc" },
    where: whereCondition,
    include: {
      course: true,
      semester: true
    }
  });

  return (
    <div className="bg-white p-4 rounded-md Announcementbg">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">Announcements</h1>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {data.map((announcement) => (
          <div 
            key={announcement.id}
            className="p-4 rounded-md border-2 border-gray-100 border-l-4 border-l-lamaSky"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-600">{announcement.title}</h2>
              <span className="text-gray-300 text-xs">
                {new Date(announcement.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-400">{announcement.description}</p>
            {(announcement.course || announcement.semester) && (
              <p className="text-xs text-gray-500 mt-2">
                {announcement.course?.name} 
                {announcement.semester && ` - Semester ${announcement.semester.number}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;