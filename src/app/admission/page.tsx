"use client"; 

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormState } from "react-dom";
import Image from "next/image";
import { createAdmission, checkParentExists} from "@/lib/actions/admission";
import { z } from "zod";
import InputField from "@/components/InputField";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import Link from "next/link";
import DarkModeToggle from "@/components/darkmode/darkmode";
import "../styles/Landingpage.css";

// Define the admission schema
const admissionSchema = z.object({
  studentName: z.string().min(1, { message: "Student name is required!" }),
  studentSurname: z.string().min(1, { message: "Student surname is required!" }),
  email: z.string().email({ message: "Invalid email format" }).optional().nullable(),
  phone: z.string().min(1, { message: "Phone number is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  birthday: z.string().min(1, { message: "Birthday is required!" }),
  bloodType: z.string().min(1, { message: "Blood type is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  courseId: z.string().min(1, { message: "Course is required!" }),
  hasExistingParent: z.boolean().optional(),
  parentUsername: z.string().optional(),
  parentName: z.string().min(1, { message: "Parent name is required!" }),
  parentPhone: z.string().min(1, { message: "Parent phone is required!" }),
  parentEmail: z.string().email({ message: "Parent email is required for verification!" }),
  parentAddress: z.string().min(1, { message: "Parent address is required!" }),
});

type AdmissionSchema = z.infer<typeof admissionSchema>;

// Define the form state type
interface FormState {
  message: string;
  errors: {
    _form?: string;
    [key: string]: string | undefined;
  };
}

// Define the courses locally
const courses = [
  { id: "1", name: "BCA" },
  { id: "2", name: "MCA" },
  { id: "3", name: "B.Tech" },
  { id: "4", name: "M.Tech" },
];

// Component that uses the search params
function AdmissionContent() {
  const [studentPhoto, setStudentPhoto] = useState<any>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingParent, setHasExistingParent] = useState(false);
  const [parentExists, setParentExists] = useState<boolean | null>(null);
  const [checkingParent, setCheckingParent] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get('course');

  // Initial state for form submission
  const initialState: FormState = {
    message: "",
    errors: {},
  };

  // Use form state with server action
  const [state, formAction] = useFormState<FormState, FormData>(createAdmission, initialState);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<AdmissionSchema>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      hasExistingParent: false,
    },
    mode: "onChange" // Validate on change for more responsive feedback
  });

  const watchParentUsername = watch("parentUsername");

  // Set default course value based on query parameter
  useEffect(() => {
    if (courseParam) {
      const selectedCourse = courses.find(course =>
        course.name.toLowerCase() === courseParam.toLowerCase()
      );
      if (selectedCourse) {
        setValue("courseId", selectedCourse.id);
      }
    }
  }, [courseParam, setValue]);
  
  // Track form submission status changes and handle redirection
  useEffect(() => {
    if (submissionAttempted && state && state.message && !state.errors._form) {
      // Show success notification
      toast.success(state.message);
      
      // Only after we've confirmed the submission is successful, reset form and redirect
      setTimeout(() => {
        reset(); // Reset the form
        setStudentPhoto(null);
        setPaymentScreenshot(null);
        setIsSubmitting(false);
        setSubmissionAttempted(false);
        
        // Redirect to confirmation page
        router.push("/admission/confirmation");
      }, 500); // Short delay to ensure the toast is visible
    } else if (submissionAttempted && state && state.errors && state.errors._form) {
      // Show error notification
      toast.error(state.errors._form || "Form submission failed. Please try again.");
      setIsSubmitting(false);
      setSubmissionAttempted(false);
    }
  }, [state, submissionAttempted, reset, router]);

  // Handle checking if parent exists
  const checkParent = async () => {
    if (!watchParentUsername) {
      toast.error("Please enter a parent username to check");
      return;
    }

    setCheckingParent(true);
    try {
      const result = await checkParentExists(watchParentUsername);
      setParentExists(result.exists);
      
      if (result.exists) {
        toast.success("Parent found! Parent info will be linked to this student.");
        
        // Pre-fill parent fields if available
        if (result.parent) {
          setValue("parentName", result.parent.name);
          setValue("parentPhone", result.parent.phone);
          if (result.parent.email) {
            setValue("parentEmail", result.parent.email);
          }
          setValue("parentAddress", result.parent.address);
        }
      } else {
        toast.error("Parent not found. Please check the username or register as a new parent.");
      }
    } catch (error) {
      toast.error("Error checking parent username");
      setParentExists(false);
    } finally {
      setCheckingParent(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: AdmissionSchema) => {
    // Guard against multiple submissions
    if (isSubmitting) return;
    
    setIsProcessing(true);
    setIsSubmitting(true);
    
    const submissionToast = toast.loading("Processing your application...", {
      toastId: "submission"
    });
    
    const formData = new FormData();

    // Add all form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Add Cloudinary image URLs if available
    if (studentPhoto) {
      formData.append('studentPhotoUrl', studentPhoto.secure_url);
    }
  
    if (paymentScreenshot) {
      formData.append('paymentScreenshotUrl', paymentScreenshot.secure_url);
    }

    try {
      // Submit the form
      await formAction(formData);
      setSubmissionAttempted(true);
      
      // Update toast to success
      toast.update(submissionToast, {
        render: "Application submitted! Redirecting...",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push("/admission/confirmation");
      }, 1000);

    } catch (error) {
      toast.update(submissionToast, {
        render: "Error submitting application",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setIsProcessing(false);
      setIsSubmitting(false);
    }
  };

  // Add this near your other useEffect hooks
  useEffect(() => {
    // Check if Cloudinary is available
    const checkCloudinaryAvailability = () => {
      if (typeof window !== 'undefined' && !(window as any).cloudinary) {
        console.warn('Cloudinary widget not initialized');
        return false;
      }
      return true;
    };

    const initializeCloudinary = async () => {
      if (!checkCloudinaryAvailability()) {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        } catch (error) {
          console.error('Failed to load Cloudinary widget:', error);
          toast.error('Upload feature initialization failed');
        }
      }
    };

    initializeCloudinary();
  }, []);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
    const toggleDropdown = (event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent event bubbling
      setIsDropdownOpen(!isDropdownOpen);
    };

  return (
    <div className="bg-gray-50 min-h-screen">

        {/* Top Navbar */}
    <nav className="navbar fixed top-0 left-0 w-full ">
      <div className="nav-left">
       
        {/* Dropdown Toggle Button */}
        <button onClick={toggleDropdown} className="dropdown-toggle">
          <Image src="/bar.png" alt="Menu" width={24} height={24} />
        </button>
        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <Link href="homepage">HOME</Link>
            <Link href="about">ABOUT</Link>
            <Link href="course">COURSE</Link>
              <DarkModeToggle/>
          </div>
        )} 
        <div className="logo-container">
          <Image src="/foxlogo.png" alt="LERNOX Logo" width={40} height={40}  />
          <span className="logo-text text-black">LERNOX</span>
        </div>
      </div>
      <div className="nav-right">
        <Link href="sign-in">LOGIN</Link>
      
      </div>
    </nav>
 {/********************************/}

      <div className="max-w-7xl mx-auto px-4 py-8 mt-20 ">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Student Admission Form
          </h1>
          </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
         
            <h2 className="text-xl font-semibold  mb-6">Student Information</h2>
            <div className="space-y-4">
            <InputField
              label="First Name"
              name="studentName"
              register={register}
              error={errors.studentName}
              className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />

            <InputField
              label="Last Name"
              name="studentSurname"
              register={register}
              error={errors.studentSurname}
            className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              register={register}
              error={errors.email}
            className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />

            <InputField
              label="Phone"
              name="phone"
              register={register}
              error={errors.phone}
             className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />

            <InputField
              label="Address"
              name="address"
              register={register}
              error={errors.address}
              className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />

            <div className="space-y-2">
              <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                Birthday <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="birthday"
                {...register("birthday")}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"

              />
              {errors.birthday && (
                <p className="text-red-500 text-sm mt-1">{errors.birthday.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-1">
                Blood Type <span className="text-red-500">*</span>
              </label>
              <select
                id="bloodType"
                {...register("bloodType")}
                className="w-full px-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8"

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
              {errors.bloodType && (
                <p className="text-red-500 text-sm mt-1">{errors.bloodType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                Sex <span className="text-red-500">*</span>
              </label>
              <select
                id="sex"
                {...register("sex")}
                className="w-full px-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8"

              >
                <option value="">Select Sex</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {errors.sex && (
                <p className="text-red-500 text-sm mt-1">{errors.sex.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                id="courseId"
                {...register("courseId")}
                className="w-full px-4 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8"
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
              {errors.courseId && (
                <p className="text-red-500 text-sm mt-1">{errors.courseId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="studentPhoto" className="block text-sm font-medium text-gray-700 mb-1">
                Student Photo
              </label>
              <div className="mt-2">
                <CldUploadWidget
                  uploadPreset="school"
                  onSuccess={(result: any) => {
                    setStudentPhoto(result.info);
                  }}
                >
                  {({ open }) => {
                    return (
                      <div
                        className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                        onClick={() => open()}
                      >
                        <Image src="/upload.png" alt="" width={28} height={28} />
                        <span>Upload a photo</span>
                      </div>
                    );
                  }}
                </CldUploadWidget>
                {studentPhoto && (
                  <div className="mt-2">
                    <Image
                      src={studentPhoto.secure_url}
                      alt="Student photo"
                      width={100}
                      height={100}
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div></div>

          {/* Parent/Guardian Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Parent/Guardian Information</h2>
            
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasExistingParent"
                  checked={hasExistingParent}
                  onChange={(e) => {
                    setHasExistingParent(e.target.checked);
                    setValue("hasExistingParent", e.target.checked);
                    if (!e.target.checked) {
                      setValue("parentUsername", "");
                      setParentExists(null);
                    }
                  }}
                  
                />
                <label htmlFor="hasExistingParent" className="ml-2 text-sm text-gray-700">
                  My child parent/guardian already has an account
                </label>
              </div>
              
              {hasExistingParent && (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Parent's Username"
                      {...register("parentUsername")}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={checkParent}
                      className={`px-4 py-2 bg-[#40e0d0] text-black rounded-md ${
                        checkingParent ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      disabled={checkingParent}
                    >
                      {checkingParent ? "Checking..." : "Check"}
                    </button>
                  </div>
                  
                  {parentExists === true && (
                    <p className="text-green-600 text-sm">
                      Parent found! This student will be linked to the existing parent account.
                    </p>
                  )}
                  
                  {parentExists === false && (
                    <p className="text-red-600 text-sm">
                      Parent not found. Please check the username or fill in the parent information below.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-4">
            <InputField
              label="Parent Name"
              name="parentName"
              register={register}
              error={errors.parentName}
            className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />

            <InputField
              label="Parent Phone"
              name="parentPhone"
              register={register}
              error={errors.parentPhone}
             className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />

<InputField
  label="Parent Email"
  name="parentEmail"
  type="email"
  register={register}
  error={errors.parentEmail}
  className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
/>

            <InputField
              label="Parent Address"
              name="parentAddress"
              register={register}
              error={errors.parentAddress}
            className="space-y-2 w-full md:w-[70%] lg:w-[50%]"
            />
</div>

<div className="mt-8">
              <h3 className="text-xl font-semibold mb-6">
                Payment Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="mb-4">
                  <Image
                    src="/QRcode.jpg"
                    alt="Payment QR Code"
                    width={250} height={250}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Scan the QR code to make payment
                </p>
                <p className="text-sm text-gray-600 mt-2">Amount: $500</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label htmlFor="paymentScreenshot" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Screenshot
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <CldUploadWidget
                  uploadPreset="school"
                  onSuccess={(result: any) => {
                    setPaymentScreenshot(result.info);
                  }}
                  onError={(error: any) => {
                    console.error('Upload error:', error);
                    toast.error('Upload failed. Please try again.');
                  }}
                >
                  {({ open, isLoading }) => {
                    const handleClick = () => {
                      if (!open) {
                        console.error('Widget not initialized');
                        toast.error('Upload system is initializing. Please try again in a moment.');
                        return;
                      }
                      try {
                        open();
                      } catch (error) {
                        console.error('Error opening widget:', error);
                        toast.error('Failed to open upload window. Please try again.');
                      }
                    };

                    return (
                      <div
                        className={`text-xs text-gray-500 flex items-center gap-2 ${
                          isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                        }`}
                        onClick={handleClick}
                      >
                        <Image 
                          src="/upload.png" 
                          alt="" 
                          width={28} 
                          height={28} 
                          priority // Ensure image loads early
                        />
                        <span>
                          {isLoading ? 'Initializing...' : 'Upload payment screenshot'}
                        </span>
                      </div>
                    );
                  }}
                </CldUploadWidget>
                {paymentScreenshot && (
                  <div className="mt-2">
                    <Image
                      src={paymentScreenshot.secure_url}
                      alt="Payment screenshot"
                      width={100}
                      height={100}
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#b6f3ed] p-4 rounded-lg mt-6">
              <h3 className="text-l font-medium  mb-2">Important Notes:</h3>
              <ul className="text-sm text list-disc text-gray-800 list-inside">
                <li>Parent email verification is required to complete the admission process.</li>
                <li>Payment verification will be done by the administration.</li>
                <li>Both verifications must be completed for successful admission.</li>
                <li>Once your application is approved, login credentials will be sent to the provided email addresses.</li>
              </ul>
            </div>
      
          </div>
        
          <div className="faq-link">
<a href="FAQs">Have questions? Check out our FAQs →</a>
</div>
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 bg-[#40e0d0] rounded-lg shadow-md  focus:outline-none focus:ring-2 focus:ring-[#158277] focus:ring-offset-2 transition-colors ${
              isSubmitting 
                ? "opacity-70 cursor-not-allowed " 
                : "hover:bg-[#1ba396]"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AdmissionPage() {
  return (
    <Suspense fallback={
      <div className="text-center p-8 mt-20">
        <h1 className="text-2xl font-bold">Loading...</h1>
        <p className="mt-4">Please wait while the form is loading...</p>
      </div>
    }>
      <AdmissionContent />
    </Suspense>
  );
}
