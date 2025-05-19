"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  ParentSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  AdmissionSchema,
  SubjectOfferingSchema, 
  enrollmentSchema,
  CourseSchema,
  AnnouncementSchema
} from "./formValidationSchemas";
import { z } from 'zod';
import prisma from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { PaymentStatus, Prisma, LessonStatus } from "@prisma/client";
import { error } from "console";

type CurrentState = { success: boolean; error: boolean; message?: string;};

export const createSubject = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const data = {
      name: formData.get("name") as string,
    };

    await prisma.subject.create({ data });
    return { success: true, error: false };
  } catch (err) {
    console.error("Create subject error:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to create subject" 
    };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    const id = parseInt(formData.get("id") as string);
    const data = {
      name: formData.get("name") as string,
    };

    await prisma.subject.update({
      where: { id },
      data,
    });

   
    return { success: true, error: false };
  } catch (err) {
    console.error("Update subject error:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to update subject" 
    };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher" },
    });

    const teacher = await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        // Connect to existing subject offerings if provided
        subjectOfferings: data.subjectOfferings?.length
          ? {
              connect: data.subjectOfferings.map((offeringId: number) => ({
                id: offeringId,
              })),
            }
          : undefined,
      },
    });

   
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    console.log("Updating teacher with data:", data);

    if (!data.id) {
      throw new Error("Teacher ID is required for update");
    }

    // Update Clerk user if email or password changed
    const client = await clerkClient();
    await client.users.updateUser(data.id, {
      username: data.username,
      firstName: data.name,
      lastName: data.surname,
      ...(data.password && { password: data.password })
    });

    // Update database record
    const teacher = await prisma.teacher.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjectOfferings: {
          set: data.subjectOfferings?.map(id => ({ id })) || []
        }
      },
    });

    console.log("Teacher updated successfully:", teacher);
    
    return { success: true, error: false };
  } catch (err) {
    console.error("Update teacher error:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to update teacher"
    };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // First delete related subject offerings
    await prisma.subjectOffering.deleteMany({
      where: { teacherId: id }
    });

    // Then delete the teacher
    await prisma.teacher.delete({
      where: { id }
    });

    // Finally delete Clerk user
    const client = await clerkClient();
    await client.users.deleteUser(id);

   
    return { success: true, error: false };
  } catch (err) {
    console.error("Delete teacher error:", err);
    return { 
      success: false, 
      error: true,
      message: "Cannot delete teacher with existing subject offerings. Delete related offerings first."
    };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => { 
  try {console.log("Creating student with data:", data); // Debug log
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "student" },
    });
    console.log("Clerk user created:", user); // Debug log
    const student = await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        courseId: data.courseId,
        currentSemesterId: data.currentSemesterId,
        parentId: data.parentId,
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "Student ID is required" };
  }
  
  try {
    console.log("Updating student with data:", data); // Debug log
    
    // Update user in Clerk
    const client = await clerkClient();
    const user = await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password && data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });
    
    console.log("Clerk user updated:", user.id); // Debug log
    
    // Update student in the database
    const student = await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        courseId: Number(data.courseId),
        currentSemesterId: Number(data.currentSemesterId),
        parentId: data.parentId,
      },
    });
    
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    const user = await client.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
//EXAM...

// export const createExam = async (
//   currentState: CurrentState,
//   data: ExamSchema
// ) => {
//   const { userId, sessionClaims } = await auth();
//   const role = (sessionClaims?.metadata as { role?: string })?.role;
//   try {
//     if (role === "teacher") {
//       const teacherLesson = await prisma.lesson.findFirst({
//         where: {
//           teacherId: userId!,
//           id: data.lessonId,
//         },
//       });

//       if (!teacherLesson) {
//         return { success: false, error: true };
//       }
//     }
//     await prisma.exam.create({
//       data: {
//         title: data.title,
//         startTime: data.startTime,
//         endTime: data.endTime,
//         lessonId: data.lessonId,
//       },
//     });

//     // revalidatePath("/list/class");
//     return { success: true, error: false };
//   } catch (err) {
//     console.log(err);
//     return { success: false, error: true };
//   }
// };

// export const updateExam = async (
//   currentState: CurrentState,
//   data: ExamSchema
// ) => {
//   const { userId, sessionClaims } = await auth();
//   const role = (sessionClaims?.metadata as { role?: string })?.role;
//   try {
//     if (role === "teacher") {
//       const teacherLesson = await prisma.lesson.findFirst({
//         where: {
//           teacherId: userId!,
//           id: data.lessonId,
//         },
//       });

//       if (!teacherLesson) {
//         return { success: false, error: true };
//       }
//     }

