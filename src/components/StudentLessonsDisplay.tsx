import React from 'react';
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { LessonStatus } from "@prisma/client";

interface StudentLessonsDisplayProps {
  studentId: string;
  startHour?: number; // Optional start hour (default: 8)
  endHour?: number;   // Optional end hour (default: 20)
}

const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const StudentLessonsDisplay = async ({ 
  studentId, 
  startHour = 8, 
  endHour = 20 
}: StudentLessonsDisplayProps) => {
  // Fetch the student to get their current semester
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      currentSemester: true,
      course: true
    }
  });

  if (!student || !student.currentSemesterId) {
    return <div className="p-4 text-center text-gray-500">No semester data available</div>;
  }

  // Fetch lessons for the current semester
  const lessons = await prisma.lesson.findMany({
    where: {
      subjectOffering: {
        semesterId: student.currentSemesterId
      }
    },
    include: {
      subjectOffering: {
        include: {
          subject: true,
          teacher: true,
          semester: true
        }
      }
    },
    orderBy: [
      { day: "asc" },
      { startTime: "asc" }
    ]
  });

  // Group lessons by day for timetable view
  const timetable = daysOrder.map(day => ({
    day,
    periods: lessons.filter(lesson => lesson.day === day)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }));

  // Format time for display
  const formatTime = (dateTime: Date) => {
    return format(dateTime, 'h:mm a');
  };

  // Get color for lesson status
  const getStatusColor = (status: LessonStatus) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 border border-green-300 text-green-800';
      case 'CANCELLED': return 'bg-red-100 border border-red-300 text-red-800';
      default: return 'bg-blue-50 border border-blue-300 text-blue-800';
    }
  };

  // Get color for day header
  const getDayHeaderColor = (day: string) => {
    const index = daysOrder.indexOf(day);
    return index % 2 === 0 
      ? 'bg-amber-100 text-amber-800' 
      : 'bg-sky-100 text-sky-800';
  };

  // Get background color for empty cells
  const getEmptyCellColor = (day: string) => {
    const index = daysOrder.indexOf(day);
    return index % 2 === 0 
      ? 'bg-amber-50' 
      : 'bg-sky-50';
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">My Class Schedule</h2>
      
      {/* Timetable view */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-6 gap-1 mt-4">
          {/* Header row */}
          <div className="col-span-1 font-medium p-2 bg-gray-100 rounded-md text-center text-gray-700">Time</div>
          {daysOrder.map(day => (
            <div 
              key={day} 
              className={`col-span-1 font-medium p-2 rounded-md text-center ${getDayHeaderColor(day)}`}
            >
              {day.slice(0, 3)}
            </div>
          ))}

          {/* Time slots */}
          {Array.from({ length: endHour - startHour }).map((_, timeIndex) => {
            const startHourValue = startHour + timeIndex;
            const startAmPm = startHourValue < 12 ? 'AM' : 'PM';
            const endHourValue = startHourValue + 1;
            const endAmPm = endHourValue < 12 ? 'AM' : 'PM';
            
            // Convert to 12-hour format
            const displayStartHour = startHourValue > 12 ? startHourValue - 12 : (startHourValue === 0 ? 12 : startHourValue);
            const displayEndHour = endHourValue > 12 ? endHourValue - 12 : (endHourValue === 0 ? 12 : endHourValue);
            
            const timeRange = `${displayStartHour}:00 ${startAmPm} - ${displayEndHour}:00 ${endAmPm}`;
            
            return (
              <React.Fragment key={timeIndex}>
                <div className="col-span-1 p-2 text-sm text-gray-500 border-t relative">
                  {timeRange}
                </div>
                
                {daysOrder.map(day => {
                  const lesson = timetable.find(d => d.day === day)
                    ?.periods.find(p => {
                      const lessonHour = p.startTime.getHours();
                      return lessonHour === startHourValue;
                    });

                  return (
                    <div 
                      key={day} 
                      className={`p-2 border-t relative min-h-[70px] hover:bg-gray-50 transition-colors ${
                        !lesson ? getEmptyCellColor(day) : ''
                      }`}
                    >
                      {lesson && (
                        <div className={`p-2 rounded-md shadow-sm ${getStatusColor(lesson.status)}`}>
                          <div className="text-sm font-medium">
                            {lesson.subjectOffering.subject.name}
                          </div>
                          <div className="text-xs mt-1">
                            {lesson.subjectOffering.teacher?.name || 'No teacher'} 
                            {lesson.subjectOffering.teacher?.surname && ` ${lesson.subjectOffering.teacher.surname}`}
                          </div>
                          <div className="text-xs mt-1">
                            {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentLessonsDisplay;
