"use client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { createAttendance, updateAttendance, deleteAttendance, fetchAttendanceByLessonAndDate } from "@/lib/actions";

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface Lesson {
  id: number;
  day: string;
  startTime: Date;
  endTime: Date;
  status: string;
  subjectOffering: {
    id: number;
    subject: {
      id: number;
      name: string;
    };
    semester: {
      id: number;
      number: number;
    };
  };
}

export interface AttendanceRecord {
  lessonId: number;
  date: Date;
  id: number; // Changed from string to number to match API response
  present: boolean;
  studentId: string;
}

interface AttendanceFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData: {
    students: Student[];
    lessons: Lesson[];
    selectedDate?: Date;
  };
}

// Submit button with loading state
function SubmitButton({ type }: { type: "create" | "update" }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
    >
      {pending ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        <span>
          {type === "create" ? "Submit Attendance" : "Update Attendance"}
        </span>
      )}
    </button>
  );
}

// Delete button with loading state
function DeleteButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
    >
      {pending ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        <span>Delete Records</span>
      )}
    </button>
  );
}

const AttendanceForm = ({ type, data, setOpen, relatedData }: AttendanceFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { students, lessons, selectedDate } = relatedData;
  
  // Get lesson ID from URL if available (from filters)
  const urlLessonId = searchParams.get("lessonId") ? Number(searchParams.get("lessonId")) : null;
  
  // Get date from URL if available (from filters), otherwise default to today
  const urlDate = searchParams.get("date") || (selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  
  // State for attendance data
  const [attendanceData, setAttendanceData] = useState<{
    [key: string]: boolean;
  }>({});

  // State for selected lesson and date
  const [selectedLesson, setSelectedLesson] = useState<number | null>(
    data?.lessonId || urlLessonId || null
  );
  const [attendanceDate, setAttendanceDate] = useState<string>(urlDate);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  
  // Store attendance IDs for deletion
  const [attendanceIds, setAttendanceIds] = useState<string[]>([]);

  // Loading state for data fetching
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Initialize form state based on existing data
  useEffect(() => {
    // Create a new attendance data object
    const initialData: { [key: string]: boolean } = {};
    
    if (type === "update" && data && data.length > 0) {
      // If updating existing attendance, pre-populate the form with existing data
      const ids: string[] = [];
      
      // First, initialize all students as absent (default state for update)
      students.forEach(student => {
        initialData[student.id] = false;
      });
      
      // Then update with actual attendance data
      data.forEach((item: any) => {
        // Make sure we're using the correct student ID
        if (students.some(s => s.id === item.studentId)) {
          initialData[item.studentId] = item.present;
        }
        
        // Store attendance IDs for deletion
        if (item.id) {
          ids.push(item.id);
        }
      });
      
      // Store attendance IDs for deletion
      setAttendanceIds(ids);
      
      console.log("Initial attendance data from update:", initialData);
      console.log("Attendance IDs:", ids);
      
      // Set the lesson and date from the first record
      if (data[0]?.lessonId) {
        setSelectedLesson(data[0].lessonId);
      }
      
      if (data[0]?.date) {
        setAttendanceDate(format(new Date(data[0].date), "yyyy-MM-dd"));
      }
    } else {
      // For create, initialize all students as absent (not present) by default
      students.forEach(student => {
        initialData[student.id] = false;
      });
    }
    
    // Set the attendance data
    setAttendanceData(initialData);
    setIsDataLoaded(true);
  }, [type, data, students]);

  // Update lesson ID from URL when it changes
  useEffect(() => {
    if (urlLessonId && urlLessonId !== selectedLesson) {
      setSelectedLesson(urlLessonId);
    }
  }, [urlLessonId, selectedLesson]);
  
  // Update date from URL when it changes
  useEffect(() => {
    if (urlDate && urlDate !== attendanceDate) {
      setAttendanceDate(urlDate);
    }
  }, [urlDate, attendanceDate]);

  // Fetch attendance data when date or lesson changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!selectedLesson || !attendanceDate || !isDataLoaded) return;
      
      try {
        setIsFetching(true);
        setFetchError(null);
        
        console.log(`Fetching attendance data for lesson ${selectedLesson} on ${attendanceDate}`);
        
        // Call the fetchAttendanceByLessonAndDate server action to get attendance data
        const response = await fetchAttendanceByLessonAndDate(selectedLesson, attendanceDate);
        
        if (response.error) {
          setFetchError(response.message || "Failed to fetch attendance data");
          return;
        }
        
        if (response.data && response.data.length > 0) {
          // Create new attendance data object
          const newAttendanceData: { [key: string]: boolean } = {};
          const newAttendanceIds: string[] = [];
          
          // Initialize all students as absent (default state)
          students.forEach(student => {
            newAttendanceData[student.id] = false;
          });
          
          // Update with actual attendance data
          response.data.forEach((item: AttendanceRecord) => {
            if (students.some(s => s.id === item.studentId)) {
              newAttendanceData[item.studentId] = item.present;
            }
            
            // Store attendance IDs for deletion
            if (item.id) {
              newAttendanceIds.push(item.id.toString());
            }
          });
          
          // Update the attendance data state
          setAttendanceData(newAttendanceData);
          setAttendanceIds(newAttendanceIds);
          
          // Show success toast
          toast.info(`Loaded attendance data for ${response.data.length} students`);
        } else {
          // If no data found, reset to defaults
          const defaultData: { [key: string]: boolean } = {};
          students.forEach(student => {
            defaultData[student.id] = false;
          });
          
          setAttendanceData(defaultData);
          setAttendanceIds([]);
          
          // Show info toast
          toast.info('No existing attendance data found for this date and lesson');
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setFetchError('Failed to fetch attendance data. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchAttendanceData();
  }, [selectedLesson, attendanceDate, isDataLoaded, students]);

  // Handle form submission for create/update
  const [state, formAction] = useFormState(
    type === "create" ? createAttendance : updateAttendance,
    { success: false, error: false, message: "" }
  );
  
  // Handle delete operation
  const [deleteState, deleteAction] = useFormState(
    deleteAttendance,
    { success: false, error: false, message: "" }
  );

  // Handle checkbox change
  const handleCheckboxChange = (studentId: string) => {
    setAttendanceData(prev => {
      // Make sure we have a value for this student
      const currentValue = prev[studentId] !== undefined ? prev[studentId] : false;
      
      return {
        ...prev,
        [studentId]: !currentValue
      };
    });
  };

  // Handle delete operation
  const handleDelete = () => {
    const formData = new FormData();
    
    // Add attendance IDs for deletion if available
    if (attendanceIds.length > 0) {
      attendanceIds.forEach(id => {
        formData.append("ids", id);
      });
      console.log("Adding attendance IDs for deletion:", attendanceIds);
    }
    
    // Always include lessonId and date as fallback
    if (selectedLesson) {
      formData.append("lessonId", selectedLesson.toString());
      console.log("Adding lesson ID for deletion:", selectedLesson);
    }
    
    formData.append("date", attendanceDate);
    console.log("Adding date for deletion:", attendanceDate);
    
    // Call the delete action
    deleteAction(formData);
  };

  // Handle lesson selection
  const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLesson(Number(e.target.value));
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttendanceDate(e.target.value);
  };

  // Select/Deselect all students
  const handleSelectAll = (present: boolean) => {
    const newData: { [key: string]: boolean } = {};
    students.forEach(student => {
      newData[student.id] = present;
    });
    setAttendanceData(newData);
  };

  // Handle submission success/failure
  useEffect(() => {
    if (state.success) {
      // Show success toast notification
      toast.success(state.message || "Attendance recorded successfully!");
      
      // Auto-close the form
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      // Show error toast notification
      toast.error(state.message || "Error recording attendance. Please try again.");
    }
  }, [state, router, setOpen, selectedLesson]);

  // Handle delete success/failure
  useEffect(() => {
    if (deleteState.success) {
      // Show success toast notification
      toast.success(deleteState.message || "Attendance records deleted successfully!");
      
      // Auto-close the form
      setOpen(false);
      router.refresh();
    } else if (deleteState.error) {
      // Show error toast notification
      toast.error(deleteState.message || "Error deleting attendance records.");
    }
  }, [deleteState, router, setOpen]);

  // Get selected lesson details
  const currentLesson = lessons.find(l => l.id === selectedLesson);

  // Prepare form submission data
  const prepareFormData = (formData: FormData) => {
    // Add the selected lesson and date
    if (selectedLesson) formData.append("lessonId", selectedLesson.toString());
    formData.append("date", attendanceDate);
    
    // Add student attendance data
    students.forEach(student => {
      const isPresent = attendanceData[student.id] ?? false;
      formData.append(`attendance[${student.id}]`, isPresent.toString());
    });
    
    return formData;
  };

  return (
    <form 
      action={(formData) => {
        const enhancedFormData = prepareFormData(formData);
        formAction(enhancedFormData);
      }} 
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-center mb-4">
        {type === "create" ? "Record Attendance" : "Update Attendance"}
      </h2>
      
      {/* Lesson Selection */}
      <div className="mb-4">
        <label htmlFor="lessonId" className="block mb-2 text-sm font-medium">
          Select Lesson:
        </label>
        <select
          id="lessonId"
          name="lessonId"
          value={selectedLesson || ""}
          onChange={handleLessonChange}
          required
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select a lesson</option>
          {lessons.map(lesson => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.subjectOffering.subject.name} - {lesson.day} (
              {format(new Date(lesson.startTime), "h:mm a")} - 
              {format(new Date(lesson.endTime), "h:mm a")})
            </option>
          ))}
        </select>
        {urlLessonId && (
          <p className="mt-1 text-sm text-green-600">
            Lesson auto-selected from filters
          </p>
        )}
      </div>
      
      {/* Date Selection */}
      <div className="mb-4">
        <label htmlFor="date" className="block mb-2 text-sm font-medium">
          Date:
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={attendanceDate}
          onChange={handleDateChange}
          required
          className="w-full p-2 border rounded-md"
        />
        {searchParams.get("date") && (
          <p className="mt-1 text-sm text-green-600">
            Date auto-selected from filters
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          You can change the date to update attendance for previous days
        </p>
      </div>
      
      {/* Loading indicator during data fetch */}
      {isFetching && (
        <div className="flex justify-center items-center p-3 bg-blue-50 rounded-md mb-4">
          <svg className="animate-spin mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-blue-700">Loading attendance data...</span>
        </div>
      )}
      
      {/* Fetch error message */}
      {fetchError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md mb-4">
          <p>Error: {fetchError}</p>
        </div>
      )}
      
      {/* Display selected lesson details */}
      {currentLesson && (
        <div className="p-3 bg-gray-50 rounded-md mb-4">
          <h3 className="font-medium">{currentLesson.subjectOffering.subject.name}</h3>
          <div className="text-sm text-gray-600 mt-1">
            <div>Day: {currentLesson.day}</div>
            <div>Time: {format(new Date(currentLesson.startTime), "h:mm a")} - {format(new Date(currentLesson.endTime), "h:mm a")}</div>
            <div>Semester: {currentLesson.subjectOffering.semester.number}</div>
            <div className="mt-1 text-xs font-medium">
              {type === "update" ? "Updating attendance for:" : "Recording attendance for:"} <span className="text-blue-600">{attendanceDate}</span>
            </div>
            {attendanceIds.length > 0 && (
              <div className="mt-1 text-xs text-green-600 font-medium">
                Existing attendance records found for this date
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Select All / Deselect All */}
      <div className="flex gap-2 justify-end mb-2">
        <button
          type="button"
          onClick={() => handleSelectAll(true)}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={() => handleSelectAll(false)}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Deselect All
        </button>
      </div>
      
      {/* Students List */}
      <div className="max-h-80 overflow-y-auto border rounded-md">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Student</th>
              <th className="py-2 px-4 text-center text-sm font-medium text-gray-700 w-24">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.length > 0 ? (
              students.map(student => {
                // Check if student has attendance data
                const isPresent = attendanceData[student.id] ?? false;
                
                return (
                  <tr key={student.id} className={`hover:bg-gray-50 ${isPresent ? "bg-green-50" : "bg-red-50"}`}>
                    <td className="py-2 px-4">
                      <label htmlFor={`student-${student.id}`} className="cursor-pointer">
                        {student.surname}, {student.name}
                      </label>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        name={`students[${student.id}]`}
                        checked={isPresent}
                        onChange={() => handleCheckboxChange(student.id)}
                        className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                      />
                      <input
                        type="hidden"
                        name="studentIds"
                        value={student.id}
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-500">
                  No students found for this class
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add attendance IDs as hidden fields for update */}
      {type === "update" && attendanceIds.map((id, index) => (
        <input 
          key={index} 
          type="hidden" 
          name="ids" 
          value={id} 
        />
      ))}
      
      {/* Attendance Status Summary */}
      <div className="text-xs text-gray-500 flex justify-between">
        <span>Total students: {students.length}</span>
        <span>Present: {Object.values(attendanceData).filter(Boolean).length}</span>
        <span>Absent: {students.length - Object.values(attendanceData).filter(Boolean).length}</span>
      </div>
      
      {/* Error message */}
      {state.error && (
        <div className="text-red-500 text-sm">{state.message}</div>
      )}
      
      {/* Submit button and Delete button */}
      <div className="flex justify-between gap-2 mt-4">
        <div>
          {type === "update" || (selectedLesson && attendanceDate) ? (
            <DeleteButton onClick={handleDelete} />
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <SubmitButton type={type} />
        </div>
      </div>
    </form>
  );
};

export default AttendanceForm;