"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

// Updated enrollment schema for form validation to support multiple students/subjects
const enrollmentSchema = z.object({
  studentIds: z.array(z.string()).min(1, "At least one student is required"),
  subjectOfferingIds: z.array(z.coerce.number()).min(1, "At least one subject offering is required"),
});

type Student = {
  id: string;
  name: string;
  surname: string;
  courseId: number | null;
  currentSemesterId: number | null;
};

type SubjectOffering = {
  id: number;
  subjectId: number;
  semesterId: number;
  teacherId: string;
  subject: {
    name: string;
  };
  semester: {
    number: number;
    course: {
      id: number;
      name: string;
    };
  };
  teacher: {
    name: string;
    surname: string;
  };
};

type Enrollment = {
  id: number;
  studentId: string;
  subjectOfferingId: number;
  student: Student;
  subjectOffering: SubjectOffering;
};

type Course = {
  id: number;
  name: string;
};

type Semester = {
  id: number;
  number: number;
  courseId: number;
};

// Update the return types to match what the actions actually return
type ActionResponse = { success: boolean; error?: string; message?: string; [key: string]: any };

interface EnrollmentManagerProps {
  initialEnrollments: Enrollment[];
  students: Student[];
  subjectOfferings: SubjectOffering[];
  courses: Course[];
  semesters: Semester[];
  enrollStudent: (data: { studentId: string; subjectOfferingId: number }) => Promise<ActionResponse>;
  // Add this prop to match what's being passed in the page component
  batchEnroll: (data: { 
    studentIds: string[]; 
    subjectOfferingIds: number[] | string[] 
  }) => Promise<ActionResponse>;
  removeEnrollment: (id: number) => Promise<ActionResponse>;
  // Bulk remove enrollments - optional prop
  bulkRemoveEnrollments?: (ids: number[]) => Promise<ActionResponse>;
}

