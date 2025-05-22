import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import '@/components/cssfile/menuPages.css';

interface PageProps {
  params: {
    id: string;
  };
}

// Define interfaces for the data structures based on Prisma schema
interface Subject {
  id: number;
  name: string;
}

interface Result {
  id: number;
  studentId: string;
  subjectId: number;
  internal: number;
  external: number;
  attendance: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  subject: Subject;
}

interface Course {
  id: number;
  name: string;
}

interface Semester {
  id: number;
  number: number;
}

interface Student {
  id: string;
  name: string;
  surname: string;
  course?: Course | null;
  currentSemester?: Semester | null;
  results: Result[];
}

export default async function StudentResultPage({ params }: PageProps) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      course: true,
      currentSemester: true,
      results: {
        include: {
          subject: true
        }
      }
    }
  }) as Student;

  if (!student) {
    notFound();
  }

  // Calculate overall performance
  const totalResults = student.results.length;
  const passedSubjects = student.results.filter((r) => r.total >= 35).length;
  const overallPercentage = totalResults > 0 
    ? (student.results.reduce((acc, r) => acc + r.total, 0) / (totalResults * 100)) * 100 
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto resultIDpage">
      {/* Back Button with improved styling */}
      <div className="mb-8">
        <Link
          href="/list/results"
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm group resultIDpage"
        >
          <svg 
            className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform " 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Results
        </Link>
      </div>

      {/* Main Content Container */}
      <div className="space-y-8">
        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden resultIDpage">
          <div className="bg-[#40e0d0] px-6 py-4">
            <h1 className="text-2xl font-bold text-black">Student Results</h1>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 ">
              <div className="bg-gray-50 p-4 rounded-lg resultIDpage">
                <p className="text-gray-500 text-sm">Student Name</p>
                <p className="font-semibold text-lg capitalize ">{student.name} {student.surname}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg resultIDpage">
                <p className="text-gray-500 text-sm text-black">Course</p>
                <p className="font-semibold text-lg">{student.course?.name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg resultIDpage">
                <p className="text-gray-500 text-sm">Current Semester</p>
                <p className="font-semibold text-lg">{student.currentSemester?.number}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg resultIDpage">
                <p className="text-gray-500 text-sm">Overall Performance</p>
                <p className="font-semibold text-lg">{overallPercentage.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table with improved styling */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider resultIDpage">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider resultIDpage">
                    Internal <span className="text-gray-400">(20)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider resultIDpage">
                    External <span className="text-gray-400">(70)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider resultIDpage">
                    Attendance <span className="text-gray-400">(10)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider resultIDpage">
                    Total <span className="text-gray-400">(100)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider resultIDpage">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white ">
                {student.results.map((result: Result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors ">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {result.internal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {result.external}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {result.attendance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {result.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        result.total >= 35 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.total >= 35 ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section with improved styling */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-[#08FF08] px-6 py-4">
            <h2 className="text-xl font-semibold text-black ">Performance Summary</h2>
          </div>
          <div className="p-6 resultIDpage">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center resultIDpage">
                <p className="text-gray-500 text-sm">Total Subjects</p>
                <p className="font-semibold text-2xl mt-2">{totalResults}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center resultIDpage">
                <p className="text-gray-500 text-sm">Subjects Passed</p>
                <p className="font-semibold text-2xl mt-2 text-green-600">{passedSubjects}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center resultIDpage">
                <p className="text-gray-500 text-sm">Success Rate</p>
                <p className="font-semibold text-2xl mt-2 text-[#40e0d0]">
                  {totalResults > 0 ? ((passedSubjects / totalResults) * 100).toFixed(2) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}