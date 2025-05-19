import Announcements from "@/components/Announcements";
import EventCalendar from "@/components/EventCalendar";
import StudentLessonsDisplay from "@/components/StudentLessonsDisplay";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const StudentPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please log in to view this page</div>;
  }

  try {
    // Get student with course and semester info
    const student = await prisma.student.findUnique({
      where: { id: userId },
      include: {
        course: true,
        currentSemester: {
          include: {
            subjectOfferings: {
              include: {
                subject: true,
                teacher: true,
                lessons: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return <div>Student record not found</div>;
    }

    if (!student.courseId || !student.currentSemesterId) {
      return <div>Course or semester not assigned</div>;
    }

    return (
      <div className="p-4 flex gap-4 flex-col xl:flex-row">
        {/* LEFT */}
        <div className="w-full xl:w-2/3">
          <div className="h-full bg-white p-4 rounded-md">
            <h1 className="text-xl font-semibold">
              Schedule ({student.course!.name} - Semester {student.currentSemester?.number})
            </h1>
            {/* Replace BigCalendarContainer with StudentLessonsDisplay */}
            {student.currentSemester && (
              <StudentLessonsDisplay 
                studentId={userId} 
                startHour={9}   // Start at 9 AM
                endHour={16}    // End at 4 PM (16:00)
              />
            )}
          </div>
          
        </div>
        {/* RIGHT */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4">
          <Announcements />
          <EventCalendar />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading student page:", error);
    return <div>Error loading student information</div>;
  }
};

export default StudentPage;