"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SubjectSchema, subjectSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createSubject, updateSubject } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const SubjectForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: type === "update" ? {
      id: data?.id,
      name: data?.name,
    } : undefined
  });

  const [state, formAction] = useFormState(
    type === "create" ? createSubject : updateSubject,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    setIsSubmitting(true);
    const formDataObj = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formDataObj.append(key, value.toString());
      }
    });

    if (type === "update") {
      formDataObj.append("id", data.id.toString());
    }

    formAction(formDataObj);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(`Subject ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      setIsSubmitting(false);
      toast.error(state.message || "Something went wrong");
    }
  }, [state, setOpen, router, type]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Subject" : "Update Subject"}
      </h1>

      <InputField
        label="Subject Name"
        name="name"
        register={register}
        error={errors.name}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className={`bg-blue-400 text-white p-2 rounded-md disabled:opacity-50" 
          ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isSubmitting 
          ? "Processing..." 
          : type === "create" 
            ? "Create Subject" 
            : "Update Subject"
        }
      </button>
    </form>
  );
};

export default SubjectForm;
