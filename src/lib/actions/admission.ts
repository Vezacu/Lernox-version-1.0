"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { sendVerificationEmail, sendAdmissionConfirmationEmail } from "@/lib/services/email";
import crypto from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
// Add this function to check if parent exists

export async function checkParentExists(username: string) {
  try {
    const parent = await prisma.parent.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true
      }
    });

    return {
      exists: !!parent,
      parent: parent
    };
  } catch (error) {
    console.error("Error checking parent existence:", error);
    return { exists: false, parent: null };
  }
}

export async function createAdmission(prevState: any, formData: FormData) {
  try {
    // Extract data from FormData
    const data = {
      studentName: formData.get('studentName') as string,
      studentSurname: formData.get('studentSurname') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      birthday: formData.get('birthday') as string,
      bloodType: formData.get('bloodType') as string,
      sex: formData.get('sex') as string,
      courseId: parseInt(formData.get('courseId') as string),
      hasExistingParent: formData.get('hasExistingParent') === 'true',
      parentUsername: formData.get('parentUsername') as string || null,
      parentName: formData.get('parentName') as string,
      parentPhone: formData.get('parentPhone') as string,
      parentEmail: formData.get('parentEmail') as string,
      parentAddress: formData.get('parentAddress') as string,
      studentPhotoUrl: formData.get('studentPhotoUrl') as string,
      paymentScreenshotUrl: formData.get('paymentScreenshotUrl') as string,
    };

    // Store existing parent ID if provided
    let existingParentId = null;
    if (data.hasExistingParent && data.parentUsername) {
      const parentResult = await checkParentExists(data.parentUsername);
      if (parentResult.exists && parentResult.parent) {
        existingParentId = parentResult.parent.id;
        // Use existing parent's details
        data.parentName = parentResult.parent.name;
        data.parentPhone = parentResult.parent.phone;
        data.parentEmail = parentResult.parent.email || '';
        data.parentAddress = parentResult.parent.address;
      }
    }

    // Check if the course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      return { 
        message: "Course not found", 
        errors: { courseId: "Course not found" } 
      };
    }

    // Get image URLs directly from the form data (already uploaded via Cloudinary widget)
    const studentPhotoUrl = data.studentPhotoUrl || null;
    const paymentScreenshotUrl = data.paymentScreenshotUrl || null;

    // Create the admission record in the database
    const newAdmission = await prisma.admissionForm.create({
      data: {
        studentName: data.studentName,
        studentSurname: data.studentSurname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        birthday: new Date(data.birthday),
        bloodType: data.bloodType,
        sex: data.sex as "MALE" | "FEMALE",
        courseId: data.courseId,
        img: studentPhotoUrl,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        parentAddress: data.parentAddress || '', // Provide empty string if address is null
        status: existingParentId ? "PARENT_VERIFIED" : "PENDING", // Auto-verify parent if existing
      },
    });

    // Create payment record if screenshot was provided
    if (paymentScreenshotUrl) {
      const amount = 100; // Default amount
      await prisma.payment.create({
        data: {
          admissionId: newAdmission.id,
          amount: amount,
          status: "PENDING",
          img: paymentScreenshotUrl,
        },
      });
    }

    // If we have an existing parent, check if payment is also verified
    if (existingParentId) {
      // Check if payment is also verified (in case admin verified it quickly)
      const payment = await prisma.payment.findFirst({
        where: { 
          admissionId: newAdmission.id,
          status: "APPROVED",
        },
      });

      // If both parent and payment are verified, update status to COMPLETED and create accounts
      if (payment) {
        await prisma.admissionForm.update({
          where: { id: newAdmission.id },
          data: { status: "COMPLETED" },
        });
        
        // Create student and parent accounts
        await createAccountsFromAdmission(newAdmission.id, existingParentId);
      }
    } else {
      // Generate verification token for parent email
      const verificationToken = generateVerificationToken();
      
      // Store verification token
      try {
        await prisma.verificationToken.create({
          data: {
            token: verificationToken,
            admissionId: newAdmission.id,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          }
        });
      } catch (error) {
        console.error("Error creating verification token:", error);
        // Continue with the process even if token creation fails
      }

      // Send verification email to parent
      try {
        await sendVerificationEmail(
          data.parentEmail,
          verificationToken,
          newAdmission.id,
          data.studentName,
          data.studentSurname
        );
      } catch (error) {
        console.error("Error sending verification email:", error);
        // Continue with the process even if email sending fails
      }
    }

    // Revalidate the admission path to show updated data
    revalidatePath("/admission");
    revalidatePath("/admin/pendings");

    // Return ID for redirection
    return { 
      message: existingParentId 
        ? "Admission form submitted successfully with existing parent." 
        : "Admission form submitted successfully. Please ask the parent to check their email for verification.", 
      errors: {},
      data: { id: newAdmission.id } 
    };
  } catch (error) {
    console.error("Error creating admission form:", error);
    return { 
      message: "Failed to create admission form", 
      errors: { _form: "Database error. Please try again." } 
    };
  }
}

