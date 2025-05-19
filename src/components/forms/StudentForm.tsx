"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createStudent, updateStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

interface FormResponse {
  success: boolean;
  error: boolean;
  message?: string;
}

const StudentForm = ({
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
  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : null);
  const router = useRouter();

  const [filteredSemesters, setFilteredSemesters] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    data?.courseId?.toString() || ""
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: data,
  });

    // Watch for course ID changes
    const watchedCourseId = watch("courseId");

    // Update selectedCourseId when watchedCourseId changes
    useEffect(() => {
      setSelectedCourseId(watchedCourseId ? watchedCourseId.toString() : "");
    }, [watchedCourseId]);
  
    // Filter semesters based on selected course
    useEffect(() => {
      const { semesters } = relatedData;
      
      if (selectedCourseId) {
        const courseId = parseInt(selectedCourseId);
        const courseSemesters = semesters.filter(
          (sem: any) => sem.courseId === courseId
        );
        setFilteredSemesters(courseSemesters);
      } else {
        setFilteredSemesters([]);
      }
    }, [selectedCourseId, relatedData]);

  const [state, formAction] = useFormState<FormResponse, any>(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
    }
  );

  // Handle form submission
  const onSubmit = handleSubmit((formData) => {
    const submissionData = { 
      ...formData, 
      img: img?.secure_url,
      courseId: Number(formData.courseId),
      currentSemesterId: Number(formData.currentSemesterId) 
    };
    
    console.log("Submitting data:", submissionData);
    formAction(submissionData);
  });

  // Effect to handle success/error states
  useEffect(() => {
    if (state.success) {
      toast.success(`Student has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, type, setOpen, router]);

  const { courses, semesters } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new student" : "Update the student"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      
      {/* Image upload widget */}
      <CldUploadWidget
        uploadPreset="school"
        onSuccess={(result: any, { widget }: any) => {
          setImg(result.info);
          widget.close();
        }}
      >
        {({ open }) => (
          <div
            className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
            onClick={() => open?.()}
          >
            <Image src="/upload.png" alt="" width={28} height={28} />
            <span>Upload a photo</span>
          </div>
        )}
      </CldUploadWidget>

      {/* Show preview if image is uploaded */}
      {img && (
        <div className="mt-2">
          <Image
            src={img.secure_url}
            alt="Uploaded photo"
            width={100}
            height={100}
            className="object-cover rounded-md"
          />
        </div>
      )}
      
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
         <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Blood Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("bloodType")}
            defaultValue={data?.bloodType || ""}
          >
            <option value="">Select Blood Type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
          {errors.bloodType?.message && (
            <p className="text-xs text-red-400">
              {errors.bloodType.message.toString()}
            </p>
          )}
        </div>
        <InputField
          label="Birthday"
          name="birthday"
          defaultValue={data?.birthday ? data.birthday.toISOString().split("T")[0] : ""}
          register={register}
          error={errors.birthday}
          type="date"
        />
        <InputField
          label="Parent Id"
          name="parentId"
          defaultValue={data?.parentId}
          register={register}
          error={errors.parentId}
        />
        {data?.id && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex || "MALE"}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Course</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("courseId")}
            defaultValue={data?.courseId || ""}
          >
            <option value="">Select Course</option>
            {courses.map((course: { id: number; name: string }) => (
              <option value={course.id} key={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          {errors.courseId?.message && (
            <p className="text-xs text-red-400">
              {errors.courseId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
        <label className="text-xs text-gray-500">Semester</label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          {...register("currentSemesterId")}
          defaultValue={data?.currentSemesterId?.toString() || ""}
          disabled={!selectedCourseId} // Disable if no course selected
        >
          <option value="">Select Semester</option>
          {filteredSemesters.map((semester: { id: number; number: number; courseId: number }) => {
            const course = courses.find((c: any) => c.id === semester.courseId);
            return (
              <option key={semester.id} value={semester.id}>
                Semester {semester.number} {course ? `(${course.name})` : ''}
              </option>
            );
          })}
        </select>
        {errors.currentSemesterId?.message && (
          <p className="text-xs text-red-400">
            {errors.currentSemesterId.message.toString()}
          </p>
        )}
      </div>
      </div>
      
      {/* Error message */}
      {state.error && (
        <span className="text-red-500">{state.message || "Something went wrong!"}</span>
      )}
      
      {/* Submit button */}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default StudentForm;