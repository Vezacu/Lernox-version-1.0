"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {announcementSchema,AnnouncementSchema,} from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";



const AnnouncementForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;

}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(data?.image || "");
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    { 
      success: false,
       error: false
    }
  );
 
  const uploadImage = async () => {
    if (!selectedFile) return imageUrl; // If no new file, use existing URL

    const formData = new FormData();
    formData.append("image", selectedFile);

    const IMAGEBB_API_KEY = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        return data.data.url; // Return the uploaded image URL
      } else {
        throw new Error("Image upload failed");
      }
    } catch (error) {
      console.error(error);
      return ""; // Return empty string if upload fails
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = handleSubmit(async (formData) => {
     
    const uploadedImageUrl = await uploadImage(); // Upload image before form submission
    const payload = { ...formData, img: uploadedImageUrl }; // Include image URL in payload
    if (type === "update") {
      if (!data?.id) {
        console.error("Error: ID is missing for update!");
        toast.error("Error: Announcement ID is missing!");
        return;
      }
      formAction({ id: data.id, ...formData });
    } else {
      formAction(formData); // Create case doesn't need an ID
    }
  });

//     formAction({ id: data.id, ...formData });
//   } else {
//     formAction(formData); // Create case doesn't need an ID
//   }
// });
console.log("Received Data in ParentForm:", data);
useEffect(() => {
  console.log("Announcement Data:", data); // Check what data is coming in
  if (type === "update" && !data?.id) {
    console.warn("Warning: Announcement ID is missing!");
  }
}, [data, type]);
  const router = useRouter();
  useEffect(() => {
    if (state.success) {
      toast(
        `Announcement has been ${type === "create" ? "created" : "updated"}!`
      );
      setOpen(false);
      router.refresh();
    }
  }, [state,router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create"
          ? "Create a new announcement"
          : "Update the announcement"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex flex-col gap-6">
        <InputField
          label="Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="relative">
            <textarea
              {...register("description")}
              defaultValue={data?.description}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Enter detailed announcement description..."
              style={{ minHeight: '200px' }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {data?.description?.length || 0} characters
            </div>
          </div>
          {errors?.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>
        <InputField
          label="Start Date"
          name="startDate"
          defaultValue={data?.startDate}
          register={register}
          error={errors?.startDate}
          type="datetime-local"
        />
        <InputField
          label="End Date"
          name="endDate"
          defaultValue={data?.endDate}
          register={register}
          error={errors?.endDate}
          type="datetime-local"
        />
        {/* <div className="flex flex-col gap-4">
          <label className="text-gray-700 font-medium">Upload Image</label>
          <ImageUpload
            defaultImage={data?.img}
            onFileSelect={setSelectedFile}
          />
        </div> */}
      </div>
      {/* Image Upload */}

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {loading ? "Submitting..." : type === "create" ? "Create" : "Update"}
        </button>
      </div>
    </form>
  );
};

export default AnnouncementForm;