//     await prisma.exam.update({
//       where: {
//         id: data.id,
//       },
//       data: {
//         title: data.title,
//         startTime: data.startTime,
//         endTime: data.endTime,
//         lessonId: data.lessonId,
//       },
//     });

//     // revalidatePath("/list/class");
//     return { success: true, error: false };
//   } catch (err) {
//     console.log(err);
//     return { success: false, error: true };
//   }
// };

// export const deleteExam = async (
//   currentState: CurrentState,
//   data: FormData
// ) => {
//   const id = data.get("id") as string;

//   // const { userId, sessionClaims } = await auth();
//   // const role = (sessionClaims?.metadat as { role?: string })?.role;

//   try {
//     await prisma.exam.delete({
//       where: {
//         id: parseInt(id),
//         // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
//       },
//     });

//     // revalidatePath("/list/class");
//     return { success: true, error: false };
//   } catch (err) {
//     console.log(err);
//     return { success: false, error: true };
//   }
// };

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    const clerk = await clerkClient();
    const users = await clerk.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
    });

    await prisma.parent.create({
      data: {
        id: users.id,
        username: data.username,
        email: data.email || "",
        name: data.name || "",
        surname: data.surname || "",
        phone: data?.phone || "",
        address: data?.address || "",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating parent:", err);
    return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const clerk = await clerkClient();
    const users = await clerk.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.parent.update({
      where: { id: String(data.id) },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        email: data.email || "",
        name: data.name || "",
        surname: data.surname || "",
        phone: data?.phone || "",
        address: data?.address || "",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log("Error updating parent:", err);
    return { success: false, error: true };
  }
};
export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(id);
    await prisma.parent.delete({
      where: {
        id: id,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log("Error deleting parent:", err);
    return { success: false, error: true };
  }
};

export const createResult = async (results: {
  studentId: string;
  subjectId: number;
  internal: number;
  external: number;
  attendance: number;
  total: number;
}[]) => {
  try {
    // First validate the student exists
    const student = await prisma.student.findUnique({
      where: { 
        id: results[0].studentId 
      },
      select: { id: true }
    });

    if (!student) {
      console.error(`Student not found with ID: ${results[0].studentId}`);
      throw new Error(`Student not found`);
    }

    // Then validate all subjects exist - using Array.from instead of spread operator
    const subjectIds = Array.from(new Set(results.map(r => r.subjectId)));
    const subjects = await prisma.subject.findMany({
      where: {
        id: {
          in: subjectIds
        }
      },
      select: { id: true }
    });

    if (subjects.length !== subjectIds.length) {
      console.error('Some subjects not found:', subjectIds);
      throw new Error('One or more subjects not found');
    }

    // Create or update results
    const createdResults = await Promise.all(
      results.map(async (result) => {
        // Check if result already exists
        const existingResult = await prisma.result.findUnique({
          where: {
            studentId_subjectId: {
              studentId: result.studentId,
              subjectId: result.subjectId
            }
          }
        });

        if (existingResult) {
          // Update existing result
          return prisma.result.update({
            where: { id: existingResult.id },
            data: {
              internal: result.internal,
              external: result.external,
              attendance: result.attendance,
              total: result.total,
            },
          });
        } else {
          // Create new result
          return prisma.result.create({
            data: result
          });
        }
      })
    );

    return {
      success: true,
      results: createdResults
    };
  } catch (error: any) {
    console.error('Error creating results:', error);
    return {
      success: false,
      error: error.message || 'Failed to create results'
    };
  }
};

// Update an existing result
export const updateResult = async (id: number, data: ResultSchema) => {
  try {
    console.log("Updating result with data:", data);
    const result = await prisma.result.update({
      where: { id: id.toString() }, // Ensure id is a string if your schema expects it
      data: {
        studentId: data.studentId,
        subjectId: data.subjects[0].subjectId, // Assuming you want to update the first subject
        marks: data.subjects[0].marks,
      },
    });
    return { success: true, result };
  } catch (error) {
    console.error("Error updating result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Delete a result
export const deleteResult = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  try {
    const id = formData.get("id") as string;

    if (!id) {
      return { success: false, error: true };
    }

    await prisma.result.delete({
      where: {
        id: id, // Use the ID as a string directly
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("Error deleting result:", error);
    return { success: false, error: true };
  }
};

export const createAdmission = async (
  prevState: any,
  data: any
) => {
  try {
    // Check if the course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(data.courseId) },
    });

    if (!course) {
      return { success: false, error: true, message: "Course not found" };
    }

    // Create the admission record in the database
    const newAdmission = await prisma.admissionForm.create({
      data: {
        studentName: data.studentName,
        studentSurname: data.studentSurname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        birthday: new Date(data.birthday),
        bloodType: data.bloodType,
        sex: data.sex,
        courseId: parseInt(data.courseId),
        img: data.img || null,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail || null,
        parentAddress: data.parentAddress,
        status: "PENDING", // Default status
      },
    });

    // Revalidate the admission path to show updated data
    revalidatePath("/admission");

    return { success: true, error: false, data: newAdmission };
  } catch (error) {
    console.error("Error creating admission form:", error);
    return { success: false, error: true, message: "Failed to create admission form" };
  }
};


// Add to existing actions

export const createSubjectOffering = async (
  currentState: CurrentState,
  data: SubjectOfferingSchema
) => {
  try {
    console.log("Creating subject offering with data:", data); // Debug log
    
    // Validate inputs
    if (!data.subjectId || !data.semesterId || !data.teacherId) {
      console.error("Missing required fields:", { data });
      return { 
        success: false, 
        error: true, 
        message: "All fields are required" 
      };
    }
    
    // Create subject offering
    const newSubjectOffering = await prisma.subjectOffering.create({
      data: {
        subjectId: data.subjectId,
        semesterId: data.semesterId,
        teacherId: data.teacherId,
      },
      include: {
        subject: true,
        semester: {
          include: {
            course: true,
          },
        },
        teacher: true,
      },
    });
    
    console.log("Subject offering created:", newSubjectOffering.id); // Debug log
    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating subject offering:", err);
    return { success: false, error: true, message: "Failed to create subject offering" };
  }
};

export const updateSubjectOffering = async (
  currentState: CurrentState,
  data: SubjectOfferingSchema
) => {
  try {
    console.log("Updating subject offering with data:", data); // Debug log
    
    // Validate inputs
    if (!data.id || !data.subjectId || !data.semesterId || !data.teacherId) {
      console.error("Missing required fields:", { data });
      return { 
        success: false, 
        error: true, 
        message: "All fields are required" 
      };
    }
    
    // Update subject offering
    const updatedSubjectOffering = await prisma.subjectOffering.update({
      where: { id: data.id },
      data: {
        subjectId: data.subjectId,
        semesterId: data.semesterId,
        teacherId: data.teacherId,
      },
      include: {
        subject: true,
        semester: {
          include: {
            course: true,
          },
        },
        teacher: true,
      },
    });
    
    console.log("Subject offering updated:", updatedSubjectOffering.id); // Debug log
    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating subject offering:", err);
    return { success: false, error: true, message: "Failed to update subject offering" };
  }
};

export const deleteSubjectOffering = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    console.log("Deleting subject offering with id:", id); // Debug log
    
    // Validate input
    if (!id) {
      console.error("Missing ID for delete operation");
      return { 
        success: false, 
        error: true, 
        message: "Subject offering ID is required" 
      };
    }
    
    // Delete subject offering
    const deletedSubjectOffering = await prisma.subjectOffering.delete({
      where: { id: parseInt(id) },
    });
    
    console.log("Subject offering deleted:", id); // Debug log
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting subject offering:", err);
    return { success: false, error: true, message: "Failed to delete subject offering" };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    console.log("Creating lesson with data:", data);
    
    // Validate the required fields
    if (!data.day || !data.subjectOfferingId || !data.startTime || !data.endTime) {
      return {
        success: false,
        error: true,
        message: "Missing required fields for lesson creation"
      };
    }
    
    const lessonData = {
      day: data.day,
      startTime: new Date(`1970-01-01T${data.startTime}:00`),
      endTime: new Date(`1970-01-01T${data.endTime}:00`),
      subjectOfferingId: parseInt(data.subjectOfferingId),
      status: data.status as LessonStatus || LessonStatus.SCHEDULED
    };
    
    // First, check if there's already a lesson with the same subjectOfferingId, day, and overlapping time
    const existingLessons = await prisma.lesson.findMany({
      where: {
        subjectOfferingId: lessonData.subjectOfferingId,
        day: lessonData.day,
        OR: [
          {
            // Starts during an existing lesson
            startTime: {
              gte: lessonData.startTime,
              lt: lessonData.endTime
            }
          },
          {
            // Ends during an existing lesson
            endTime: {
              gt: lessonData.startTime,
              lte: lessonData.endTime
            }
          },
          {
            // Completely overlaps an existing lesson
            startTime: {
              lte: lessonData.startTime
            },
            endTime: {
              gte: lessonData.endTime
            }
          }
        ]
      }
    });

    if (existingLessons.length > 0) {
      return {
        success: false,
        error: true,
        message: "There is already a lesson scheduled during this time slot."
      };
    }

    // Also check if the teacher is already assigned to another class at the same time
    const subjectOffering = await prisma.subjectOffering.findUnique({
      where: { id: lessonData.subjectOfferingId },
      select: { teacherId: true }
    });
    
    if (!subjectOffering) {
      return {
        success: false,
        error: true,
        message: "Subject offering not found."
      };
    }

    const teacherScheduleConflict = await prisma.lesson.findFirst({
      where: {
        day: lessonData.day,
        OR: [
          {
            startTime: {
              gte: lessonData.startTime,
              lt: lessonData.endTime
            }
          },
          {
            endTime: {
              gt: lessonData.startTime,
              lte: lessonData.endTime
            }
          },
          {
            startTime: {
              lte: lessonData.startTime
            },
            endTime: {
              gte: lessonData.endTime
            }
          }
        ],
        subjectOffering: {
          teacherId: subjectOffering.teacherId
        }
      }
    });

    if (teacherScheduleConflict) {
      return {
        success: false,
        error: true,
        message: "The teacher is already assigned to another lesson during this time slot."
      };
    }
    
    // Create the lesson if there are no conflicts
    const lesson = await prisma.lesson.create({
      data: lessonData,
      include: {
        subjectOffering: {
          include: {
            subject: true,
            teacher: true,
            semester: true
          }
        }
      }
    });
    
    console.log("Created lesson:", lesson);
    
    // Revalidate the lessons page to show the new data
    //revalidatePath("/list/lessons");
    
    return { success: true, error: false };
  } catch (err) {
    console.error("Create lesson error:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to create lesson" 
    };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    console.log("Updating lesson with data:", data);
    
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "Lesson ID is required for update"
      };
    }

    // Check if all required fields are present
    if (!data.day || !data.subjectOfferingId || !data.startTime || !data.endTime || !data.status) {
      return {
        success: false,
        error: true,
        message: "Missing required fields for lesson update"
      };
    }

    // Update lesson with the new data
    const updatedLesson = await prisma.lesson.update({
      where: {
        id: parseInt(data.id)
      },
      data: {
        day: data.day,
        startTime: new Date(`1970-01-01T${data.startTime}:00`),
        endTime: new Date(`1970-01-01T${data.endTime}:00`),
        subjectOfferingId: parseInt(data.subjectOfferingId),
        status: data.status as LessonStatus
      },
      include: {
        subjectOffering: {
          include: {
            subject: true,
            teacher: true
          }
        }
      }
    });

    console.log("Updated lesson:", updatedLesson);
    
    // Revalidate the lessons page to show the updated data
    //revalidatePath("/list/lessons");
    
    return { success: true, error: false };
  } catch (err) {
    console.error("Update lesson error:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to update lesson" 
    };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;
    console.log("Deleting lesson with ID:", id);

    if (!id) {
      return {
        success: false,
        error: true,
        message: "Lesson ID is required"
      };
    }

    await prisma.lesson.delete({
      where: {
        id: parseInt(id)
      }
    });

    // Revalidate the lessons page to show the updated data
    //revalidatePath("/list/lessons");
    
    return { success: true, error: false };
  } catch (err) {
    console.error("Delete lesson error:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to delete lesson" 
    };
  }
};

// Add to your existing actions.ts file


// Add to your existing actions.ts file

export const createAttendance = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    console.log("Creating attendance with data:", formData);

    // Extract lessonId - it's coming as an array in the FormData
    const lessonIdValues = formData.getAll("lessonId");
    const lessonId = Number(lessonIdValues[0]); // Take the first value
    
    if (isNaN(lessonId) || lessonId <= 0) {
      return { 
        success: false, 
        error: true, 
        message: "Invalid lesson ID provided" 
      };
    }

    // Extract date - it also comes as an array
    const dateValues = formData.getAll("date");
    const dateStr = dateValues[0] as string;
    const formattedDate = new Date(dateStr);
    
    if (isNaN(formattedDate.getTime())) {
      return { 
        success: false, 
        error: true, 
        message: "Invalid date provided" 
      };
    }

    // Check if attendance records already exist for this lesson and date
    const existingRecords = await prisma.attendance.findMany({
      where: {
        lessonId: lessonId,
        date: formattedDate
      }
    });

    // If records exist, delete them first to avoid duplicates
    if (existingRecords.length > 0) {
      console.log(`Found ${existingRecords.length} existing attendance records for lesson ${lessonId} on ${dateStr}. Deleting them first.`);
      
      await prisma.attendance.deleteMany({
        where: {
          lessonId: lessonId,
          date: formattedDate
        }
      });
    }

    // Update the lesson status to COMPLETED
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { status: LessonStatus.COMPLETED }
    });

    // Get all student IDs from the formData
    const studentIds = formData.getAll("studentIds");
    
    // Create attendance records for each student
    const attendancePromises = studentIds.map(studentId => {
      // Check if the checkbox for this student was checked (present)
      const studentCheckboxKey = `students[${studentId}]`;
      const isPresent = formData.get(studentCheckboxKey) === "on";
      
      // Alternative way to check presence if the above doesn't work
      const attendanceValueKey = `attendance[${studentId}]`;
      const attendanceValue = formData.get(attendanceValueKey);
      const isPresentAlt = attendanceValue === "true";
      
      // Use either method to determine presence
      const present = isPresent || isPresentAlt;
      
      return prisma.attendance.create({
        data: {
          date: formattedDate,
          present: present,
          studentId: studentId as string,
          lessonId: lessonId
        }
      });
    });

    // Execute all create operations
    const attendances = await Promise.all(attendancePromises);
    console.log(`Created ${attendances.length} attendance records`);
    
    return { 
      success: true, 
      error: false,
      message: existingRecords.length > 0 
        ? "Attendance records updated successfully" 
        : "Attendance records created successfully"
    };
  } catch (err) {
    console.error('Error creating attendance:', err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to create attendance" 
    };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  formData: FormData
) => {
  try {
    console.log("Updating attendance with formData:", Object.fromEntries(formData));
    
    const lessonId = formData.get("lessonId");
    if (!lessonId) {
      return { 
        success: false, 
        error: true, 
        message: "Lesson ID is required" 
      };
    }
    
    // Format the date correctly
    const dateStr = formData.get("date") as string;
    if (!dateStr) {
      return { 
        success: false, 
        error: true, 
        message: "Date is required" 
      };
    }
    
    const formattedDate = new Date(dateStr);
    const numericLessonId = Number(lessonId);

    // First, delete existing attendance records for this lesson and date
    // Check if we have specific attendance IDs for deletion
    const attendanceIds = formData.getAll("ids");
    
    if (attendanceIds.length > 0) {
      console.log(`Deleting ${attendanceIds.length} specific attendance records by ID`);
      // Delete specific attendance records by ID
      for (const id of attendanceIds) {
        await prisma.attendance.delete({
          where: { id: parseInt(id.toString()) }
        });
      }
    } else {
      // Otherwise, delete all attendance records for this lesson on this date
      console.log(`Deleting attendance records for lesson ${numericLessonId} on ${dateStr}`);
      await prisma.attendance.deleteMany({
        where: { 
          lessonId: numericLessonId,
          date: formattedDate
        }
      });
    }

    // Extract student IDs from the form data
    const studentIds = formData.getAll("studentIds");
    console.log(`Creating ${studentIds.length} updated attendance records`);
    
    // Create new attendance records for each student
    const attendancePromises = studentIds.map(studentId => {
      // Get the attendance value for this student
      const attendanceValueKey = `attendance[${studentId}]`;
      const attendanceValue = formData.get(attendanceValueKey);
      const isPresent = attendanceValue === "true";
      
      // Alternative way to check if checkbox was checked
      const studentCheckboxKey = `students[${studentId}]`;
      const checkboxValue = formData.get(studentCheckboxKey);
      const isPresentByCheckbox = checkboxValue === "on";
      
      // Use either method to determine presence
      const present = isPresent || isPresentByCheckbox;
      
      return prisma.attendance.create({
        data: {
          date: formattedDate,
          present: present,
          studentId: studentId as string,
          lessonId: numericLessonId
        }
      });
    });

    // Execute all create operations at once
    await Promise.all(attendancePromises);
    
    revalidatePath('/list/attendances');
    return { 
      success: true, 
      error: false,
      message: "Attendance records updated successfully" 
    };
  } catch (err) {
    console.error('Error updating attendance:', err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to update attendance" 
    };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const lessonId = data.get("lessonId") as string;
    const date = data.get("date") as string;
    
    if (!lessonId || !date) {
      return { success: false, error: true, message: "Lesson ID and date are required" };
    }

    const formattedDate = new Date(date);

    // Delete all attendance records for this lesson on this date
    const result = await prisma.attendance.deleteMany({
      where: { 
        lessonId: Number(lessonId),
        date: formattedDate
      }
    });

    // revalidatePath('/list/attendances');
    return { success: true, error: false };
  } catch (err) {
    console.error('Error deleting attendance:', err);
    return { success: false, error: true, message: err instanceof Error ? err.message : "Failed to delete attendance" };
  }
};

