"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { z } from "zod";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createLesson, updateLesson } from "@/lib/actions";

// Simplified schema for better UX
const createLessonSchema = z.object({
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], {
    required_error: "Day is required"
  }),
  courseId: z.coerce.number({ required_error: "Course selection is required" }),
  semesterId: z.coerce.number({ required_error: "Semester selection is required" }),
  subjectOfferingId: z.coerce.number({ required_error: "Subject required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required")
});

// Update schema includes status and ID
const updateLessonSchema = createLessonSchema.extend({
  id: z.coerce.number({ required_error: "Lesson ID is required" }),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"], {
    required_error: "Status is required"
  })
});

type CreateLessonSchema = z.infer<typeof createLessonSchema>;
type UpdateLessonSchema = z.infer<typeof updateLessonSchema>;

// Define an interface for the update form defaults
interface UpdateFormDefaults {
  id: number;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
  courseId: number;
  semesterId: number;
  subjectOfferingId: number;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

const LessonForm = ({ 
  type, 
  data, 
  setOpen, 
  relatedData 
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const { courses = [], semesters = [], subjectOfferings = [] } = relatedData || {};
  const [loading, setLoading] = useState(true);
  
  // Format time for display - wrapped in useCallback to prevent dependency changes
  const formatTimeForInput = useCallback((dateTime?: Date) => {
    if (!dateTime) return "";
    return dateTime.toTimeString().substring(0, 5); // "HH:MM" format
  }, []);

  // Extract data for an update form - with formatTimeForInput now stable in dependencies
  const getUpdateFormDefaults = useCallback((): UpdateFormDefaults | null => {
    if (!data || type !== "update") return null;
    
    try {
      return {
        id: data.id,
        day: data.day || "MONDAY",
        courseId: data.subjectOffering?.semester?.courseId || 0,
        semesterId: data.subjectOffering?.semesterId || 0,
        subjectOfferingId: data.subjectOfferingId || 0,
        startTime: formatTimeForInput(data.startTime) || "09:00",
        endTime: formatTimeForInput(data.endTime) || "10:00",
        status: data.status || "SCHEDULED"
      };
    } catch (error) {
      console.error("Error extracting update data:", error);
      return null;
    }
  }, [data, type, formatTimeForInput]);
  
  // Create separate form hooks for create and update
  const { 
    register: registerCreate, 
    handleSubmit: handleSubmitCreate, 
    watch: watchCreate,
    setValue: setValueCreate,
    formState: { errors: errorsCreate } 
  } = useForm<CreateLessonSchema>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      day: "MONDAY",
      courseId: 0,
      semesterId: 0,
      subjectOfferingId: 0,
      startTime: "09:00",
      endTime: "10:00"
    }
  });
  
  const { 
    register: registerUpdate, 
    handleSubmit: handleSubmitUpdate,
    watch: watchUpdate,
    setValue: setValueUpdate, 
    formState: { errors: errorsUpdate } 
  } = useForm<UpdateLessonSchema>({
    resolver: zodResolver(updateLessonSchema),
    defaultValues: getUpdateFormDefaults() || {
          id: 0,
          day: "MONDAY",
          courseId: 0,
          semesterId: 0,
          subjectOfferingId: 0,
          startTime: "09:00",
          endTime: "10:00",
          status: "SCHEDULED"
        }
  });
  
  // Use the appropriate action and form state
  const [state, formAction] = useFormState(
    type === "create" ? createLesson : updateLesson,
    { success: false, error: false }
  );
  
  const router = useRouter();
  
  // Watch values for dependent fields
  const selectedCourse = type === "create" 
    ? watchCreate("courseId") 
    : watchUpdate("courseId");
    
  const selectedSemester = type === "create"
    ? watchCreate("semesterId")
    : watchUpdate("semesterId");
  
  // State for filtered data
  const [filteredSemesters, setFilteredSemesters] = useState<any[]>([]);
  const [filteredSubjectOfferings, setFilteredSubjectOfferings] = useState<any[]>([]);

  // Initialize update form with data - now correctly using getUpdateFormDefaults in dependencies
  useEffect(() => {
    if (type === "update" && data) {
      const defaults = getUpdateFormDefaults();
      if (defaults) {
        // Set the values for the update form
        console.log("Setting update form defaults:", defaults);
        
        // Set initial values
        Object.entries(defaults).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            setValueUpdate(key as any, value);
          }
        });
      }
    }
    setLoading(false);
  }, [type, data, setValueUpdate, getUpdateFormDefaults]);

  // Filter semesters based on selected course
  useEffect(() => {
    if (selectedCourse) {
      const filtered = semesters.filter((s: { courseId: number }) => s.courseId === Number(selectedCourse));
      setFilteredSemesters(filtered);
    } else {
      setFilteredSemesters([]);
    }
  }, [selectedCourse, semesters]);
  
  // Filter subject offerings based on selected semester
  useEffect(() => {
    if (selectedSemester) {
      const filtered = subjectOfferings.filter((so: { semesterId: number }) => so.semesterId === Number(selectedSemester));
      setFilteredSubjectOfferings(filtered);
    } else {
      setFilteredSubjectOfferings([]);
    }
  }, [selectedSemester, subjectOfferings]);
  
  // Handle form success/error
  useEffect(() => {
    if (state.success) {
      toast.success(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.message || "An error occurred");
      
      // Add specific error handling for schedule conflicts
      if (state.message && (
        state.message.includes("already a lesson scheduled") || 
        state.message.includes("teacher is already assigned")
      )) {
        toast.error("Schedule conflict detected. Please choose a different time slot.");
      }
    }
  }, [state, type, setOpen, router]);
  
  // Validate time inputs
  const validateTimeInputs = () => {
    const startTime = type === "create" ? watchCreate("startTime") : watchUpdate("startTime");
    const endTime = type === "create" ? watchCreate("endTime") : watchUpdate("endTime");
    
    if (!startTime || !endTime) return true; // Let the form validation handle empty fields
    
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    if (end <= start) {
      toast.error("End time must be after start time");
      return false;
    }
    
    return true;
  };

  // Calculate end time (1 hour after start time)
  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    date.setHours(date.getHours() + 1);
    
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Handle start time change to auto-adjust end time
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    const newEndTime = calculateEndTime(newStartTime);
    
    if (type === "create") {
      setValueCreate("startTime", newStartTime);
      setValueCreate("endTime", newEndTime);
    } else {
      setValueUpdate("startTime", newStartTime);
      setValueUpdate("endTime", newEndTime);
    }
  };

  // Different form handlers for create and update with validation
  const onSubmitCreate = handleSubmitCreate((data) => {
    if (!validateTimeInputs()) return;
    console.log("Creating lesson with data:", data);
    formAction(data);
  });
  
  const onSubmitUpdate = handleSubmitUpdate((data) => {
    if (!validateTimeInputs()) return;
    console.log("Updating lesson with data:", data);
    formAction(data);
  });

  if (loading) {
    return <div className="p-4 text-center">Loading form data...</div>;
  }

  return (
    <form 
      className="flex flex-col gap-6 " 
      onSubmit={type === "create" ? onSubmitCreate : onSubmitUpdate}
    >
      <h1 className="text-xl font-semibold">
        {type === "create" ? "" : ""}
      </h1>
      
      {/* Hidden ID field for updates */}
      {type === "update" && (
        <input 
          type="hidden" 
          {...registerUpdate("id")} 
        />
      )}
      
      {/* Course & Semester Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Course Selection */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">Course</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            {...(type === "create" ? registerCreate("courseId") : registerUpdate("courseId"))}
            disabled={type === "update"} // Disable in update mode
          >
            <option value="">Select Course</option>
            {courses.map((course: any) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          {(type === "create" ? errorsCreate.courseId : errorsUpdate.courseId) && (
            <p className="text-xs text-red-400">
              {(type === "create" ? errorsCreate.courseId?.message : errorsUpdate.courseId?.message) || "Course is required"}
            </p>
          )}
          {type === "update" && (
            <p className="text-xs text-gray-500 mt-1">Course cannot be changed when updating</p>
          )}
        </div>
        
        {/* Semester Selection */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">Semester</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            {...(type === "create" ? registerCreate("semesterId") : registerUpdate("semesterId"))}
            disabled={!selectedCourse || type === "update"} // Disable if no course or in update mode
          >
            <option value="">Select Semester</option>
            {filteredSemesters.map((semester: any) => (
              <option key={semester.id} value={semester.id}>
                Semester {semester.number}
              </option>
            ))}
          </select>
          {(type === "create" ? errorsCreate.semesterId : errorsUpdate.semesterId) && (
            <p className="text-xs text-red-400">
              {(type === "create" ? errorsCreate.semesterId?.message : errorsUpdate.semesterId?.message) || "Semester is required"}
            </p>
          )}
          {type === "update" && (
            <p className="text-xs text-gray-400 mt-1">Semester cannot be changed when updating</p>
          )}
        </div>
      </div>
      
      {/* Day, Subject, and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Day Selection */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">Day</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            {...(type === "create" ? registerCreate("day") : registerUpdate("day"))}
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
          </select>
          {(type === "create" ? errorsCreate.day : errorsUpdate.day) && (
            <p className="text-xs text-red-400">
              {(type === "create" ? errorsCreate.day?.message : errorsUpdate.day?.message) || "Day is required"}
            </p>
          )}
        </div>
        
        {/* Subject Selection */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">Subject</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            {...(type === "create" ? registerCreate("subjectOfferingId") : registerUpdate("subjectOfferingId"))}
            disabled={!selectedSemester}
          >
            <option value="">Select Subject</option>
            {filteredSubjectOfferings.map((so: any) => (
              <option key={so.id} value={so.id}>
                {so.subject.name} - {so.teacher.name}
              </option>
            ))}
          </select>
          {(type === "create" ? errorsCreate.subjectOfferingId : errorsUpdate.subjectOfferingId) && (
            <p className="text-xs text-red-400">
              {(type === "create" ? errorsCreate.subjectOfferingId?.message : errorsUpdate.subjectOfferingId?.message) || "Subject is required"}
            </p>
          )}
        </div>
        
        {/* Status Selection - only for updates */}
        {type === "update" && (
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-400">Status</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
              {...registerUpdate("status")}
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {errorsUpdate.status && (
              <p className="text-xs text-red-400">{errorsUpdate.status.message}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Time Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">Start Time</label>
          <input
            type="time"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            {...(type === "create" ? registerCreate("startTime") : registerUpdate("startTime"))}
            onChange={handleStartTimeChange}
          />
          {(type === "create" ? errorsCreate.startTime : errorsUpdate.startTime) && (
            <p className="text-xs text-red-400">
              {(type === "create" ? errorsCreate.startTime?.message : errorsUpdate.startTime?.message) || "Start time is required"}
            </p>
          )}
        </div>
        
        {/* End Time */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-400">End Time</label>
          <input
            type="time"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            {...(type === "create" ? registerCreate("endTime") : registerUpdate("endTime"))}
          />
          {(type === "create" ? errorsCreate.endTime : errorsUpdate.endTime) && (
            <p className="text-xs text-red-400">
              {(type === "create" ? errorsCreate.endTime?.message : errorsUpdate.endTime?.message) || "End time is required"}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">End time must be after start time</p>
        </div>
      </div>
      
      {/* Error message with improved feedback */}
      {state.error && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md border border-red-200">
          <p className="font-medium">Error:</p>
          <p>{state.message || "Something went wrong. Please try again."}</p>
          {state.message && (state.message.includes("already a lesson scheduled") || state.message.includes("teacher is already assigned")) && (
            <p className="mt-1 text-xs">Try selecting a different time slot or checking the schedule for conflicts.</p>
          )}
        </div>
      )}
      
      {/* Submit button */}
      <button
        type="submit"
        className="bg-[#40e0d0] text-gray-900 p-2 rounded-md disabled:opacity-50"
        disabled={type === "create" && !selectedSemester}
      >
        {type === "create" ? "Create Lesson" : "Update Lesson"}
      </button>
    </form>
  );
};

export default LessonForm;
