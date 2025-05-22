"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

interface FormResponse {
  success: boolean;
  error: boolean;
  message?: string;
}

const TeacherForm = ({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : null);
  const router = useRouter();

  // State for filtering subject offerings
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    data?.courseId?.toString() || ""
  );
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    data?.currentSemesterId?.toString() || ""
  );
  const [filteredSemesters, setFilteredSemesters] = useState<any[]>([]);
  const [availableSubjectOfferings, setAvailableSubjectOfferings] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    defaultValues: type === "update" ? {
      id: data?.id,
      username: data?.username,
      name: data?.name,
      surname: data?.surname,
      email: data?.email,
      phone: data?.phone,
      address: data?.address,
      bloodType: data?.bloodType,
      sex: data?.sex,
      birthday: data?.birthday ? new Date(data.birthday) : undefined,
      subjectOfferings: data?.subjectOfferings?.map((so: any) => so.id) || []
    } : undefined
  });
  
  // Watch for course ID changes
  const watchedCourseId = watch("courseId");
  const selectedSubjectOfferings = watch("subjectOfferings") || [];

  // Update selectedCourseId when watchedCourseId changes
  useEffect(() => {
    if (watchedCourseId) {
      setSelectedCourseId(watchedCourseId.toString());
    }
  }, [watchedCourseId]);

  // Filter semesters based on selected course
  useEffect(() => {
    const { semesters = [] } = relatedData || {};
    
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

  // Update available subject offerings when semester changes
  useEffect(() => {
    const { subjectOfferings = [] } = relatedData || {};
    
    if (selectedSemesterId) {
      const semesterId = parseInt(selectedSemesterId);
      const filtered = subjectOfferings.filter(
        (so: any) => so && so.semesterId === semesterId
      );
      setAvailableSubjectOfferings(filtered);
    } else {
      setAvailableSubjectOfferings([]);
    }
  }, [selectedSemesterId, relatedData]);

  const [state, formAction] = useFormState<FormResponse, any>(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  useEffect(() => {
    console.log("Form state in useEffect:", state);
    console.log("Type:", type);
    console.log("Is success:", state.success);
    
    if (state.success) {
      console.log("Success condition met, closing form");
      toast.success(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      console.error("Form error:", state.message);
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, type, setOpen, router]);
  
  // Handle form submission
// In TeacherForm component's onSubmit
const onSubmit = handleSubmit((formData) => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  const submissionToast = toast.loading(
    `${type === "create" ? "Creating" : "Updating"} teacher...`
  );

  try {
    const processedData = {
      ...formData,
      id: type === "update" ? data.id : undefined,
      img: img?.secure_url,
      birthday: new Date(formData.birthday),
      subjectOfferings: formData.subjectOfferings?.map(Number) || []
    };

    console.log("Submitting teacher data:", processedData);
    formAction(processedData);

    toast.update(submissionToast, {
      render: `Teacher ${type === "create" ? "created" : "updated"} successfully!`,
      type: "success",
      isLoading: false,
      autoClose: 2000
    });

  } catch (err) {
    console.error("Form submission error:", err);
    toast.update(submissionToast, {
      render: "An error occurred during submission",
      type: "error",
      isLoading: false,
      autoClose: 2000
    });
    setIsSubmitting(false);
  }
});

  // Effect to handle success/error states
// In your form's useEffect for state changes
useEffect(() => {
  console.log("Form state changed:", state);
  if (state.success) {
    toast.success(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
    setOpen(false);
    router.refresh();
  } else if (state.error) {
    console.error("Form error:", state.message);
    toast.error(state.message || "Something went wrong!");
  }
}, [state, type, setOpen, router]);

  // Extract these from relatedData with default empty arrays
  const {
    subjects = [],
    courses = [],
    semesters = [],
    subjectOfferings = [],
  } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "" : ""}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          className="text-black"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          className="text-black"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          className="text-black"
          defaultValue=""
          register={register}
          error={errors?.password}
        />
        {data?.id && (
          <InputField
            label="Id"
            name="id"
            className="text-black"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
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
           className="text-black" 
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
           className="text-black" 
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
           className="text-black" 
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
           className="text-black" 
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Blood Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
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
         className="text-black" 
        defaultValue={
          data?.birthday
            ? new Date(data.birthday).toISOString().split("T")[0] // Format as yyyy-MM-dd
            : ""
        }
        register={register}
        error={errors.birthday}
        type="date"
      />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
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
      </div>
      
      {/* Subject Offerings Section */}
      <span className="text-xs text-gray-400 font-medium">
        Subject Offerings Assignment
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Course Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Course</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            value={selectedCourseId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCourseId(value);
              setSelectedSemesterId("");  // Reset semester when course changes
            }}
          >
            <option value="">Select Course</option>
            {courses.map((course: { id: number; name: string }) => (
              <option value={course.id} key={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Semester</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            disabled={!selectedCourseId}
          >
            <option value="">Select Semester</option>
            {filteredSemesters.map((semester: { id: number; number: number }) => (
              <option value={semester.id} key={semester.id}>
                Semester {semester.number}
              </option>
            ))}
          </select>
        </div>
        
        {/* Subject Offerings Multi-Select */}
        <div className="flex flex-col gap-2 col-span-full">
          <label className="text-xs text-gray-500">Available Subject Offerings</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-32 text-black"
            disabled={!selectedSemesterId}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, option => Number(option.value));
              
              // Combine existing selections with new ones (avoid duplicates)
              const currentSelections = selectedSubjectOfferings.map(Number);
              const newSelections = Array.from(new Set([...currentSelections, ...options]));
              
              setValue("subjectOfferings", newSelections);
            }}
          >
            {availableSubjectOfferings.map((so: any) => (
              <option value={so.id} key={so.id}>
                {so.subject?.name || "Unknown Subject"} - Semester {so.semester?.number || "Unknown"}
              </option>
            ))}
          </select>
        </div>
        
        {/* Selected Subject Offerings */}
        <div className="col-span-full">
          <label className="text-xs text-gray-500">Selected Subject Offerings</label>
          <div className="mt-2 p-2 border border-gray-300 rounded-md min-h-16">
            {selectedSubjectOfferings.length > 0 ? (
              <ul className="text-sm text-gray-400">
                {selectedSubjectOfferings.map((id: number) => {
                  const so = subjectOfferings.find((s: any) => s.id === id);
                  return (
                    <li key={id} className="flex justify-between items-center py-1">
                      <span>
                        {so?.subject?.name || "Unknown Subject"} 
                        {so?.semester ? ` - Semester ${so.semester.number}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSelections = selectedSubjectOfferings.filter(
                            (soId: number) => soId !== id
                          );
                          setValue("subjectOfferings", newSelections);
                        }}
                        className="text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No subject offerings selected</p>
            )}
          </div>
          {errors.subjectOfferings?.message && (
            <p className="text-xs text-red-400">
              {errors.subjectOfferings.message.toString()}
            </p>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {state.error && (
        <span className="text-red-500">{state.message || "Something went wrong!"}</span>
      )}
      
      {/* Add hidden input for ID when updating */}
      {type === "update" && (
        <input 
          type="hidden" 
          {...register("id")} 
          defaultValue={data?.id} 
        />
      )}

      {/* Submit button with loading state */}
      <button 
        type="submit" 
        className="bg-[#40e0d0] text-gray-900 p-2 rounded-md disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting 
          ? "Processing..." 
          : type === "create" 
            ? "Create Teacher" 
            : "Update Teacher"
        }
      </button>
    </form>
  );
};

export default TeacherForm;