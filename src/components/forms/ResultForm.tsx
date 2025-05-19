"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface Result {
  id: number;
  studentId: string;
  subjectId: number;
  internal: number;
  external: number;
  attendance: number;
  total: number;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Props {
  students: Student[];
  existingResults?: Result[];
  subjectId: number;
  attendance: {
    studentId: string;
    subjectId: number;  // Add subjectId to track per-subject attendance
    percentage: number;
  }[];
  onClose?: () => void;
  subjects?: Subject[];
}

const ResultForm = ({ students, existingResults = [], subjectId, attendance, subjects = [], onClose }: Props) => {
  const router = useRouter();
  const studentId = students[0]?.id;
  const storageKey = `student_results_${studentId}`;

  // Initialize state with data from localStorage if available
  const [results, setResults] = useState<{
    [key: string]: {
      internal: string;
      external: string;
      attendance: number;
    };
  }>(() => {
    if (typeof window !== 'undefined') {
      const savedResults = localStorage.getItem(storageKey);
      return savedResults ? JSON.parse(savedResults) : {};
    }
    return {};
  });

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(results).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(results));
    }
  }, [results, storageKey]);

  const [loading, setLoading] = useState(false);
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [attendanceData, setAttendanceData] = useState<{
    [key: number]: {
      percentage: number;
      score: number;
    };
  }>({});

  // Initialize form with enrolled subjects and existing results
  useEffect(() => {
    const fetchEnrolledSubjects = async () => {
      try {
        if (!studentId) return;

        // First set loading state
        setLoading(true);

        // Add first console log
        console.log('StudentId:', studentId);

        // Fetch subjects first
        const subjectsRes = await fetch(`/api/students/${studentId}/subjects`);
        const subjectsData = await subjectsRes.json();

        // Add second console log after subjects data is fetched
        console.log('Fetched subjects:', subjectsData.subjects);

        if (!subjectsData.subjects) {
          throw new Error('No subjects data received');
        }

        // Set enrolled subjects immediately
        setEnrolledSubjects(subjectsData.subjects);

        // Then fetch attendance data
        const attendanceRes = await fetch(`/api/students/${studentId}/attendance`);
        const attendanceData = await attendanceRes.json();

        // Process attendance data
        const processedAttendance: { [key: number]: { percentage: number; score: number } } = {};
        attendanceData.attendance?.forEach((att: any) => {
          const percentage = att.totalLessons > 0 
            ? (att.attendedLessons / att.totalLessons) * 100 
            : 0;
          
          processedAttendance[att.subjectId] = {
            percentage: percentage,
            score: calculateAttendanceScore(percentage)
          };
        });

        // Add third console log after attendance processing
        console.log('Processed attendance:', processedAttendance);

        setAttendanceData(processedAttendance);

        // Initialize results while preserving existing values
        const savedResults = localStorage.getItem(storageKey);
        const parsedSavedResults = savedResults ? JSON.parse(savedResults) : {};

        const initialResults: typeof results = {};
        subjectsData.subjects.forEach((subject: Subject) => {
          const existingResult = existingResults.find(r => r.subjectId === subject.id);
          const savedResult = parsedSavedResults[subject.id];
          const subjectAttendanceData = processedAttendance[subject.id] || { percentage: 0, score: 0 };

          initialResults[subject.id] = {
            internal: savedResult?.internal || existingResult?.internal?.toString() || '',
            external: savedResult?.external || existingResult?.external?.toString() || '',
            attendance: subjectAttendanceData.score
          };
        });

        setResults(prev => ({
          ...prev,
          ...initialResults
        }));

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledSubjects();
  }, [studentId, existingResults, storageKey]); // Remove unnecessary dependencies

  const calculateAttendanceScore = (percentage: number): number => {
    // More precise calculation with rounding to nearest 0.5
    const score = (percentage / 100) * 10;
    return Math.min(10, Math.max(0, Math.round(score * 2) / 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentId = students[0]?.id;
      if (!studentId) throw new Error('Student ID is missing');

      const formattedResults = enrolledSubjects.map(subject => ({
        studentId,
        subjectId: subject.id,
        internal: Math.min(20, Math.max(0, parseInt(results[subject.id]?.internal || '0'))),
        external: Math.min(70, Math.max(0, parseInt(results[subject.id]?.external || '0'))),
        attendance: results[subject.id]?.attendance || 0,
        total: (parseInt(results[subject.id]?.internal || '0')) + 
               (parseInt(results[subject.id]?.external || '0')) + 
               (results[subject.id]?.attendance || 0)
      }));

      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results: formattedResults }),
      });

      const data = await response.json();

      if (data.success) {
        // Keep the current values in both state and localStorage
        const updatedResults = { ...results };
        formattedResults.forEach(result => {
          updatedResults[result.subjectId] = {
            internal: result.internal.toString(),
            external: result.external.toString(),
            attendance: result.attendance
          };
        });
        
        setResults(updatedResults);
        localStorage.setItem(storageKey, JSON.stringify(updatedResults));
        
        toast.success('Results saved successfully');
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to save results');
      }
    } catch (error: any) {
      console.error('Error saving results:', error);
      toast.error(error.message || 'Failed to save results');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (studentId: string, field: 'internal' | 'external', value: string) => {
    // Don't convert to number immediately to allow empty string
    if (value === '') {
      setResults(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: ''
        }
      }));
      return;
    }

    const numValue = parseInt(value) || 0;
    const maxValue = field === 'internal' ? 20 : 70;
    
    // Ensure value is within valid range
    const validValue = Math.min(maxValue, Math.max(0, numValue));

    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: validValue.toString()
      }
    }));
  };

  // Clear all inputs
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all marks? This cannot be undone.')) {
      const clearedResults = Object.fromEntries(
        Object.entries(results).map(([id, scores]) => [
          id,
          { ...scores, internal: '', external: '' }
        ])
      );
      setResults(clearedResults);
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Enter Results</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Clear All
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-4">Loading subjects...</div>
      ) : enrolledSubjects.length === 0 ? (
        <div className="text-center p-4 text-gray-500">No subject enrolled</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left border">Subject Name</th>
                  <th className="p-2 text-center border">Internal (20)</th>
                  <th className="p-2 text-center border">External (70)</th>
                  <th className="p-2 text-center border">Attendance (10)</th>
                  <th className="p-2 text-center border">Total</th>
                </tr>
              </thead>
              <tbody className="max-h-[600px] overflow-y-auto">
                {enrolledSubjects.map(subject => {
                  const subjectAttendanceData = attendanceData[subject.id] || { percentage: 0, score: 0 };
                  const studentScores = results[subject.id] || {
                    internal: '',
                    external: '',
                    attendance: subjectAttendanceData.score
                  };

                  const total = 
                    (parseInt(studentScores.internal) || 0) +
                    (parseInt(studentScores.external) || 0) +
                    subjectAttendanceData.score;

                  return (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{subject.name}</td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={studentScores.internal}
                          onChange={(e) => handleInputChange(subject.id.toString(), 'internal', e.target.value)}
                          className="w-full p-1 text-center border rounded"
                          min="0"
                          max="20"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={studentScores.external}
                          onChange={(e) => handleInputChange(subject.id.toString(), 'external', e.target.value)}
                          className="w-full p-1 text-center border rounded"
                          min="0"
                          max="70"
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <div className="font-semibold text-lg">
                          {subjectAttendanceData.score}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({subjectAttendanceData.percentage.toFixed(1)}%)
                        </div>
                      </td>
                      <td className="p-2 border text-center font-semibold">
                        {total}
                      </td>
                    </tr>
                  );
                })}
                {enrolledSubjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No subjects enrolled
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#40e0d0] text-white rounded-md hover:bg-gray-600"
            >
              Save Results
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResultForm;
