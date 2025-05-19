import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { LessonStatus } from "@prisma/client";
import Image from "next/image";
import FormModal from "@/components/FormModal";
import { format } from "date-fns";
import LessonFilters from "@/components/LessonFilters";
import React from "react";
import CurrentTimeIndicator from "@/components/CurrentTimeIndicator";

const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

// This component fetches data and renders the page
const LessonsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Build query based on filters
  const query: any = {};
  
  // Apply teacher filter for teacher role
  if (role === "teacher" && userId) {
    query.subjectOffering = { teacherId: userId };
  }
  
  // Apply course filter
  if (searchParams.courseId) {
    query.subjectOffering = {
      ...query.subjectOffering,
      semester: { 
        ...query.subjectOffering?.semester,
        courseId: parseInt(searchParams.courseId) 
      }
    };
  }
  
  // Apply semester filter
  if (searchParams.semesterId) {
    query.subjectOffering = {
      ...query.subjectOffering,
      semesterId: parseInt(searchParams.semesterId)
    };
  }
  
  // Apply day filter
  if (searchParams.day) {
    query.day = searchParams.day;
  }

  // Fetch lessons with relations
  const lessons = await prisma.lesson.findMany({
    where: query,
    include: {
      subjectOffering: {
        include: {
          subject: true,
          teacher: true,
          semester: {
            include: {
              course: true
            }
          }
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

  // Fetch data for filters
  const [courses, semesters] = await Promise.all([
    prisma.course.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.semester.findMany({
      include: { course: true },
      orderBy: [
        { courseId: 'asc' },
        { number: 'asc' }
      ]
    })
  ]);

  // Get subject offerings for the form modal
  const subjectOfferings = await prisma.subjectOffering.findMany({
    include: {
      subject: true,
      teacher: true,
      semester: true
    }
  });

  const relatedData = {
    courses,
    semesters,
    subjectOfferings
  };

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
    const isHighlighted = searchParams.day === day;
    if (isHighlighted) return 'bg-blue-100 text-blue-800';
    
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
    <div className="bg-white p-4 md:p-6 rounded-md shadow-sm m-4 mt-0 flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-lg font-semibold text-gray-800">College Timetable</h1>
        <div className="flex items-center gap-4">
          {role === "admin" && (
            <FormModal 
              table="lesson" 
              type="create" 
              relatedData={relatedData}
            />
          )}
        </div>
      </div>

      {/* Client component for filters */}
      <LessonFilters courses={courses} semesters={semesters} lessons={lessons} />

      {/* Timetable view */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-6 gap-1 mt-6">
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
{Array.from({ length: 7 }).map((_, timeIndex) => {  // Changed to 7 slots (9 AM to 4 PM)
  const startHour = 9 + timeIndex;  // Start from 9 AM
  const startAmPm = startHour < 12 ? 'AM' : 'PM';
  const endHour = startHour + 1;
  const endAmPm = endHour < 12 ? 'AM' : 'PM';
  
  // Convert to 12-hour format
  const displayStartHour = startHour > 12 ? startHour - 12 : startHour;
  const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
  
  const timeRange = `${displayStartHour}:00 ${startAmPm} - ${displayEndHour}:00 ${endAmPm}`;
  
  return (
    <React.Fragment key={timeIndex}>
      <div className="col-span-1 p-2 text-sm text-gray-500 border-t relative">
        {timeRange}
        
        {/* Current time indicator component (client component) */}
        <CurrentTimeIndicator 
          hourIndex={timeIndex} 
          startHour={startHour} 
        />
      </div>
      
      {daysOrder.map(day => {
        // Only show days that match the filter if a day filter is applied
        if (searchParams.day && searchParams.day !== day) {
          return (
            <div 
              key={day} 
              className="p-2 border-t min-h-[80px] bg-gray-100"
            />
          );
        }

        const lesson = timetable.find(d => d.day === day)
          ?.periods.find(p => {
            const lessonHour = p.startTime.getHours();
            return lessonHour === startHour;
          });

        return (
          <div 
            key={day} 
            className={`p-2 border-t relative min-h-[80px] hover:bg-gray-50 transition-colors ${
              !lesson ? getEmptyCellColor(day) : ''
            }`}
          >
            {lesson && (
              <div className={`p-2 rounded-md shadow-sm ${getStatusColor(lesson.status)}`}>
                <div className="text-sm font-medium">
                  {lesson.subjectOffering.subject.name}
                </div>
                <div className="text-xs mt-1">
                  {lesson.subjectOffering.teacher.name} {lesson.subjectOffering.teacher.surname}
                </div>
                <div className="text-xs mt-1">
                  {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                </div>
                {(role === "admin" || (role === "teacher" && lesson.subjectOffering.teacherId === userId)) && (
                  <div className="flex gap-2 mt-2">
                    <FormModal 
                      table="lesson" 
                      type="update" 
                      data={{
                        ...lesson,
                        // Include course and semester data
                        courseId: lesson.subjectOffering.semester.courseId,
                        semesterId: lesson.subjectOffering.semesterId
                      }}
                      relatedData={relatedData}
                    />
                    {role === "admin" && <FormModal table="lesson" type="delete" id={lesson.id} />}
                  </div>
                )}
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

export default LessonsPage;
