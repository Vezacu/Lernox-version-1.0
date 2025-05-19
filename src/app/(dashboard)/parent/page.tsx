import Announcements from "@/components/Announcements";
import StudentLessonsDisplay from "@/components/StudentLessonsDisplay";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const ParentPage = async () => {
  const { userId } = await auth();
  const currentUserId = userId;

  if (!currentUserId) {
    // Handle the case where currentUserId is null
    return <div>Error: User not authenticated</div>;
  }

  // Fetch students linked to the parent with their courses and semesters
  const students = await prisma.student.findMany({
    where: {
      parentId: currentUserId,
    },
    include: {
      course: true,
      currentSemester: true
    }
  });
  
  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT - Student Schedules */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        {students.length > 0 ? (
          students.map((student) => (
            <div className="w-full bg-white p-4 rounded-md shadow-sm" key={student.id}>
              <h1 className="text-xl font-semibold mb-4">
                {student.name} {student.surname}'s Schedule
              </h1>
              <div className="text-sm text-gray-500 mb-3">
                {student.course?.name}{student.currentSemester ? ` - Semester ${student.currentSemester.number}` : ''}
              </div>
              <StudentLessonsDisplay 
                studentId={student.id} 
                startHour={9} 
                endHour={16} 
              />
            </div>
          ))
        ) : (
          <div className="w-full bg-white p-4 rounded-md shadow-sm">
            <div className="text-center text-gray-500 py-8">
              No students linked to your account
            </div>
          </div>
        )}
      </div>
      {/* RIGHT - Announcements */}
      <div className="w-full xl:w-1/3">
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