// Function to reset lesson statuses at midnight (can be called by a scheduled job)
export const resetLessonStatuses = async () => {
  try {
    // Get yesterday's date (to reset lessons from yesterday)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates to get just the date portion for comparison
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
    
    // Find completed lessons from yesterday and reset them to SCHEDULED
    const updatedLessons = await prisma.lesson.updateMany({
      where: {
        status: LessonStatus.COMPLETED,
        attendances: {
          some: {
            date: {
              gte: yesterdayStart,
              lte: yesterdayEnd
            }
          }
        }
      },
      data: {
        status: LessonStatus.SCHEDULED
      }
    });

    console.log(`Reset ${updatedLessons.count} lessons from COMPLETED to SCHEDULED`);
    return { success: true, error: false, count: updatedLessons.count };
  } catch (err) {
    console.error('Error resetting lesson statuses:', err);
    return { success: false, error: true, message: err instanceof Error ? err.message : "Failed to reset lesson statuses" };
  }
};

export const fetchAttendanceByLessonAndDate = async (
  lessonId: number,
  date: string
) => {
  try {
    console.log(`Fetching attendance data for lesson ${lessonId} on date ${date}`);
    
    // Validate inputs
    if (!lessonId || isNaN(lessonId)) {
      return {
        success: false,
        error: true,
        message: "Invalid lesson ID provided",
        data: []
      };
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return {
        success: false,
        error: true,
        message: "Invalid date provided",
        data: []
      };
    }
    
    // Query the database for attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        lessonId: lessonId,
        date: dateObj
      },
      orderBy: {
        studentId: 'asc'
      }
    });
    
    console.log(`Found ${attendanceRecords.length} attendance records`);
    
    return {
      success: true,
      error: false,
      message: `Found ${attendanceRecords.length} attendance records`,
      data: attendanceRecords
    };
  } catch (err) {
    console.error('Error fetching attendance data:', err);
    return {
      success: false,
      error: true,
      message: err instanceof Error ? err.message : "Failed to fetch attendance data",
      data: []
    };
  }
};