const EnrollmentManager = ({
    initialEnrollments,
    students,
    subjectOfferings,
    courses,
    semesters,
    enrollStudent,
    removeEnrollment,
    bulkRemoveEnrollments, // This might be undefined, so we need to handle that case
  }: EnrollmentManagerProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // UI state - now only list and create
  const [view, setView] = useState<"list" | "create">("list");
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  
  // Filters state
  const [courseId, setCourseId] = useState<string>(searchParams.get("courseId") || "");
  const [semesterId, setSemesterId] = useState<string>(searchParams.get("semesterId") || "");
  const [studentId, setStudentId] = useState<string>(searchParams.get("studentId") || "");
  
  // Multi-select state for creating enrollments
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSubjectOfferings, setSelectedSubjectOfferings] = useState<number[]>([]);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Confirmation dialog state for bulk actions
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (courseId) params.set("courseId", courseId);
    if (semesterId) params.set("semesterId", semesterId);
    if (studentId) params.set("studentId", studentId);
    
    startTransition(() => {
      router.push(`/list/enrollments?${params.toString()}`, { scroll: false });
    });
  }, [courseId, semesterId, studentId, router]);

  // Filter the subject offerings based on selected course and semester
  const filteredSubjectOfferings = subjectOfferings.filter((so) => {
    if (courseId && so.semester.course.id !== parseInt(courseId)) return false;
    if (semesterId && so.semesterId !== parseInt(semesterId)) return false;
    return true;
  });

  // Filter the students based on selected course and semester
  const filteredStudents = students.filter((student) => {
    if (courseId && student.courseId !== parseInt(courseId)) return false;
    if (semesterId && student.currentSemesterId !== parseInt(semesterId)) return false;
    return true;
  });

  // Filter enrollments based on selected filters
  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (courseId && enrollment.subjectOffering.semester.course.id !== parseInt(courseId)) return false;
    if (semesterId && enrollment.subjectOffering.semesterId !== parseInt(semesterId)) return false;
    if (studentId && enrollment.studentId !== studentId) return false;
    return true;
  });

  // Handle filter changes
  const handleFilterChange = (filter: "courseId" | "semesterId" | "studentId", value: string) => {
    // Clear selections when filters change
    setSelectedStudents([]);
    setSelectedSubjectOfferings([]);
    
    switch (filter) {
      case "courseId":
        setCourseId(value);
        // Reset semester when course changes
        if (value !== courseId) {
          setSemesterId("");
        }
        break;
      case "semesterId":
        setSemesterId(value);
        break;
      case "studentId":
        setStudentId(value);
        break;
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Toggle subject offering selection
  const toggleSubjectOfferingSelection = (subjectOfferingId: number) => {
    setSelectedSubjectOfferings(prev => 
      prev.includes(subjectOfferingId)
        ? prev.filter(id => id !== subjectOfferingId)
        : [...prev, subjectOfferingId]
    );
  };

  // Handle select all students
  const handleSelectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      // If all are already selected, deselect all
      setSelectedStudents([]);
    } else {
      // Otherwise, select all filtered students
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  // Handle select all subject offerings
  const handleSelectAllSubjectOfferings = () => {
    if (selectedSubjectOfferings.length === filteredSubjectOfferings.length) {
      // If all are already selected, deselect all
      setSelectedSubjectOfferings([]);
    } else {
      // Otherwise, select all filtered subject offerings
      setSelectedSubjectOfferings(filteredSubjectOfferings.map(so => so.id));
    }
  };

  // Handle create enrollments
  const handleCreateEnrollments = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (selectedStudents.length === 0 || selectedSubjectOfferings.length === 0) {
      setError("Please select at least one student and one subject offering");
      return;
    }

    try {
      // Create a counter for successful enrollments
      let successCount = 0;
      let totalAttempts = selectedStudents.length * selectedSubjectOfferings.length;
      
      // Track failures
      const failures: { student: string, subject: string, reason: string }[] = [];
      
      // Process each enrollment combination
      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;
        
        for (const subjectOfferingId of selectedSubjectOfferings) {
          // Check if enrollment already exists
          const exists = enrollments.some(
            e => e.studentId === studentId && e.subjectOfferingId === subjectOfferingId
          );

          if (exists) {
            const subjectOffering = subjectOfferings.find(so => so.id === subjectOfferingId);
            failures.push({
              student: `${student.surname}, ${student.name}`,
              subject: subjectOffering ? subjectOffering.subject.name : `Subject #${subjectOfferingId}`,
              reason: "Already enrolled"
            });
            continue;
          }
          
          // Enroll student in the subject
          const result = await enrollStudent({
            studentId,
            subjectOfferingId,
          });

          if (result.success) {
            successCount++;
            
            // Add to local state for immediate UI update
            const subjectOffering = subjectOfferings.find(so => so.id === subjectOfferingId);
            
            if (student && subjectOffering) {
              const newEnrollment: Enrollment = {
                id: Math.max(0, ...enrollments.map(e => e.id)) + 1, // Generate temp ID
                studentId,
                subjectOfferingId,
                student,
                subjectOffering,
              };
              
              setEnrollments(prev => [...prev, newEnrollment]);
            }
          } else {
            const subjectOffering = subjectOfferings.find(so => so.id === subjectOfferingId);
            failures.push({
              student: `${student.surname}, ${student.name}`,
              subject: subjectOffering ? subjectOffering.subject.name : `Subject #${subjectOfferingId}`,
              reason: result.error || "Unknown error"
            });
          }
        }
      }

      // Show success/failure summary
      if (successCount > 0) {
        setSuccessMessage(`Successfully created ${successCount} out of ${totalAttempts} enrollments`);
      }
      
      if (failures.length > 0) {
        setError(`Failed to create ${failures.length} enrollments. Common reasons: already enrolled or scheduling conflicts.`);
        console.log("Enrollment failures:", failures);
      }

      // Reset selection state after processing
      setSelectedStudents([]);
      setSelectedSubjectOfferings([]);
      
      // Return to list view if at least some were successful
      if (successCount > 0) {
        setView("list");
      }
    } catch (err) {
      console.error("Create enrollments error:", err);
      setError("Failed to create enrollments: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handle delete enrollment
  const handleDeleteEnrollment = async (id: number) => {
    try {
      const result = await removeEnrollment(id);
      
      // Check if removal was successful
      if (!result.success) {
        setError(result.error || "Failed to remove enrollment");
        return;
      }
      
      // Show success message
      setSuccessMessage("Enrollment removed successfully");
      
      setEnrollments(enrollments.filter(e => e.id !== id));
    } catch (err) {
      console.error("Delete enrollment error:", err);
      setError("Failed to remove enrollment: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handle bulk remove enrollments
  const handleBulkRemoveEnrollments = async () => {
    if (filteredEnrollments.length === 0) {
      setError("No enrollments to remove based on the current filters");
      return;
    }

    // Set up the confirmation dialog
    setConfirmAction({
      title: "Remove All Enrollments",
      message: `Are you sure you want to remove all ${filteredEnrollments.length} enrollment(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError(null);
          setSuccessMessage(null);
          
          // If we have a bulk remove function from props, use it
          if (bulkRemoveEnrollments) {
            const result = await bulkRemoveEnrollments(filteredEnrollments.map(e => e.id));
            
            if (result.success) {
              setSuccessMessage(`Successfully removed ${filteredEnrollments.length} enrollment(s)`);
              
              // Update local state by removing the filtered enrollments
              setEnrollments(prev => prev.filter(e => !filteredEnrollments.includes(e)));
            } else {
              setError(result.error || "Failed to remove enrollments");
            }
          } else {
            // Fallback: Remove each enrollment one by one
            let successCount = 0;
            
            for (const enrollment of filteredEnrollments) {
              const result = await removeEnrollment(enrollment.id);
              if (result.success) {
                successCount++;
              }
            }
            
            if (successCount > 0) {
              setSuccessMessage(`Successfully removed ${successCount} enrollment(s)`);
              
              // Update local state
              const removedIds = new Set(filteredEnrollments.map(e => e.id));
              setEnrollments(prev => prev.filter(e => !removedIds.has(e.id)));
            } else {
              setError("Failed to remove any enrollments");
            }
          }
        } catch (err) {
          console.error("Bulk remove enrollments error:", err);
          setError("Failed to remove enrollments: " + (err instanceof Error ? err.message : String(err)));
        } finally {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }
      }
    });
    
    setShowConfirmDialog(true);
  };

  // Get filtered semesters based on selected course
  const filteredSemesters = semesters.filter(
    semester => !courseId || semester.courseId === parseInt(courseId)
  );

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-2">{confirmAction.title}</h3>
            <p className="mb-6 text-gray-700">{confirmAction.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmAction.onConfirm()}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with View Toggles */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Enrollment Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 rounded ${
              view === "list" ? "bg-[#40e0d0]" : "bg-gray-200"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView("create")}
            className={`px-3 py-2 rounded ${
              view === "create" ? "bg-[#40e0d0]" : "bg-gray-200"
            }`}
          >
            Create Enrollments
          </button>
        </div>
      </div>

      {/* Filters - shown in all views */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={courseId}
            onChange={(e) => handleFilterChange("courseId", e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semester
          </label>
          <select
            value={semesterId}
            onChange={(e) => handleFilterChange("semesterId", e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            disabled={!courseId}
          >
            <option value="">All Semesters</option>
            {filteredSemesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                Semester {semester.number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student
          </label>
          <select
            value={studentId}
            onChange={(e) => handleFilterChange("studentId", e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">All Students</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.surname}, {student.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Success Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div>
          {/* Bulk Actions */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {filteredEnrollments.length} enrollment(s)
            </div>
            <div>
              {filteredEnrollments.length > 0 && (
                <button
                  onClick={handleBulkRemoveEnrollments}
                  className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Remove All Enrollments
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left border">Student</th>
                  <th className="p-2 text-left border">Course</th>
                  <th className="p-2 text-left border">Semester</th>
                  <th className="p-2 text-left border">Subject</th>
                  <th className="p-2 text-left border">Teacher</th>
                  <th className="p-2 text-center border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.length > 0 ? (
                  filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="p-2 border">
                        {enrollment.student.surname}, {enrollment.student.name}
                      </td>
                      <td className="p-2 border">
                        {enrollment.subjectOffering.semester.course.name}
                      </td>
                      <td className="p-2 border">
                        Semester {enrollment.subjectOffering.semester.number}
                      </td>
                      <td className="p-2 border">
                        {enrollment.subjectOffering.subject.name}
                      </td>
                      <td className="p-2 border">
                        {enrollment.subjectOffering.teacher.surname}, {enrollment.subjectOffering.teacher.name}
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => handleDeleteEnrollment(enrollment.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No enrollments found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Create Enrollment View with Multi-select */}
      {view === "create" && (
        <form onSubmit={handleCreateEnrollments} className="space-y-6">
          <h2 className="text-lg font-medium">Create Multiple Enrollments</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Students selection with Select All */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Select Students</h3>
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedStudents.length === filteredStudents.length 
                    ? "Deselect All" 
                    : "Select All"}
                </button>
              </div>
              
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div 
                      key={student.id}
                      className="flex items-center p-2 hover:bg-gray-50 border-b"
                    >
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                        {student.surname}, {student.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No students available. Please adjust your filters.
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {selectedStudents.length} student(s) selected
              </div>
            </div>

            {/* Subject offerings selection with Select All */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Select Subject Offerings</h3>
                <button
                  type="button"
                  onClick={handleSelectAllSubjectOfferings}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedSubjectOfferings.length === filteredSubjectOfferings.length 
                    ? "Deselect All" 
                    : "Select All"}
                </button>
              </div>
              
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                {filteredSubjectOfferings.length > 0 ? (
                  filteredSubjectOfferings.map((so) => (
                    <div 
                      key={so.id}
                      className="flex items-center p-2 hover:bg-gray-50 border-b"
                    >
                      <input
                        type="checkbox"
                        id={`so-${so.id}`}
                        checked={selectedSubjectOfferings.includes(so.id)}
                        onChange={() => toggleSubjectOfferingSelection(so.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`so-${so.id}`} className="flex-1 cursor-pointer">
                        {so.subject.name} - Semester {so.semester.number} - {so.semester.course.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No subject offerings available. Please adjust your filters.
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {selectedSubjectOfferings.length} subject offering(s) selected
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-700">
              This will create {selectedStudents.length * selectedSubjectOfferings.length} enrollment(s).
              Each selected student will be enrolled in all selected subject offerings.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#40e0d0]  rounded-md hover:bg-gray-200"
              disabled={isPending || selectedStudents.length === 0 || selectedSubjectOfferings.length === 0}
            >
              {isPending ? "Processing..." : "Create Enrollments"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EnrollmentManager;
