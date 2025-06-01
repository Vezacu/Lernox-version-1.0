"use client";

import { useState, useEffect } from 'react';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import StudentFilters from "@/components/StudentFilters";
import ResultForm from "@/components/forms/ResultForm";
import Pagination from "@/components/Pagination";
import { Student, Course, Semester, Subject } from "@prisma/client";
import Link from 'next/link';
import '@/components/cssfile/menuPages.css';

// Define the score submission data interface
interface ScoreSubmissionData {
  studentId: string;
  subjectId: number;
  internal: number;
  external: number;
  attendance: number;
}

// Function to submit a student score
async function submitStudentScore(scoreData: ScoreSubmissionData) {
  try {
    console.log('Submitting score data:', JSON.stringify(scoreData, null, 2));
    
    // Validate score values
    if (isNaN(scoreData.internal) || scoreData.internal < 0 || scoreData.internal > 100) {
      console.log('Internal score validation failed:', scoreData.internal);
      throw new Error("Internal score must be a number between 0 and 100");
    }
    
    if (isNaN(scoreData.external) || scoreData.external < 0 || scoreData.external > 100) {
      console.log('External score validation failed:', scoreData.external);
      throw new Error("External score must be a number between 0 and 100");
    }
    
    if (isNaN(scoreData.attendance) || scoreData.attendance < 0 || scoreData.attendance > 100) {
      console.log('Attendance validation failed:', scoreData.attendance);
      throw new Error("Attendance must be a number between 0 and 100");
    }
    
    // Calculate total score
    const total = scoreData.internal + scoreData.external + scoreData.attendance;
    console.log('Calculated total score:', total);
    
    // Format the payload according to the API's expected format
    const payload = {
      results: [{
        studentId: scoreData.studentId, // Keep as string (Clerk user ID)
        subjectId: scoreData.subjectId,
        internal: scoreData.internal,
        external: scoreData.external,
        attendance: scoreData.attendance,
        total
      }]
    };
    
    console.log('Final payload being sent to API:', JSON.stringify(payload, null, 2));
    
    // Make the API request
    const response = await fetch('/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('API Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => {
        console.log('Could not parse error response as JSON');
        return {};
      });
      console.error('API Error data:', errorData);
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('API Success response:', responseData);
    return responseData;
  } catch (error) {
    console.error("Failed to submit score:", error);
    throw error;
  }
}
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

// Define a custom CurrentSemester type to match the shape returned by your Prisma query
type CurrentSemesterData = {
  id: number;
  number: number;
} | null;

type StudentList = {
  id: string; // This is the Clerk-generated ID
  name: string;
  surname: string;
  course?: Course | null; // Updated to accept null from Prisma
  currentSemester?: CurrentSemesterData; // Updated to match the actual data shape
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
        className: "text-right pr-20"
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
        className="border-b text-sm border-gray-200 hover:bg-[#a8edea] darkHoverList"
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
                className="bg-[#08FF08] text-black px-4 py-2 rounded-md hover:bg-green-500 transition-colors"
              >
                Add Score
              </button>
              <Link
                href={`/list/results/${item.id}`}
                className="bg-[#40e0d0] text-black px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                View Results
              </Link> 
            </div>
          </td>
        )}
         {(props.role === "parent", "teacher", "admin" ) && (
          <td className="py-4 pr-8">
            <div className="flex items-center justify-end space-x-3">
              <Link
                href={`/list/results/${item.id}`}
                className="bg-[#40e0d0] text-black px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
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
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 resultpage">
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
          <div className=" bg-white rounded-lg p-2 w-full max-w-4xl max-h-[90vh] overflow-y-auto ">
            <ResultForm
              students={[selectedStudent as any]} // Cast to any to resolve type mismatch with Student type
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