export async function enrollStudent(data: FormData | { studentId: string; subjectOfferingId: number }) {
  try {
    // Parse and validate the form data
    const formData = data instanceof FormData
      ? {
          studentId: data.get("studentId") as string,
          subjectOfferingId: parseInt(data.get("subjectOfferingId") as string),
        }
      : data;
    
    const validatedData = enrollmentSchema.parse(formData);
    
    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: validatedData.studentId,
        subjectOfferingId: validatedData.subjectOfferingId,
      },
    });
    
    if (existingEnrollment) {
      throw new Error("This student is already enrolled in this subject");
    }
    
    // Create the enrollment
    await prisma.enrollment.create({
      data: {
        studentId: validatedData.studentId,
        subjectOfferingId: validatedData.subjectOfferingId,
      },
    });
    
    revalidatePath("/list/enrollments");
    return { success: true };
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create enrollment" 
    };
  }
}

// Define a robust validation schema with proper type handling
const batchEnrollmentSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "At least one student must be selected"),
  subjectOfferingIds: z.array(z.number().int().positive()).min(1, "At least one subject offering must be selected"),
});

/**
 * Batch enroll multiple students in multiple subject offerings
 */
export async function batchEnroll(data: {
  studentIds: string[];
  subjectOfferingIds: number[] | string[];
}) {
  try {
    // Convert string IDs to numbers if necessary and filter out invalid values
    const sanitizedData = {
      studentIds: data.studentIds.filter(id => id && id.trim() !== ''),
      subjectOfferingIds: Array.isArray(data.subjectOfferingIds) 
        ? data.subjectOfferingIds.map(id => {
            // Handle both string and number inputs
            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
            return isNaN(numId) ? null : numId;
          }).filter(id => id !== null) as number[]
        : []
    };

    // Validate the sanitized data
    const validatedData = batchEnrollmentSchema.parse(sanitizedData);
    
    // Get existing enrollments to avoid duplicates
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: validatedData.studentIds },
        subjectOfferingId: { in: validatedData.subjectOfferingIds },
      },
      select: {
        studentId: true,
        subjectOfferingId: true,
      },
    });
    
    // Create a Set of existing enrollment keys for quick lookup
    const existingSet = new Set(
      existingEnrollments.map(e => `${e.studentId}_${e.subjectOfferingId}`)
    );
    
    // Prepare data for batch creation
    const enrollmentsToCreate = [];
    const now = new Date();
    
    for (const studentId of validatedData.studentIds) {
      for (const subjectOfferingId of validatedData.subjectOfferingIds) {
        const key = `${studentId}_${subjectOfferingId}`;
        if (!existingSet.has(key)) {
          enrollmentsToCreate.push({
            studentId,
            subjectOfferingId,
            enrollmentDate: now,
            status: "ACTIVE",
          });
        }
      }
    }
    
    // If nothing to create, return early
    if (enrollmentsToCreate.length === 0) {
      return {
        success: true,
        message: "No new enrollments created. All enrollments already exist.",
        created: 0,
        skipped: existingEnrollments.length
      };
    }
    
    // Create new enrollments in a batch transaction
    const result = await prisma.enrollment.createMany({
      data: enrollmentsToCreate,
      skipDuplicates: true,
    });
    
    revalidatePath("/list/enrollments");
    return { 
      success: true, 
      message: `Created ${result.count} new enrollments`,
      created: result.count,
      skipped: (validatedData.studentIds.length * validatedData.subjectOfferingIds.length) - result.count
    };
  } catch (error) {
    console.error("Error batch enrolling students:", error);
    
    // Enhanced error handling
    if (error instanceof z.ZodError) {
      // Format Zod validation errors in a more readable way
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      }).join('; ');
      
      return {
        success: false,
        error: `Validation error: ${errorMessages}`
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to batch enroll students" 
    };
  }
}

