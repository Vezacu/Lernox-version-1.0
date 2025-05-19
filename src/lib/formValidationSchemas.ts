import { UserSex } from "@prisma/client";
import { z } from "zod";

//Rules For Subjects
export const subjectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Subject name is required"),
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

//Rules For Classes
export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});
export type ClassSchema = z.infer<typeof classSchema>;

//Rules For Teachers
export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjectOfferings: z.array(z.number()).optional(),
  subjects: z.array(z.string()).optional(), //subject Ids
  courseId: z.coerce.number().optional().or(z.literal("")),
});
export type TeacherSchema = z.infer<typeof teacherSchema>;

//Rules for students
export const studentSchema = z.object({
  id: z.string().optional(),
  username:z
  .string()
  .min(3, { message: "Username must be at least 3 characters long!" })
  .max(20, { message: "Username must be at most 20 characters long!" }),
  password:  z.string()
  .min(8, { message: "Password must be at least 8 characters long!" })
  .optional()
  .or(z.literal("")),
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().min(1, "Address is required"),
  bloodType: z.string().min(1, "Blood type is required"),
  sex: z.enum(["MALE", "FEMALE"]),
  birthday: z.coerce.date(),
  courseId: z.coerce.number().min(1, "Course is required"),
  currentSemesterId: z.coerce.number().min(1, "Semester is required"),
  parentId: z.string().optional().nullable(),
  img: z.string().optional().nullable(),
});
export type StudentSchema = z.infer<typeof studentSchema>;

//Rules for Exams
export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime:z.coerce.date({message:"Start time is required!"}),
  endTime:z.coerce.date({message:"End time is required!"}),
  lessonId:z.coerce.number({message:"Lesson is required!"}),
});
export type ExamSchema = z.infer<typeof examSchema>;

//Rules for Parents
export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  student: z.string().optional()
  .or(z.literal("")),
  
});

export type ParentSchema = z.infer<typeof parentSchema>;

// export const admissionSchema = z.object({
//   studentName: z.string().min(1, { message: "Student name is required!" }),
//   studentSurname: z.string().min(1, { message: "Student surname is required!" }),
//   email: z.string().email({ message: "Invalid email address!" }).optional(),
//   phone: z.string().min(10, { message: "Phone number is required!" }).optional(),
//   address: z.string().min(1, { message: "Address is required!" }),
//   birthday: z.string().min(1, { message: "Birthday is required!" }), // Will be converted to Date
//   bloodType: z.string().min(1, { message: "Blood type is required!" }),
//   sex: z.nativeEnum(UserSex),
//   courseId: z.number().min(1, { message: "Course ID is required!" }),

//   parentName: z.string().min(1, { message: "Parent name is required!" }),
//   parentPhone: z.string().min(10, { message: "Parent phone number is required!" }),
//   parentEmail: z.string().email({ message: "Invalid parent email!" }).optional(),
//   parentAddress: z.string().min(1, { message: "Parent address is required!" }),

//   paymentId: z.string().optional(), // Payment ID is optional at submission
// });
// export type AdmissionSchema = z.infer<typeof admissionSchema>;

export enum ParentVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED"
}

export enum PaymentVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED"
}

