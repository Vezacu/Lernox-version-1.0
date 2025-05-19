"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { courseSchema, type CourseSchema } from "@/lib/formValidationSchemas";
import { createCourse, updateCourse, deleteCourse } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface CourseFormProps {
  type: "create" | "update" | "delete";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    courseTypes: Array<{
      id: number;
      name: string;
      duration: number;
      semesters: number;
    }>;
  };
}

const CourseForm = ({ type, data, setOpen }: CourseFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    formState: { errors },
  } = useForm<CourseSchema>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name,
      duration: data?.duration,
      semesters: data?.semesters
    }
  });

  const handleFormAction = async (formData: FormData) => {
    try {
      setLoading(true);
      setFormError(null);

      const currentState = { success: false, error: false };
      
      if (type === "delete") {
        const id = formData.get("id");
        if (!id) {
          setFormError("Course ID is missing");
          return;
        }

        const response = await deleteCourse(currentState, formData);
        
        if (response.success) {
          await Promise.all([
            new Promise(resolve => {
              toast.success("Course deleted successfully!", {
                onClose: resolve
              });
            }),
            router.refresh()
          ]);
          setOpen(false);
        } else {
          setFormError("Failed to delete course. Please try again.");
          toast.error("Failed to delete course");
        }
        return;
      }

      const payload = {
        id: formData.get('id') ? Number(formData.get('id')) : undefined,
        name: formData.get('name') as string,
        duration: Number(formData.get('duration')),
        semesters: Number(formData.get('semesters'))
      };

      const response = await (type === "create" ? createCourse : updateCourse)(currentState, payload);

      if (response.success) {
        toast.success(`Course ${type === "create" ? "created" : "updated"} successfully!`);
        setOpen(false);
        router.refresh();
      } else {
        setFormError(`Failed to ${type} course. Please try again.`);
        toast.error(`Failed to ${type} course`);
      }
    } catch (error) {
      console.error(`Error ${type}ing course:`, error);
      setFormError(`An error occurred while ${type}ing the course`);
      toast.error(`Failed to ${type} course`);
    } finally {
      setLoading(false);
    }
  };

  if (type === "delete") {
    return (
      <form action={handleFormAction} className="p-4 flex flex-col gap-4">
        <input type="hidden" name="id" value={data?.id} />
        <span className="text-center font-medium">
          Are you sure you want to delete this course?
        </span>
        <button
          type="submit"
          disabled={loading}
          className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Deleting...' : 'Delete Course'}
        </button>
        {formError && (
          <p className="text-sm text-red-500 text-center">{formError}</p>
        )}
      </form>
    );
  }

  return (
    <form action={handleFormAction} className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Course" : "Update Course"}
      </h1>

      {data?.id && <input type="hidden" {...register("id")} />}

      <div className="flex flex-col gap-4">
        <InputField
          label="Course Name"
          name="name"
          register={register}
          error={errors.name}
          disabled={loading}
        />

        <InputField
          label="Duration (Years)"
          name="duration"
          type="number"
          register={register}
          error={errors.duration}
          disabled={loading}
        />

        <InputField
          label="Number of Semesters"
          name="semesters"
          type="number"
          register={register}
          error={errors.semesters}
          disabled={loading}
        />

        {formError && (
          <p className="text-sm text-red-500 mt-2">{formError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : type === "create" ? "Create Course" : "Update Course"}
      </button>
    </form>
  );
};

export default CourseForm;