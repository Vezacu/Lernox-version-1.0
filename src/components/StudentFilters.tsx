"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface StudentFiltersProps {
  courses: {
    id: number;
    name: string;
    code: string;
    duration: number;
  }[];
  semesters: {
    id: number;
    number: number;
    courseId: number;
    startDate: Date;
    endDate: Date;
  }[];
  subjects?: {
    id: number;
    name: string;
    code: string;
    subjectOfferings?: {
      semesterId: number;
    }[];
  }[];
}

const StudentFilters = ({ courses, semesters, subjects = [] }: StudentFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const courseId = searchParams.get("courseId");
  const semesterId = searchParams.get("semesterId");
  const subjectId = searchParams.get("subjectId");

  // Filter semesters based on selected course
  const filteredSemesters = courseId 
    ? semesters.filter(sem => sem.courseId === parseInt(courseId))
    : semesters;

  // Filter subjects based on selected semester
  const filteredSubjects = semesterId
    ? subjects.filter(sub => sub.subjectOfferings?.some(so => so.semesterId === parseInt(semesterId)))
    : subjects;

  const createQueryString = useCallback(
    (params: { [key: string]: string | null }) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });
      
      return current.toString();
    },
    [searchParams]
  );

  return (
    <div className="flex gap-3">
      <select
        className="p-2 border rounded-md"
        value={courseId || ""}
        onChange={(e) => {
          const query = createQueryString({ 
            courseId: e.target.value || null,
            semesterId: null,
            subjectId: null
          });
          router.push(`/list/results?${query}`);
        }}
      >
        <option value="">All Courses</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>

      <select
        className="p-2 border rounded-md"
        value={semesterId || ""}
        onChange={(e) => {
          const query = createQueryString({ 
            semesterId: e.target.value || null,
            subjectId: null
          });
          router.push(`/list/results?${query}`);
        }}
        disabled={!courseId}
      >
        <option value="">All Semesters</option>
        {filteredSemesters.map((semester) => (
          <option key={semester.id} value={semester.id}>
            Semester {semester.number}
          </option>
        ))}
      </select>

      <select
        className="p-2 border rounded-md"
        value={subjectId || ""}
        onChange={(e) => {
          const query = createQueryString({ 
            subjectId: e.target.value || null 
          });
          router.push(`/list/results?${query}`);
        }}
        disabled={!semesterId}
      >
        <option value="">Select Subject</option>
        {filteredSubjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name} ({subject.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default StudentFilters;