/**
 * Removes an enrollment
 */
export async function removeEnrollment(id: number) {
  try {
    await prisma.enrollment.delete({
      where: { id },
    });
    
    revalidatePath("/list/enrollments");
    return { success: true };
  } catch (error) {
    console.error("Error removing enrollment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to remove enrollment" 
    };
  }
}

/**
 * Bulk remove multiple enrollments by their IDs
 */
export const bulkRemoveEnrollments = async (
  currentState: { success: boolean; error: boolean; message?: string },
  data: FormData
) => {
  try {
    // Get the enrollment IDs from form data
    const enrollmentIds = JSON.parse(data.get("enrollmentIds") as string) as number[];
    
    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return { 
        success: false, 
        error: true, 
        message: "No enrollment IDs provided" 
      };
    }

    // Use Prisma's deleteMany to efficiently delete multiple records
    const result = await prisma.enrollment.deleteMany({
      where: {
        id: {
          in: enrollmentIds
        }
      }
    });

    revalidatePath("/list/enrollments");
    
    return { 
      success: true, 
      error: false, 
      message: `Successfully removed ${result.count} enrollment(s)`,
      count: result.count 
    };
  } catch (err) {
    console.error("Bulk remove enrollments error:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to remove enrollments" 
    };
  }
};

/**
 * Promotes students to the next semester based on their results
 * This would be used at the end of a semester
 */
