import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import FormContainer from "@/components/FormContainer";
import Link from "next/link";

interface AssignmentPageProps {
  params: {
    id: string;
  };
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    
    // Parse ID
    const id = parseInt(params.id);
    if (isNaN(id)) {
      notFound();
    }
    
    // Fetch assignment with course and semester data directly from database
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: id
      },
      include: {
        course: true,
        semester: true
      }
    });

    if (!assignment) {
      notFound();
    }

    // Get all courses and semesters for the form
    const courses = await prisma.course.findMany({
      select: { id: true, name: true, code: true, duration: true },
      orderBy: { name: 'asc' }
    });
    
    const semesters = await prisma.semester.findMany({
      select: { id: true, number: true, courseId: true, startDate: true, endDate: true },
      orderBy: { number: 'asc' }
    });
    
    // Create a related data object that contains courses and semesters
    const formRelatedData = {
      courses,
      semesters
    };
    
    // Determine status (upcoming, active, past)
    const now = new Date();
    const startDate = new Date(assignment.startDate);
    const dueDate = new Date(assignment.dueDate);
    
    let status;
    let statusColor;
    
    if (now < startDate) {
      status = "Upcoming";
      statusColor = "bg-yellow-100 text-yellow-800";
    } else if (now >= startDate && now <= dueDate) {
      status = "Active";
      statusColor = "bg-green-100 text-green-800";
    } else {
      status = "Past";
      statusColor = "bg-gray-100 text-gray-800";
    }
    
    // Check if the assignment has an attachment
    const hasAttachment = assignment.attachment && assignment.attachment.trim() !== '';
    const isPDF = hasAttachment && assignment.attachment?.toLowerCase().endsWith('.pdf');
    // Safe attachment url that's never null (empty string as fallback)
    const attachmentUrl = assignment.attachment || '';

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm m-4">
        <div className="max-w-3xl mx-auto">
          {/* Header with Navigation and Actions */}
          <div className="flex justify-between items-center mb-6">
            <Link
              href="/list/assignments"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to assignments
            </Link>
            
            {(role === "admin" || role === "teacher") && (
              <div className="flex items-center gap-2">
                <FormContainer 
                  table="assignment" 
                  type="update" 
                  data={assignment} 
                  relatedData={formRelatedData}
                />
                <FormContainer 
                  table="assignment" 
                  type="delete" 
                  id={assignment.id}
                />
              </div>
            )}
          </div>
          
          {/* Title and Status */}
          <div className="border-b pb-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {status}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Start: {format(startDate, 'MMM d, yyyy')}</span>
              <span>•</span>
              <span>Due: {format(dueDate, 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* Course and Semester Info if available */}
          {(assignment.courseId || assignment.semesterId) && (
            <div className="mt-8 pt-4 border-t">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Applicable to:</h2>
              <div className="flex gap-4">
                {assignment.courseId && assignment.course && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {assignment.course.name}
                  </span>
                )}
                {assignment.semesterId && assignment.semester && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Semester {assignment.semester.number}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Attachment Section */}
          {hasAttachment && (
            <div className="mt-8 pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">Attachment</h2>
              
              <div className="border rounded-lg p-4">
                {isPDF ? (
                  <div className="flex flex-col">
                    <div className="flex items-center text-blue-600 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span>PDF Document</span>
                    </div>
                    <a 
                      href={attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-4 py-2 bg-lamaBlue text-white rounded self-start inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="relative h-48 w-full mb-3">
                      <Image
                        src={attachmentUrl}
                        alt="Assignment attachment"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <a 
                      href={attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-4 py-2 bg-lamaBlue text-white rounded self-start inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      View Full Image
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in AssignmentPage:', error);
    throw error; // Re-throw to let Next.js error boundary handle it
  }
}