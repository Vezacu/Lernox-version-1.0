"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { subjectOfferingSchema } from "@/lib/formValidationSchemas";
import { createSubjectOffering, updateSubjectOffering } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const SubjectOfferingForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    data?.semester?.course?.id?.toString() || ""
  );
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(subjectOfferingSchema),
    defaultValues: {
      id: data?.id || undefined,
      subjectId: data?.subjectId || "",
      semesterId: data?.semesterId || "",
      teacherId: data?.teacherId || "",
    },
  });

  const { subjects = [], courses = [], semesters = [], teachers = [] } = relatedData || {};

  const [filteredSemesters, setFilteredSemesters] = useState(
    selectedCourseId 
      ? semesters.filter((sem: any) => sem.courseId === parseInt(selectedCourseId))
      : []
  );

  useEffect(() => {
    if (selectedCourseId) {
      const courseId = parseInt(selectedCourseId);
      const courseSemesters = semesters.filter(
        (sem: any) => sem.courseId === courseId
      );
      setFilteredSemesters(courseSemesters);
    } else {
      setFilteredSemesters([]);
    }
  }, [selectedCourseId, semesters]);

  // Set default values if data exists
  useEffect(() => {
    if (data && type === "update") {
      setValue("id", data.id);
      setValue("subjectId", data.subjectId);
      setValue("semesterId", data.semesterId);
      setValue("teacherId", data.teacherId);
      
      // Set selected course ID based on the semester's course
      if (data.semester?.courseId) {
        setSelectedCourseId(data.semester.courseId.toString());
      }
    }
  }, [data, setValue, type]);

  const [state, formAction] = useFormState(
    type === "create" ? createSubjectOffering : updateSubjectOffering,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction({
      ...formData,
      id: type === "update" ? data.id : undefined,
      semesterId: parseInt(formData.semesterId),
      subjectId: parseInt(formData.subjectId),
    });
  });

  const router = useRouter();
  useEffect(() => {
    if (state.success) {
      toast.success(`Subject offering ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(`Failed to ${type} subject offering. Please try again.`);
    }
  }, [state, type, setOpen, router]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 ">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "" : ""}
      </h1>

      {/* Add hidden input for ID if updating */}
      {type === "update" && data?.id && (
        <input type="hidden" {...register("id")} value={data.id} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Course Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Course</label>
          <select
            className="p-2 border rounded-md text-black"
            onChange={(e) => setSelectedCourseId(e.target.value)}
            value={selectedCourseId}
          >
            <option value="">Select Course</option>
            {courses.map((course: any) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          {!selectedCourseId && (
            <span className="text-amber-500 text-sm">Select a course to see available semesters</span>
          )}
        </div>

        {/* Semester Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Semester</label>
          <select
            {...register("semesterId")}
            className="p-2 border rounded-md text-black"
            disabled={!selectedCourseId}
          >
            <option value="">Select Semester</option>
            {filteredSemesters.map((semester: any) => (
              <option key={semester.id} value={semester.id}>
                Semester {semester.number}
              </option>
            ))}
          </select>
          {errors.semesterId && (
            <span className="text-red-500 text-sm">{String(errors.semesterId.message)}</span>
          )}
        </div>

        {/* Subject Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Subject</label>
          <select {...register("subjectId")}
           className="p-2 border rounded-md text-black">
            <option value="">Select Subject</option>
            {subjects.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <span className="text-red-500 text-sm text-black">{String(errors.subjectId.message)}</span>
          )}
        </div>

        {/* Teacher Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Teacher</label>
          <select {...register("teacherId")}
           className="p-2 border rounded-md text-black">
            <option value="">Select Teacher</option>
            {teachers.map((teacher: any) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.teacherId && (
            <span className="text-red-500 text-sm">{String(errors.teacherId.message)}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-[#40e0d0] text-gray-900 px-4 py-2 rounded-md "
        >
          {type === "create" ? "Create" : "Update"} Subject Offering
        </button>
      </div>
    </form>
  );
};

export default SubjectOfferingForm;