export async function promoteStudents(courseId: number, currentSemesterId: number, nextSemesterId: number) {
  try {
    // Get subject offerings for the current semester to get their IDs
    const currentSemesterOfferings = await prisma.subjectOffering.findMany({
      where: { semesterId: currentSemesterId },
      select: { id: true },
    });
    
    const currentOfferingIds = currentSemesterOfferings.map(so => so.id);
    
    // Get all students in this course and semester
    const students = await prisma.student.findMany({
      where: {
        courseId,
        currentSemesterId,
      },
      include: {
        results: {
          where: {
            // Use subjectOfferingId directly with "in" operator instead of trying to traverse a relation
            subjectOfferingId: {
              in: currentOfferingIds
            }
          },
        },
      },
    });
    
    // In a real implementation, you would check results to determine promotion
    // For this example, we'll just promote all students
    
    // Update all students to the next semester
    await prisma.student.updateMany({
      where: { id: { in: students.map(s => s.id) } },
      data: { currentSemesterId: nextSemesterId },
    });
    
    // Get subject offerings for the next semester
    const nextSemesterOfferings = await prisma.subjectOffering.findMany({
      where: { semesterId: nextSemesterId },
    });
    
    // Automatically enroll students in the next semester's subjects
    if (nextSemesterOfferings.length > 0) {
      const enrollmentsToCreate = [];
      
      for (const student of students) {
        for (const offering of nextSemesterOfferings) {
          enrollmentsToCreate.push({
            studentId: student.id,
            subjectOfferingId: offering.id,
          });
        }
      }
      
      if (enrollmentsToCreate.length > 0) {
        await prisma.enrollment.createMany({
          data: enrollmentsToCreate,
          skipDuplicates: true,
        });
      }
    }
    
    revalidatePath("/list/students");
    revalidatePath("/list/enrollments");
    
    return { 
      success: true, 
      promoted: students.length 
    };
  } catch (error) {
    console.error("Error promoting students:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to promote students" 
    };
  }
}

