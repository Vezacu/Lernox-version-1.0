"use client";

import { useState, useEffect } from 'react';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import StudentFilters from "@/components/StudentFilters";
import ResultForm from "@/components/forms/ResultForm";
import Pagination from "@/components/Pagination";
import { Student, Course, Semester, Subject } from "@prisma/client";
import Link from 'next/link';

// Update the Result interface to match your database schema
interface Result {
  id: number;
  studentId: string; // This should be the Clerk-generated ID
  subjectId: number;
  internal: number;
  external: number;
  attendance: number;
  total: number;
}

type StudentList = {
  id: string; // This is the Clerk-generated ID
  name: string;
  surname: string;
  course?: Course;
  currentSemester?: Semester;
  results?: Result[];
};

interface ResultListProps {
  data: StudentList[];
  count: number;
  page: number;
  courses: Course[];
  semesters: Semester[];
  subjects: any[];
  attendance: any[];
  role?: string;
}

// Update the ResultForm component props
interface ResultFormProps {
  students: Student[];
  existingResults?: Result[];
  subjectId: number;
  attendance: {
    studentId: string;
    percentage: number;
  }[];
  subjects?: Subject[];
  onClose?: () => void;
}

const ResultList = ({ data, subjects, ...props }: ResultListProps) => {
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentList | null>(null);

  // Add console log for debugging
  useEffect(() => {
    console.log('Subjects in ResultList:', subjects);
  }, [subjects]);

  useEffect(() => {
    console.log('Selected student in ResultList:', selectedStudent);
    console.log('Available subjects:', subjects);
  }, [selectedStudent, subjects]);

  const columns = [
    {
      header: "Student Name",
      accessor: "name",
      className: "pl-4 pr-8" // Added padding
    },
    {
      header: "Course",
      accessor: "course",
      className: "px-8" // Added horizontal padding
    },
    {
      header: "Semester",
      accessor: "semester",
      className: "px-8" // Added horizontal padding
    },
    ...(props.role === "admin" || props.role === "teacher" ? [
      {
        header: "Actions",
        accessor: "action",
        className: "text-right pr-8"
      },
    ] : []),
  ];

  const calculateAttendancePercentage = (studentId: string) => {
    const studentAttendance = props.attendance.find(a => a.studentId === studentId);
    return studentAttendance 
      ? (studentAttendance._count.present / studentAttendance._count.id) * 100
      : 0;
  };

  const handleAddScore = (student: StudentList) => {
    console.log('Adding score for student:', student); // Debug log
    setSelectedStudent(student);
    setShowResultForm(true);
  };

  const renderRow = (item: StudentList) => {
    const attendancePercentage = calculateAttendancePercentage(item.id);

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="py-4 pl-4 pr-8">
          <span className="font-semibold">{item.name} {item.surname}</span>
        </td>
        <td className="py-4 px-8">{item.course?.name}</td>
        <td className="py-4 px-8">Semester {item.currentSemester?.number}</td>
        {(props.role === "admin" || props.role === "teacher") && (
          <td className="py-4 pr-8">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => handleAddScore(item)}
                className="bg-[#08FF08] px-4 py-2 rounded-md hover:bg-green-500 transition-colors"
              >
                Add Score
              </button>
              <Link
                href={`/list/results/${item.id}`}
                className="bg-[#40e0d0]  px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                View Results
              </Link>
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Student Results</h1>
        <div className="flex items-center gap-4">
          <TableSearch />
          <StudentFilters 
            courses={props.courses} 
            semesters={props.semesters} 
            subjects={subjects}
          />
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} /> 
      <Pagination page={props.page} count={props.count} />

      {showResultForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <ResultForm
              students={[selectedStudent]} // Pass the full student object
              existingResults={data.find(s => s.id === selectedStudent.id)?.results || []}
              subjectId={parseInt(new URLSearchParams(window.location.search).get('subjectId') || '0')}
              attendance={props.attendance}
              subjects={subjects} // Make sure we're passing subjects here
              onClose={() => {
                setShowResultForm(false);
                setSelectedStudent(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultList; 