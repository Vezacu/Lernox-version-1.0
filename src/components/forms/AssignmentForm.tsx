
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useFormState } from "react-dom";
import { createAssignment, updateAssignment } from "@/lib/actions";

interface AssignmentFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: (open: boolean) => void;
  relatedData?: {
    courses: { id: number; name: string }[];
    semesters: { id: number; number: number; courseId: number }[];
  };
}

export default function AssignmentForm({
  type,
  data,
  setOpen,
  relatedData
}: AssignmentFormProps) {
  const router = useRouter();
  
  // Form fields
  const [title, setTitle] = useState(data?.title || '');
  const [description, setDescription] = useState(data?.description || '');
  const [courseId, setCourseId] = useState(
    data?.courseId ? data.courseId.toString() : ''
  );
  const [semesterId, setSemesterId] = useState(
    data?.semesterId ? data.semesterId.toString() : ''
  );
  const [startDate, setStartDate] = useState(
    data?.startDate 
      ? new Date(data.startDate).toISOString().split('T')[0]
      : ''
  );
  const [dueDate, setDueDate] = useState(
    data?.dueDate
      ? new Date(data.dueDate).toISOString().split('T')[0]
      : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Get courses and semesters from related data
  const courses = relatedData?.courses || [];
  const semesters = relatedData?.semesters || [];
  
  // Get filtered semesters based on selected course
  const filteredSemesters = courseId 
    ? semesters.filter(s => s.courseId === parseInt(courseId))
    : [];
  
  // Initial state for form submission
  const initialState = { success: false, error: false };
  
  // Create form state for submission with a callback to handle the response
  const [formState, formAction] = useFormState(
    async (prevState: { success: boolean; error: boolean }, formData: any) => {
      setIsLoading(true);
      try {
        // Call the appropriate action based on form type
        const result = await (type === "update" 
          ? updateAssignment(prevState, formData) 
          : createAssignment(prevState, formData));
        
        if (result.success) {
          toast.success(type === "update" ? 'Assignment updated!' : 'Assignment created!');
          router.refresh();
          setOpen(false);
        } else if (result.error) {
          toast.error('Something went wrong');
        }
        return result;
      } catch (error) {
        toast.error('Failed to save assignment');
        console.error(error);
        return { success: false, error: true };
      } finally {
        setIsLoading(false);
      }
    }, 
    initialState
  );
  
  // Validate form before submission
  const validateForm = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return false;
    }
    
    if (!description.trim()) {
      toast.error('Description is required');
      return false;
    }
    
    if (!courseId) {
      toast.error('Please select a course');
      return false;
    }
    
    if (!semesterId) {
      toast.error('Please select a semester');
      return false;
    }
    
    if (!startDate) {
      toast.error('Start date is required');
      return false;
    }
    
    if (!dueDate) {
      toast.error('Due date is required');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Prepare the form data for submission
    const formData = {
      id: data?.id,
      title,
      description,
      courseId: parseInt(courseId),
      semesterId: parseInt(semesterId),
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
    };
    
    // Submit the form using formAction
    formAction(formData);
  };
  
  // Handle course change (reset semester when course changes)
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCourseId(e.target.value);
    setSemesterId('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields remain unchanged */}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={isLoading}
          placeholder="Assignment title"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
          rows={4}
          disabled={isLoading}
          placeholder="Assignment description"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={courseId}
            onChange={handleCourseChange}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id.toString()}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Semester</label>
          <select
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isLoading || !courseId || filteredSemesters.length === 0}
          >
            <option value="">Select Semester</option>
            {filteredSemesters.map((semester) => (
              <option key={semester.id} value={semester.id.toString()}>
                Semester {semester.number}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 border rounded"
          disabled={isLoading}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : type === "update" ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
