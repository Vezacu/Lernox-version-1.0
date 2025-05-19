import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format, getDaysInMonth } from "date-fns";
import AttendanceFilters from "@/components/AttendanceFilters";
import FormModal from "@/components/FormModal";

// This component fetches data and renders the attendance page
const AttendancesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Default date is today if not specified
  const selectedDateStr = searchParams.date || format(new Date(), "yyyy-MM-dd");
  const selectedDate = new Date(selectedDateStr);
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();
  
  // Build base query based on filters
  const query: any = {};

  // Apply teacher filter for teacher role
  if (role === "teacher" && userId) {
    query.lesson = {
      subjectOffering: {
        teacherId: userId
      }
    };
  }

  // Apply course filter
  if (searchParams.courseId) {
    query.lesson = {
      ...query.lesson,
      subjectOffering: {
        ...query.lesson?.subjectOffering,
        semester: {
          ...query.lesson?.subjectOffering?.semester,
          courseId: parseInt(searchParams.courseId)
        }
      }
    };
  }

  // Apply semester filter
  if (searchParams.semesterId) {
    query.lesson = {
      ...query.lesson,
      subjectOffering: {
        ...query.lesson?.subjectOffering,
        semesterId: parseInt(searchParams.semesterId)
      }
    };
  }

  // Apply weekday filter
  if (searchParams.weekday) {
    query.lesson = {
      ...query.lesson,
      day: searchParams.weekday
    };
  }

  // Apply lesson filter
  if (searchParams.lessonId) {
    query.lessonId = parseInt(searchParams.lessonId);
  }

  // Add date (month) filter
  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
  
  query.date = {
    gte: startOfMonth,
    lte: endOfMonth
  };

  // Fetch all attendances for the specified filters
  const attendances = await prisma.attendance.findMany({
    where: query,
    include: {
      student: true,
      lesson: {
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
        }
      }
    },
    orderBy: [
      { date: 'asc' },
      { studentId: 'asc' }
    ]
  });

  // Fetch courses, semesters, and subject offerings for filters
  const [courses, semesters, subjectOfferings, lessons] = await Promise.all([
    prisma.course.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.semester.findMany({
      include: { course: true },
      orderBy: [
        { courseId: 'asc' },
        { number: 'asc' }
      ]
    }),
    prisma.subjectOffering.findMany({
      include: {
        subject: true,
        teacher: true,
        semester: {
          include: {
            course: true
          }
        }
      },
      where: role === "teacher" ? { teacherId: userId as string } : undefined,
      orderBy: [
        { semester: { courseId: 'asc' } },
        { semester: { number: 'asc' } },
        { subject: { name: 'asc' } }
      ]
    }),
    prisma.lesson.findMany({
      where: role === "teacher" 
        ? { subjectOffering: { teacherId: userId as string } } 
        : undefined,
      include: {
        subjectOffering: {
          include: {
            subject: true,
            semester: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })
  ]);

  // Fetch students based on filters
  // Build student query based on course and semester selection
  let studentsQuery: any = {};
  
  if (searchParams.courseId) {
    studentsQuery.courseId = parseInt(searchParams.courseId);
  }
  
  if (searchParams.semesterId) {
    // We can either filter by currentSemesterId or use enrollments
    // Using currentSemesterId is more direct
    studentsQuery.currentSemesterId = parseInt(searchParams.semesterId);
  }
  
  // Fetch all students matching the course/semester filter
  let filteredStudents: any[] = await prisma.student.findMany({
    where: studentsQuery,
    orderBy: [
      { surname: 'asc' },
      { name: 'asc' }
    ]
  });

  // If a specific lesson is selected, further filter students by enrollment
  if (searchParams.lessonId && filteredStudents.length > 0) {
    const lessonId = parseInt(searchParams.lessonId);
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { subjectOffering: true }
    });
    
    if (lesson) {
      // Get students enrolled in this specific subject offering
      const enrollmentStudentIds = await prisma.enrollment.findMany({
        where: { subjectOfferingId: lesson.subjectOffering.id },
        select: { studentId: true }
      });
      
      // Convert to a set for faster lookups
      const enrolledIds = new Set(enrollmentStudentIds.map(e => e.studentId));
      
      // Filter students to only those enrolled in this subject offering
      filteredStudents = filteredStudents.filter(student => 
        enrolledIds.has(student.id)
      );
    }
  }

  // Sort students by surname then name
  filteredStudents.sort((a, b) => {
    if (a.surname !== b.surname) {
      return a.surname.localeCompare(b.surname);
    }
    return a.name.localeCompare(b.name);
  });

  // Get number of days in the selected month
  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
  
  // Create a date array for the month (for column headers)
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    return new Date(selectedYear, selectedMonth, i + 1);
  });

  // Filter dates based on weekday if specified
  let displayDates = dates;
  if (searchParams.weekday) {
    // Map the weekday to a day number (0-6)
    const weekdayMap: { [key: string]: number } = {
      'MONDAY': 1,
      'TUESDAY': 2,
      'WEDNESDAY': 3,
      'THURSDAY': 4,
      'FRIDAY': 5
    };
    
    const selectedWeekdayNum = weekdayMap[searchParams.weekday];
    
    if (selectedWeekdayNum !== undefined) {
      displayDates = dates.filter(date => date.getDay() === selectedWeekdayNum);
    }
  }

  // Process attendance data into a map for quick lookup
  const attendanceMap = new Map();
  for (const attendance of attendances) {
    const key = `${attendance.studentId}_${format(attendance.date, 'yyyy-MM-dd')}`;
    attendanceMap.set(key, attendance);
  }

  // Get the selected lesson if any (for the form title/context)
  let selectedLesson = null;
  if (searchParams.lessonId) {
    selectedLesson = lessons.find(l => l.id === parseInt(searchParams.lessonId as string));
  }

  // Prepare related data for forms
  const relatedData = {
    courses,
    semesters,
    subjectOfferings,
    lessons,
    students: filteredStudents,
    selectedDate
  };

  // Get day names for the header (e.g., "Mon", "Tue")
  const getDayName = (date: Date) => {
    return format(date, 'E');
  };

  // Check if a date is a weekend
  const isWeekendDay = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  // Get background color for date cell based on day of week
  const getDateCellColor = (date: Date) => {
    const day = date.getDay();
    if (day === 0) return 'bg-red-100 text-red-800'; // Sunday
    if (day === 6) return 'bg-blue-100 text-blue-800'; // Saturday
    return 'bg-gray-100 text-gray-800'; // Weekday
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return format(date, 'd');
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-md shadow-sm m-4 mt-0 flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-lg font-semibold text-gray-800">Attendance Management</h1>
        <div className="flex items-center gap-4">
          {(role === "admin" || role === "teacher") && searchParams.lessonId && (
            <FormModal 
              table="attendance" 
              type="create" 
              relatedData={relatedData}
            />
          )}
        </div>
      </div>

      {/* Client component for filters */}
      <AttendanceFilters 
        courses={courses} 
        semesters={semesters}
        lessons={lessons}
      />

      {/* Context information */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="font-medium mr-2">Selected Month:</span>
            <span>{format(selectedDate, 'MMMM yyyy')}</span>
          </div>
          
          {searchParams.weekday && (
            <div className="flex items-center">
              <span className="font-medium mr-2">Day:</span>
              <span>{searchParams.weekday}</span>
            </div>
          )}
          
          {selectedLesson && (
            <>
              <div className="flex items-center">
                <span className="font-medium mr-2">Subject:</span>
                <span>{selectedLesson.subjectOffering.subject.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Course:</span>
                <span>{selectedLesson.subjectOffering.semester.course?.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Semester:</span>
                <span>{selectedLesson.subjectOffering.semester.number}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Day:</span>
                <span>{selectedLesson.day}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Time:</span>
                <span>{format(selectedLesson.startTime, 'h:mm a')} - {format(selectedLesson.endTime, 'h:mm a')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] mt-4">
          {filteredStudents.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-200 border p-2 sticky left-0 z-10 min-w-[200px]">Student</th>
                  {displayDates.map(date => (
                    <th 
                      key={date.getTime()} 
                      className={`${getDateCellColor(date)} border p-2 text-center w-12`}
                    >
                      <div>{formatDateDisplay(date)}</div>
                      <div className="text-xs">{getDayName(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="border p-2 font-medium sticky left-0 bg-white z-10">
                      {student.surname}, {student.name}
                    </td>
                    {displayDates.map(date => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const key = `${student.id}_${dateStr}`;
                      const attendance = attendanceMap.get(key);
                      const isWeekendClass = isWeekendDay(date);
                      
                      return (
                        <td 
                          key={dateStr} 
                          className={`border p-2 text-center ${
                            isWeekendClass ? 'bg-gray-100' : ''
                          }`}
                        >
                          {isWeekendClass ? (
                            <div className={`inline-block w-5 h-5 rounded-full ${
                              date.getDay() === 0 ? 'bg-red-200' : 'bg-blue-200'
                            }`}></div>
                          ) : (
                            <div className="flex justify-center">
                              {attendance ? (
                                <div className={`w-5 h-5 rounded-sm ${
                                  attendance.present 
                                    ? 'bg-green-500 border border-green-600' 
                                    : 'bg-red-500 border border-red-600'
                                }`}></div>
                              ) : (
                                <div className="w-5 h-5 rounded-sm border border-gray-300 bg-gray-50"></div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">No students found for the selected filters.</p>
              {!searchParams.courseId ? (
                <p className="text-gray-400 text-sm mt-1">Please select a course to view students.</p>
              ) : !searchParams.semesterId ? (
                <p className="text-gray-400 text-sm mt-1">Please select a semester to view students.</p>
              ) : searchParams.lessonId ? (
                <p className="text-gray-400 text-sm mt-1">No students enrolled in the selected lesson.</p>
              ) : (
                <p className="text-gray-400 text-sm mt-1">No students found in the selected course and semester.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border border-green-600 rounded-sm"></div>
          <span className="text-sm text-gray-600">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 border border-red-600 rounded-sm"></div>
          <span className="text-sm text-gray-600">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded-sm"></div>
          <span className="text-sm text-gray-600">Not marked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 rounded-full"></div>
          <span className="text-sm text-gray-600">Sunday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded-full"></div>
          <span className="text-sm text-gray-600">Saturday</span>
        </div>
      </div>
    </div>
  );
};

export default AttendancesPage;
