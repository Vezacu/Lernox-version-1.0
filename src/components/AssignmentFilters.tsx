"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent } from "react";

interface Course {
  id: number;
  name: string;
}
interface Semester {
  id: number;
  number: number;
  courseId: number;
}
interface AssignmentFiltersProps {
  courses: Course[];
  semesters: Semester[];
}

const AssignmentFilters = ({ courses, semesters }: AssignmentFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);
  
  // Get current values from URL
  const currentCourseId = searchParams.get("courseId") || "";
  const currentSemesterId = searchParams.get("semesterId") || "";
  const currentStatus = searchParams.get("status") || "";

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

  // Handle status filter change
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    
    router.push(`?${params.toString()}`);
  };

  // Handle sort filter change
  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (sort) {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }
    
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Course Filter Dropdown */}
      <select
        onChange={handleCourseChange}
        defaultValue={currentCourseId}
        className="p-2 border border-gray-300 rounded-md  text-black filterbg"
      >
        <option value="">All Courses</option>
        {courses.map((course) => (
          <option value={course.id.toString()} key={course.id}>
            {course.name}
          </option>
        ))}
      </select>

      {/* Semester Filter Dropdown */}
      <select
        onChange={handleSemesterChange}
        value={currentSemesterId}
        className="p-2 border border-gray-300 rounded-md text-black filterbg" 
      >
        <option value="">All Semesters</option>
        {filteredSemesters.map((semester) => (
          <option value={semester.id.toString()} key={semester.id}>
            Semester {semester.number}
          </option>
        ))}
      </select>

      {/* Status Filter Dropdown */}
      <select
        onChange={handleStatusChange}
        defaultValue={currentStatus}
        className="p-2 border border-gray-300 rounded-md text-black filterbg"
      >
        <option value="">All Status</option>
        <option value="upcoming">Upcoming</option>
        <option value="active">Active</option>
        <option value="past">Past</option>
      </select>

      {/* Sort Dropdown */}
      <select
        onChange={handleSortChange}
        defaultValue={searchParams.get("sort") || ""}
        className="p-2 border border-gray-300 rounded-md text-black filterbg"
      >
        <option value="">Sort By</option>
        <option value="asc">A to Z</option>
        <option value="desc">Z to A</option>
      </select>
    </div>
  );
};

export default AssignmentFilters;