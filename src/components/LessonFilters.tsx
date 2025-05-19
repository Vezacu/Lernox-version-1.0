"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent } from "react";
import Image from "next/image";
import jsPDF from 'jspdf';
// Properly import autoTable
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

interface LessonFiltersProps {
  courses: Course[];
  semesters: Semester[];
  lessons: any[];
}

const LessonFilters = ({ courses, semesters, lessons }: LessonFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);
  
  // Get current values from URL
  const currentCourseId = searchParams.get("courseId") || "";
  const currentSemesterId = searchParams.get("semesterId") || "";
  const currentDay = searchParams.get("day") || "";

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

  // Handle course filter change
  const handleCourseChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (courseId) {
      params.set("courseId", courseId);
    } else {
      params.delete("courseId");
    }
    
    // Clear semester selection when course changes
    params.delete("semesterId");
    
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
    
    router.push(`?${params.toString()}`);
  };

  // Handle day filter change
  const handleDayChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const day = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (day) {
      params.set("day", day);
    } else {
      params.delete("day");
    }
    
    router.push(`?${params.toString()}`);
  };

  // PDF export function
  const exportToPDF = () => {
    try {
      // Create new document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text("College Timetable", 14, 22);
      
      // Add filters info
      doc.setFontSize(12);
      const courseText = currentCourseId ? 
        `Course: ${courses.find(c => c.id.toString() === currentCourseId)?.name || ""}` : 
        "All Courses";
      
      const semesterText = currentSemesterId ? 
        `Semester: ${filteredSemesters.find(s => s.id.toString() === currentSemesterId)?.number || ""}` : 
        "All Semesters";
      
      const dayText = currentDay ? `Day: ${currentDay}` : "All Days";
      
      doc.text(`${courseText} | ${semesterText} | ${dayText}`, 14, 30);
      
      // Prepare data for table
      const columns = ['Day', 'Time', 'Subject', 'Teacher', 'Status'];
      
      const rows = lessons.map(lesson => [
        lesson.day,
        `${formatTime(lesson.startTime)} - ${formatTime(lesson.endTime)}`,
        lesson.subjectOffering.subject.name,
        `${lesson.subjectOffering.teacher.name} ${lesson.subjectOffering.teacher.surname}`,
        lesson.status
      ]);
      
      // Use autoTable as a function
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Save PDF
      doc.save("college_timetable.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. See console for details.");
    }
  };

  const formatTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
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

      {/* Day Filter */}
      <select
        className="p-2 border rounded-md text-sm flex-1 min-w-[120px] max-w-[180px]"
        value={currentDay}
        onChange={handleDayChange}
      >
        <option value="">All Days</option>
        <option value="MONDAY">Monday</option>
        <option value="TUESDAY">Tuesday</option>
        <option value="WEDNESDAY">Wednesday</option>
        <option value="THURSDAY">Thursday</option>
        <option value="FRIDAY">Friday</option>
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

export default LessonFilters;
