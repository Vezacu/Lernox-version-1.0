"use client";

import {

  deleteLesson,
  deleteParent,
  deleteStudent,
  deleteSubject,
  deleteSubjectOffering,
  deleteTeacher,
  deleteAttendance,
  deleteCourse,
  deleteAnnouncement,
  deleteAssignment,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState, useCallback } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

const deleteActionMap = {
  subject: deleteSubject,
  subjectOffering: deleteSubjectOffering,
  teacher: deleteTeacher,
  student: deleteStudent,
  parent: deleteParent,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  result: deleteSubject,
  event: deleteSubject,
  announcement: deleteAnnouncement,
  attendance: deleteAttendance,
  course: deleteCourse,
};

// USE LAZY LOADING
const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});

const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});
const SubjectOfferingForm = dynamic(() => import("./forms/SubjectOfferingForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});
const CourseForm = dynamic(() => import("./forms/CourseForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <p className="text-center py-4">Loading form...</p>,
});

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  subjectOffering: (setOpen, type, data, relatedData) => (
    <SubjectOfferingForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  attendance: (setOpen, type, data, relatedData) => (
    <AttendanceForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  course: (setOpen, type, data, relatedData) => (
    <CourseForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  announcement: (setOpen, type, data, relatedData) => {
    // No need for Cloudinary configuration

    return (
      <AnnouncementForm
        type={type}
        data={data}
        setOpen={setOpen}
        relatedData={relatedData}
      />
    );
  },
  assignment: (setOpen, type, data, relatedData) => {
    return (
      <AssignmentForm
        type={type}
        data={data}
        setOpen={setOpen}
        relatedData={relatedData}
      />
    );
  },
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open]);

  // Close modal handler that can be passed to child components
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const Form = () => {
    const [state, formAction] = useFormState(deleteActionMap[table as keyof typeof deleteActionMap], {
      success: false,
      error: false,
    });

    useEffect(() => {
      if (state.success) {
        toast.success(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      } else if (state.error) {
        toast.error(`Failed to delete ${table}. Please try again.`);
      }
    }, [state]);

    return type === "delete" && id ? (
      <form action={formAction} className="p-4 flex flex-col gap-4">
        <input type="text" name="id" value={id} hidden />
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
        </span>
        <div className="flex justify-center gap-3">
          <button 
            type="button"
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none">
            Delete
          </button>
        </div>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](handleClose, type, data, relatedData)
    ) : (
      <div className="p-4 text-center text-red-500">Form not found!</div>
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
        aria-label={`${type} ${table}`}
      >
        <Image src={`/${type}.png`} alt={`${type} icon`} width={16} height={16} />
      </button>
      {open && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-40" 
            onClick={handleClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div 
              className="bg-white p-6 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold capitalize">
                  {/* {type} {table} */}
                </h2>
                <button
                  className="cursor-pointer hover:bg-gray-100 p-1 rounded-full"
                  onClick={handleClose}
                  aria-label="Close form"
                >
                  <Image src="/close.png" alt="Close" width={14} height={14} />
                </button>
              </div>
              <Form />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FormModal;
