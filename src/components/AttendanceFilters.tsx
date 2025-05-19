"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent } from "react";
import Image from "next/image";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Course {
  id: number;
  name: string;
}

interface Semester {
  id: number;
  number: number;
  courseId: number;
}

interface Lesson {
  id: number;
  day: string;
  startTime: Date;
  endTime: Date;
  subjectOffering: {
    id: number;
    subject: {
      id: number;
      name: string;
    };
    semester: {
      id: number;
      number: number;
      courseId: number;
      course?: {
        id: number;
        name: string;
      };
    };
  };
}

interface AttendanceFiltersProps {
  courses: Course[];
  semesters: Semester[];
  lessons: Lesson[];
}

const AttendanceFilters = ({ courses, semesters, lessons }: AttendanceFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  
  // Get current values from URL
  const currentCourseId = searchParams.get("courseId") || "";
  const currentSemesterId = searchParams.get("semesterId") || "";
  const currentLessonId = searchParams.get("lessonId") || "";

  // Default date is today if not specified
  const currentDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  
  // Parse the date string to a Date object
  const dateObj = new Date(currentDate);
  
  // Get weekday from the date
  const getWeekdayFromDate = (date: Date): string => {
    const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    return weekdays[date.getDay()];
  };
  
  // Current weekday derived from the date
  const currentWeekday = searchParams.get("weekday") || getWeekdayFromDate(dateObj);
  
  // Update filtered semesters when course changes
  useEffect(() => {
    if (currentCourseId) {
      // Filter semesters based on selected course
      const courseSemesters = semesters.filter(
        sem => sem.courseId === parseInt(currentCourseId)
      );
      setFilteredSemesters(courseSemesters);
      
      // If current semester is not part of this course, clear it
      const isSemesterValid = courseSemesters.some(
        sem => sem.id.toString() === currentSemesterId
      );
      
      if (currentSemesterId && !isSemesterValid) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("semesterId");
        router.push(`?${params.toString()}`);
      }
    } else {
      // If no course selected, show all semesters
      setFilteredSemesters(semesters);
    }
  }, [currentCourseId, semesters, currentSemesterId, searchParams, router]);

  // Update filtered lessons when course or semester changes
  useEffect(() => {
    // Make a copy of the lessons array and ensure the dates are properly instantiated
    let filtered = lessons.map(lesson => ({
      ...lesson,
      startTime: new Date(lesson.startTime),
      endTime: new Date(lesson.endTime)
    }));
    
    // Apply course filter if selected
    if (currentCourseId) {
      const courseIdNum = parseInt(currentCourseId);
      filtered = filtered.filter(lesson => {
        // Check if the courseId in the semester matches the selected course
        return lesson.subjectOffering.semester.courseId === courseIdNum;
      });
    }
    
    // Apply semester filter if selected
    if (currentSemesterId) {
      const semesterIdNum = parseInt(currentSemesterId);
      filtered = filtered.filter(lesson => {
        // Check if the semesterId matches the selected semester
        return lesson.subjectOffering.semester.id === semesterIdNum;
      });
    }
    
    // Apply weekday filter if selected
    if (currentWeekday) {
      filtered = filtered.filter(lesson => {
        return lesson.day === currentWeekday;
      });
    }
    
    // Set the filtered lessons
    setFilteredLessons(filtered);
    
    // If current lesson is not valid for these filters, clear it
    if (currentLessonId) {
      const isLessonValid = filtered.some(
        lesson => lesson.id.toString() === currentLessonId
      );
      
      if (!isLessonValid) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("lessonId");
        router.push(`?${params.toString()}`);
      }
    }
  }, [currentCourseId, currentSemesterId, currentWeekday, lessons, currentLessonId, searchParams, router]);

  // Handle course filter change
  const handleCourseChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (courseId) {
      params.set("courseId", courseId);
    } else {
      params.delete("courseId");
    }
    
    // Clear semester and lesson selection when course changes
    params.delete("semesterId");
    params.delete("lessonId");
    
    router.push(`?${params.toString()}`);
  };

  // Handle semester filter change
  const handleSemesterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const semesterId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (semesterId) {
      params.set("semesterId", semesterId);
    } else {
      params.delete("semesterId");
    }
    
    // Clear lesson selection when semester changes
    params.delete("lessonId");
    
    router.push(`?${params.toString()}`);
  };


  // Handle lesson filter change
  const handleLessonChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const lessonId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (lessonId) {
      params.set("lessonId", lessonId);
    } else {
      params.delete("lessonId");
    }
    
    router.push(`?${params.toString()}`);
  };

  // Handle date filter change
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (date) {
      params.set("date", date);
      
      // Automatically set weekday based on selected date
      const newDateObj = new Date(date);
      const weekday = getWeekdayFromDate(newDateObj);
      params.set("weekday", weekday);
    } else {
      params.delete("date");
      params.delete("weekday");
    }
    
    // Clear lesson selection when date changes as it affects weekday
    params.delete("lessonId");
    
    router.push(`?${params.toString()}`);
  };

  // PDF export function
  const exportToPDF = () => {
    try {
      // Create new document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text("Attendance Report", 14, 22);
      
      // Add filters info
      doc.setFontSize(12);
      const courseText = currentCourseId ? 
        `Course: ${courses.find(c => c.id.toString() === currentCourseId)?.name || ""}` : 
        "All Courses";
      
      const semesterText = currentSemesterId ? 
        `Semester: ${filteredSemesters.find(s => s.id.toString() === currentSemesterId)?.number || ""}` : 
        "All Semesters";
      
      const weekdayText = currentWeekday ? 
        `Day: ${currentWeekday}` : 
        "All Days";
        
      const lessonText = currentLessonId ? 
        `Lesson: ${filteredLessons.find(l => l.id.toString() === currentLessonId)?.subjectOffering.subject.name || ""}` : 
        "All Lessons";
      
      const dateText = `Date: ${format(dateObj, "dd MMMM yyyy")}`;
      
      doc.text(`${courseText} | ${semesterText} | ${weekdayText}`, 14, 30);
      doc.text(`${lessonText} | ${dateText}`, 14, 38);
      
      // We would include the actual attendance data here if available
      
      // Save PDF
      doc.save("attendance_report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. See console for details.");
    }
  };

  // Get formatted lesson label
  const getLessonLabel = (lesson: Lesson) => {
    const subjectName = lesson.subjectOffering.subject.name;
    const day = lesson.day;
    const startTime = format(new Date(lesson.startTime), "h:mm a");
    const endTime = format(new Date(lesson.endTime), "h:mm a");
    
    return `${subjectName} (${day}, ${startTime}-${endTime})`;
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-4 mb-6 items-center">
      {/* Course Filter */}
      <select
        className="p-2 border rounded-md text-sm flex-1 min-w-[120px] max-w-[180px]"
        value={currentCourseId}
        onChange={handleCourseChange}
      >
        <option value="">All Courses</option>
        {courses.map(course => (
          <option key={course.id} value={course.id.toString()}>
            {course.name}
          </option>
        ))}
      </select>

      {/* Semester Filter */}
      <select
        className="p-2 border rounded-md text-sm flex-1 min-w-[120px] max-w-[180px]"
        value={currentSemesterId}
        onChange={handleSemesterChange}
        disabled={!currentCourseId}
      >
        <option value="">All Semesters</option>
        {filteredSemesters.map(semester => (
          <option key={semester.id} value={semester.id.toString()}>
            Semester {semester.number}
          </option>
        ))}
      </select>

      {/* Date Picker - Single date selection that auto-sets weekday */}
      <div className="flex flex-1 min-w-[140px] max-w-[180px]">
        <input
          type="date"
          className="p-2 border rounded-md text-sm flex-grow"
          value={currentDate}
          onChange={handleDateChange}
        />
      </div>

      {/* Display selected weekday (read-only) */}
      <div className="flex flex-1 min-w-[120px] max-w-[180px] p-2 border rounded-md text-sm bg-gray-50">
        <span className="text-gray-500 mr-2">Day:</span>
        <span className="font-medium">{currentWeekday}</span>
      </div>

      {/* Lesson Filter */}
      <select
        className="p-2 border rounded-md text-sm flex-1 min-w-[180px] max-w-[240px]"
        value={currentLessonId}
        onChange={handleLessonChange}
        disabled={!currentSemesterId}
      >
        <option value="">Select Lesson</option>
        {filteredLessons.length > 0 ? (
          filteredLessons.map(lesson => (
            <option key={lesson.id} value={lesson.id.toString()}>
              {getLessonLabel(lesson)}
            </option>
          ))
        ) : (
          <option value="" disabled>No lessons available</option>
        )}
      </select>


      {/* PDF Export Button */}
      <button
        onClick={exportToPDF}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm ml-auto"
      >
        <Image src="/download.png" width={16} height={16} alt="Export" />
        <span className="hidden sm:inline">Export PDF</span>
      </button>
    </div>
  );
};

export default AttendanceFilters;
