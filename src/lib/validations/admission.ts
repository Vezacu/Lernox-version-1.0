import { z } from "zod";

// Enums for status tracking
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