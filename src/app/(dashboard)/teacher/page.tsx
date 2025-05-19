
import Announcements from "@/components/Announcements";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { LessonStatus } from "@prisma/client";
import React from "react";

const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const TeacherPage = async () => {
  const { userId } = await auth();
  const currentUserId = userId;

  if (!currentUserId) {
    return <div>Error: User not authenticated</div>;
  }

  // Fetch teacher data with subject offerings
  const teacher = await prisma.teacher.findUnique({
    where: {
      id: currentUserId
    },
    include: {
      subjectOfferings: {
        include: {
          subject: true,
          semester: true
        }
      }
    }
  });

  if (!teacher) {
    return (
      <div className="flex-1 p-4">
        <div className="w-full bg-white p-4 rounded-md shadow-sm">
          <div className="text-center text-red-500 py-8">
            Teacher profile not found. Please contact administration.
          </div>
        </div>
      </div>
    );
  }

  // Fetch all lessons for this teacher
  const subjectOfferingIds = teacher.subjectOfferings.map(offering => offering.id);
  const lessons = await prisma.lesson.findMany({
    where: {
      subjectOfferingId: {
        in: subjectOfferingIds
      }
    },
    include: {
      subjectOffering: {
        include: {
          subject: true,
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

  // Fixed hours for teacher schedule - updated to 9 AM to 4 PM
  const startHour = 9;
  const endHour = 16;

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT - Teacher Schedule */}
      <div className="w-full xl:w-2/3 flex flex-col gap-6">
        <div className="w-full bg-white p-4 rounded-md shadow-sm">
          <h1 className="text-xl font-semibold mb-4">
            {teacher.name} {teacher.surname}'s Teaching Schedule
          </h1>
          
          {lessons.length > 0 ? (
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
                                    Semester {lesson.subjectOffering.semester.number}
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
          ) : (
            <div className="text-center text-gray-500 py-8">
              No lessons assigned yet. Please wait for admin to assign your teaching schedule.
            </div>
          )}
        </div>

        {/* Additional section for upcoming lessons */}
        <div className="w-full bg-white p-4 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Lessons</h2>
          
          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons
                .filter(lesson => lesson.status === 'SCHEDULED')
                .slice(0, 5)
                .map(lesson => (
                  <div 
                    key={lesson.id} 
                    className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{lesson.subjectOffering.subject.name}</div>
                        <div className="text-sm text-gray-600">
                          {format(lesson.startTime, 'EEEE, MMMM d, yyyy')} • {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Semester {lesson.subjectOffering.semester.number}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                ))}

              {lessons.filter(lesson => lesson.status === 'SCHEDULED').length === 0 && (
                <div className="text-center text-gray-500 py-3">
                  No upcoming lessons scheduled at this time.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-3">
              No lessons assigned yet.
            </div>
          )}
        </div>

        {/* Recent lesson completions */}
        <div className="w-full bg-white p-4 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recently Completed Lessons</h2>
          
          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons
                .filter(lesson => lesson.status === 'COMPLETED')
                .slice(0, 3)
                .map(lesson => (
                  <div 
                    key={lesson.id} 
                    className="p-3 border border-green-200 rounded-md bg-green-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{lesson.subjectOffering.subject.name}</div>
                        <div className="text-sm text-gray-600">
                          {format(lesson.startTime, 'EEEE, MMMM d, yyyy')} • {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}

              {lessons.filter(lesson => lesson.status === 'COMPLETED').length === 0 && (
                <div className="text-center text-gray-500 py-3">
                  No completed lessons yet.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-3">
              No lessons assigned yet.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT - Announcements and Summary */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        {/* Announcements */}
        <div className="w-full bg-white p-4 rounded-md shadow-sm">
          <Announcements />
        </div>

        {/* Teaching Summary */}
        <div className="w-full bg-white p-4 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Teaching Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 border-b">
              <span className="font-medium">Total Subjects</span>
              <span className="font-semibold">{new Set(lessons.map(l => l.subjectOffering.subject.id)).size}</span>
            </div>
            <div className="flex justify-between items-center p-2 border-b">
              <span className="font-medium">Total Lessons</span>
              <span className="font-semibold">{lessons.length}</span>
            </div>
            <div className="flex justify-between items-center p-2 border-b">
              <span className="font-medium">Completed</span>
              <span className="font-semibold">{lessons.filter(l => l.status === 'COMPLETED').length}</span>
            </div>
            <div className="flex justify-between items-center p-2 border-b">
              <span className="font-medium">Scheduled</span>
              <span className="font-semibold">{lessons.filter(l => l.status === 'SCHEDULED').length}</span>
            </div>
            <div className="flex justify-between items-center p-2">
              <span className="font-medium">Cancelled</span>
              <span className="font-semibold">{lessons.filter(l => l.status === 'CANCELLED').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