export const createCourse = async (
  currentState: CurrentState,
  data: CourseSchema
) => {
  try {
    // Generate a random 4-digit code
    const generateUniqueCode = async (): Promise<string> => {
      // Generate a random 4-digit number
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Check if this code already exists
      const existingCourse = await prisma.course.findFirst({
        where: { code }
      });
      
      // If code exists, recursively try again
      if (existingCourse) {
        return generateUniqueCode();
      }
      
      return code;
    };
    
    // Generate a unique code
    const code = await generateUniqueCode();
    
    // Check if course with same name already exists
    const existingCourseWithName = await prisma.course.findFirst({
      where: { name: data.name }
    });
    
    if (existingCourseWithName) {
      return { 
        success: false, 
        error: true, 
        message: "A course with this name already exists" 
      };
    }

    await prisma.course.create({
      data: {
        name: data.name,
        code, // Use the auto-generated code
        duration: data.duration,
        semesters: {
          create: Array.from({ length: data.semesters }, (_, i) => ({
            number: i + 1,
            startDate: new Date(), // default start date
            endDate: new Date()    // default end date
          }))
        }
      },
      include: {
        semesters: true
      }
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error creating course:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to create course" 
    };
  }
};

export const updateCourse = async (
  currentState: CurrentState,
  data: CourseSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "Course ID is required" };
  }

  try {
    // Get the existing course to preserve its code
    const existingCourse = await prisma.course.findUnique({
      where: { id: data.id }
    });
    
    if (!existingCourse) {
      return { 
        success: false, 
        error: true, 
        message: "Course not found" 
      };
    }
    
    // Check for name conflicts
    const nameConflict = await prisma.course.findFirst({
      where: {
        name: data.name,
        NOT: { id: data.id }
      }
    });
    
    if (nameConflict) {
      return { 
        success: false, 
        error: true, 
        message: "A course with this name already exists" 
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing semesters
      await tx.semester.deleteMany({
        where: { courseId: data.id }
      });

      // Update course and create new semesters
      await tx.course.update({
        where: { id: data.id },
        data: {
          name: data.name,
          duration: data.duration,
          // We don't update the code here, keeping the original one
          semesters: {
            create: Array.from({ length: data.semesters }, (_, i) => ({
              number: i + 1,
              startDate: new Date(), // default start date
              endDate: new Date()    // default end date
            }))
          }
        }
      });
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error updating course:", err);
    return { 
      success: false, 
      error: true, 
      message: err instanceof Error ? err.message : "Failed to update course" 
    };
  }
};

export const deleteCourse = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = parseInt(data.get("id") as string);
  try {
    // Delete associated semesters first
    await prisma.semester.deleteMany({
      where: { courseId: id }
    });

    // Delete the course
    await prisma.course.delete({
      where: { id }
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.error("Error deleting course:", err);
    return { 
      success: false, 
      error: true,
      message: err instanceof Error ? err.message : "Failed to delete course" 
    };
  }
};


export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    // Exclude 'id' from the data object when creating a new announcement
    const { id, ...createData } = data;

    await prisma.announcement.create({
      data: createData,
    });

    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
    export const updateAnnouncement = async (
      currentState: CurrentState,
      data: AnnouncementSchema
    ) => {
      try {
        // Ensure the `id` is provided and valid
        if (!data.id || isNaN(Number(data.id))) {
          throw new Error("Announcement ID is required for update and must be a valid number.");
        }
    
        // Update the announcement
        await prisma.announcement.update({
          where: {
            id: Number(data.id), // Use the provided `id`
          },
          data: {
            title: data.title,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            // img: data.img,
          },
        });
    
        // Revalidate the path if needed
        // revalidatePath("/list/announcements");
        return { success: true, error: false };
      } catch (err) {
        console.error("Error updating announcement:", err);
        return { success: false, error: true };
      }
    };

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
export async function createAssignment(prevState: any, formData: any) {
  try {
    // Create the assignment in the database
    const assignment = await prisma.assignment.create({
      data: {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        courseId: formData.courseId || null,
        semesterId: formData.semesterId || null,
        attachment: formData.attachment || null,
      },
    });
    
    // Revalidate the assignments list
    
    
    return { success: true, error: false };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return { success: false, error: true };
  }
}

// Update assignment function
export async function updateAssignment(prevState: any, formData: any) {
  try {
    // Update the assignment in the database
    const assignment = await prisma.assignment.update({
      where: { id: formData.id },
      data: {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        courseId: formData.courseId || null,
        semesterId: formData.semesterId || null,
        attachment: formData.attachment || null,
      },
    });
    
    // Revalidate the assignments list and the specific assignment
    revalidatePath('/list/assignments');
    revalidatePath(`/list/assignments/${formData.id}`);
    
    return { success: true, error: false };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return { success: false, error: true };
  }
}

// Delete assignment function
export async function deleteAssignment(
  prevState: { success: boolean; error: boolean },
  formData: FormData
) {
  try {
    const idValue = formData.get("id");
    
    // Make sure id is properly parsed as a number
    const id = typeof idValue === 'string' ? parseInt(idValue, 10) : null;
    
    if (!id || isNaN(id)) {
      console.error("Invalid assignment ID:", idValue);
      return { success: false, error: true, message: "Invalid assignment ID" };
    }
    
    console.log(`Deleting assignment with ID: ${id}`);
    
    // Delete the assignment with the properly parsed ID
    await prisma.assignment.delete({
      where: {
        id: id
      }
    });
    
    // Revalidate the assignments list
    
    
    return { success: true, error: false };
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return { 
      success: false, 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to delete assignment" 
    };
  }
}