// Verify parent email
export async function verifyParentEmail(token: string) {
  try {
    // Find the verification token
    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token },
      include: { admission: true },
    });

    if (!verificationRecord) {
      return { success: false, message: "Invalid verification token" };
    }

    if (verificationRecord.expires < new Date()) {
      return { success: false, message: "Verification token has expired" };
    }

    // Update admission form with parent verification
    const admission = await prisma.admissionForm.update({
      where: { id: verificationRecord.admissionId },
      data: { 
        status: "PARENT_VERIFIED",
      },
    });

    // Check if payment is also verified
    const payment = await prisma.payment.findFirst({
      where: { 
        admissionId: admission.id,
        status: "APPROVED",
      },
    });

    // If both parent and payment are verified, update status to COMPLETED
    if (payment) {
      await prisma.admissionForm.update({
        where: { id: admission.id },
        data: { status: "COMPLETED" },
      });
      
      try {
        // Create student and parent accounts
        const accountsCreated = await createAccountsFromAdmission(admission.id);
        if (!accountsCreated) {
          console.error("Failed to create accounts for admission:", admission.id);
          // Consider adding recovery logic here
        }
      } catch (error) {
        console.error("Error creating accounts:", error);
        // Consider adding recovery logic here
      }
    }

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });

    revalidatePath("/admin/pendings");
    
    return { 
      success: true, 
      message: "Parent email verified successfully" 
    };
  } catch (error) {
    console.error("Error verifying parent email:", error);
    return { 
      success: false, 
      message: "Failed to verify parent email" 
    };
  }
}

// Verify payment by admin
export async function verifyPayment(paymentId: string) {
  try {
    // Replace with actual admin ID (e.g., from session)
    const adminId = "admin-id"; 

    // Update payment status
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status: "APPROVED",
        verifiedBy: adminId, // Auto-fill verified by admin
      },
      include: { admission: true },
    });

    // Update admission form status
    let status = "PAYMENT_VERIFIED";
    let shouldCreateAccounts = false;
    
    // If parent is also verified, mark as COMPLETED
    if (payment.admission?.status === "PARENT_VERIFIED") {
      status = "COMPLETED";
      shouldCreateAccounts = true;
    }
    
    await prisma.admissionForm.update({
      where: { id: payment.admissionId },
      data: { status: status as "PAYMENT_VERIFIED" | "COMPLETED" },
    });

    // Create accounts if the admission is now complete
    if (shouldCreateAccounts) {
      await createAccountsFromAdmission(payment.admissionId);
    }

    revalidatePath("/admin/pendings");
    
    return { 
      success: true, 
      message: "Payment verified successfully" 
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { 
      success: false, 
      message: "Failed to verify payment" 
    };
  }
}

// Create student and parent accounts when admission is completed
async function createAccountsFromAdmission(admissionId: string, existingParentId: string | null = null) {
  try {
    // Get the admission data with course information
    const admission = await prisma.admissionForm.findUnique({
      where: { id: admissionId },
      include: {
        course: true,
      },
    });

    if (!admission) {
      console.error(`Admission with ID ${admissionId} not found`);
      return false;
    }

    // Find semester 1 for the course
    const semester = await prisma.semester.findFirst({
      where: {
        courseId: admission.courseId,
        number: 1 // Always assign to semester 1
      }
    });

    if (!semester) {
      console.error(`No semester 1 found for course ${admission.courseId}`);
      return false;
    }

    // Declare parentId variable at the top of the function
    let parentId: string | null = existingParentId;

    // Only create new parent if there's no existing parent
    if (!existingParentId) {
      // Check if parent with this email already exists
      const existingParent = await prisma.parent.findUnique({
        where: { email: admission.parentEmail }
      });

      if (existingParent) {
        // Use existing parent instead of creating new one
        parentId = existingParent.id;
      } else {
        // Create new parent only if one doesn't exist
        const parentUsername = `parent_${admission.parentName.toLowerCase()}_${crypto.randomBytes(3).toString('hex')}`;
        const parentPassword = generateSecurePassword();
        
        const clerk = await clerkClient();
        const clerkParent = await clerk.users.createUser({
          username: parentUsername,
          password: parentPassword,
          firstName: admission.parentName,
          lastName: admission.studentSurname,
          publicMetadata: { role: "parent" },
        });

        const newParent = await prisma.parent.create({
          data: {
            id: clerkParent.id,
            username: parentUsername,
            name: admission.parentName,
            surname: admission.studentSurname,
            email: admission.parentEmail,
            phone: admission.parentPhone,
            address: admission.parentAddress || '', // Provide empty string if address is null
          },
        });
        
        parentId = newParent.id;
        
        // Send credentials only for newly created parents
        await sendAdmissionConfirmationEmail(
          admission.parentEmail,
          admission.studentName,
          admission.studentSurname,
          admission.course.name,
          {
            role: "parent",
            username: parentUsername,
            password: parentPassword
          }
        );
      }
    }

    // Create student account
    const studentUsername = `student_${admission.studentName.toLowerCase()}_${crypto.randomBytes(3).toString('hex')}`;
    const studentPassword = generateSecurePassword();
    
    const clerk = await clerkClient();
    const clerkStudent = await clerk.users.createUser({
      username: studentUsername,
      password: studentPassword,
      firstName: admission.studentName,
      lastName: admission.studentSurname,
      publicMetadata: { role: "student" },
    });

    // Create student with semester assignment
    await prisma.student.create({
      data: {
        id: clerkStudent.id,
        username: studentUsername,
        name: admission.studentName,
        surname: admission.studentSurname,
        email: admission.email,
        phone: admission.phone,
        address: admission.address,
        birthday: admission.birthday,
        bloodType: admission.bloodType,
        sex: admission.sex,
        img: admission.img,
        courseId: admission.courseId,
        currentSemesterId: semester.id, // Assign to semester 1
        parentId: parentId
      },
    });

    // Send confirmation emails
    if (admission.email) {
      await sendAdmissionConfirmationEmail(
        admission.email,
        admission.studentName,
        admission.studentSurname,
        admission.course.name,
        {
          role: "student",
          username: studentUsername,
          password: studentPassword
        }
      );
    }

    return true;
  } catch (error) {
    console.error("Error creating accounts from admission:", error);
    return false;
  }
}

// Helper function to generate a secure password
function generateSecurePassword(): string {
  const length = 12;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  const randomValues = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  
  return password;
}

// Helper function to generate a secure verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}