export enum AdmissionStatus {
  PENDING = "PENDING",
  PARENT_VERIFIED = "PARENT_VERIFIED",
  PAYMENT_VERIFIED = "PAYMENT_VERIFIED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

// Schema for admission form validation
export const admissionSchema = z.object({
  id: z.coerce.number().optional(),
  studentName: z.string().min(1, { message: "Student name is required!" }),
  studentSurname: z.string().min(1, { message: "Student surname is required!" }),
  email: z.string().email({ message: "Invalid email format" }).optional().nullable(),
  phone: z.string().min(1, { message: "Phone number is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  birthday: z.string().min(1, { message: "Birthday is required!" }),
  bloodType: z.string().min(1, { message: "Blood type is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  courseId: z.coerce.number({ message: "Course is required!" }),
  parentName: z.string().min(1, { message: "Parent name is required!" }),
  parentPhone: z.string().min(1, { message: "Parent phone is required!" }),
  parentEmail: z.string().email({ message: "Parent email is required for verification!" }),
  parentAddress: z.string().min(1, { message: "Parent address is required!" }),
  status: z.enum(["PENDING", "PARENT_VERIFIED", "PAYMENT_VERIFIED", "COMPLETED", "REJECTED"]).optional(),
  parentVerificationStatus: z.enum(["PENDING", "VERIFIED"]).optional(),
});

export type AdmissionSchema = z.infer<typeof admissionSchema>;

// Add to existing schemas
export const subjectOfferingSchema = z.object({
  id: z.number().optional(),
  subjectId: z.coerce.number({
    required_error: "Subject is required",
    invalid_type_error: "Subject must be a number",
  }),
  semesterId: z.coerce.number({
    required_error: "Semester is required",
    invalid_type_error: "Semester must be a number",
  }),
  teacherId: z.string({
    required_error: "Teacher is required",
  }),
});

export type SubjectOfferingSchema = z.infer<typeof subjectOfferingSchema>;

export const attendanceSchema = z.object({
  id: z.number().optional(),
  date: z.coerce.date(),
  present: z.enum(["true", "false"]),
  studentId: z.string().min(1, "Student is required"),
  lessonId: z.coerce.number().min(1, "Lesson is required")
});

export const lessonSchema = z.object({
  id: z.number().optional(),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], {
    required_error: "Day is required"
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  subjectOfferingId: z.coerce.number({
    required_error: "Subject offering is required",
    invalid_type_error: "Invalid subject offering"
  }),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  isMakeupClass: z.boolean().optional(),
  reason: z.string().optional()
});

export const lessonScheduleSchema = z.object({
  courseId: z.coerce.number({
    required_error: "Course selection is required",
    invalid_type_error: "Invalid course"
  }),
  semesterId: z.coerce.number({
    required_error: "Semester selection is required",
    invalid_type_error: "Invalid semester"
  }),
  schedule: z.array(
    z.object({
      day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
      periods: z.array(
        z.object({
          periodNumber: z.coerce.number().min(1, "Period number required"),
          subjectOfferingId: z.coerce.number({
            required_error: "Subject required",
            invalid_type_error: "Invalid subject"
          }),
          startTime: z.string().min(1, "Start time is required"),
          endTime: z.string().min(1, "End time is required")
        })
      ).min(1, "At least one period is required")
    })
  ).min(1, "At least one day schedule is required")
});

export type LessonSchema = z.infer<typeof lessonSchema>;
export type LessonScheduleSchema = z.infer<typeof lessonScheduleSchema>;


// Enrollment form validation schema
export const enrollmentSchema = z.object({
  id: z.number().optional(),
  studentId: z.string({
    required_error: "Student is required",
  }),
  subjectOfferingId: z.coerce.number({
    required_error: "Subject offering is required",
  })
});

export type EnrollmentSchema = z.infer<typeof enrollmentSchema>;

// Batch enrollment validation schema
export const batchEnrollmentSchema = z.object({
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  subjectOfferingIds: z.array(z.coerce.number()).min(1, "At least one subject offering must be selected"),
  semesterId: z.coerce.number({
    required_error: "Semester is required",
  }),
  courseId: z.coerce.number({
    required_error: "Course is required",
  })
});

export type BatchEnrollmentSchema = z.infer<typeof batchEnrollmentSchema>;

//src>lib>formValidationSchemas.ts

export const courseSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Course name is required"),
  code: z.string().optional(), // This will be auto-generated, so it's optional in the form
  duration: z.number().min(1, "Duration is required"),
  semesters: z.number().min(1, "Number of semesters is required")
});

export type CourseSchema = z.infer<typeof courseSchema>;
export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
   
   title: z.string().min(1, { message: "Title is required!" }),
 
   description: z.string().min(1, { message: "Description is required!" }),
 
   startDate: z.coerce.date({ message: "Start Date is required!" }),
 
   endDate: z.coerce.date({ message: "End Date is required!" }),
 
   img: z.string().optional(),
 });
 export type AnnouncementSchema = z.infer<typeof announcementSchema>;

 export const AssignmentSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  courseId: z.number().nullable().optional(),
  semesterId: z.number().nullable().optional(),
  attachment: z.string().optional(),
});

export type AssignmentFormValues = z.infer<typeof AssignmentSchema>;
