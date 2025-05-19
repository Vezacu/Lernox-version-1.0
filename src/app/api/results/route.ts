import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating result creation/update
// Updated to use number types to match Prisma schema
const resultSchema = z.object({
  studentId: z.number().int().positive(),  // Changed back to number
  subjectId: z.number().int().positive(),  // Changed back to number
  internal: z.number().min(0),
  external: z.number().min(0),
  attendance: z.number().min(0),
  total: z.number().min(0),
});

// Schema for validating batch results
const batchResultsSchema = z.array(resultSchema).nonempty();

/**
 * GET /api/results
 * Fetches all results with related student and subject data
 */
export async function GET() {
  try {
    const results = await prisma.result.findMany({
      include: {
        student: true,
        subject: true,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      data: { results },
      count: results.length 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch results',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/results
 * Creates or updates multiple results
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if results property exists
    if (!body || !body.results || !Array.isArray(body.results)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: results array is required' },
        { status: 400 }
      );
    }
    
    const { results } = body;

    // Pre-process to ensure all IDs are numbers (in case they come as strings)
    const processedResults = results.map((result: any) => ({
      ...result,
      studentId: typeof result.studentId === 'string' ? parseInt(result.studentId, 10) : result.studentId,
      subjectId: typeof result.subjectId === 'string' ? parseInt(result.subjectId, 10) : result.subjectId,
    }));

    // Validate input with Zod
    const validationResult = batchResultsSchema.safeParse(processedResults);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid results data',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    // Extract unique student IDs using Array.from to avoid Set iteration issues
    const studentIdSet = new Set<number>(); // Changed back to number
    validationResult.data.forEach((result) => studentIdSet.add(result.studentId));
    const studentIds = Array.from(studentIdSet);
    
    // Validate all students exist
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds.map(String) } }
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more students not found' },
        { status: 404 }
      );
    }

    // Extract unique subject IDs using Array.from to avoid Set iteration issues
    const subjectIdSet = new Set<number>(); // Changed back to number
    validationResult.data.forEach((result) => subjectIdSet.add(result.subjectId));
    const subjectIds = Array.from(subjectIdSet);
    
    // Validate all subjects exist
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } }
    });

    if (subjects.length !== subjectIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more subjects not found' },
        { status: 404 }
      );
    }

    // Create or update results
    const savedResults = await Promise.all(
      validationResult.data.map(async (result) => {
        const existingResult = await prisma.result.findFirst({
          where: {
            studentId: String(result.studentId),
            subjectId: result.subjectId,
          },
        });

        if (existingResult) {
          return prisma.result.update({
            where: { id: existingResult.id },
            data: {
              internal: result.internal,
              external: result.external,
              attendance: result.attendance,
              total: result.total,
            },
            include: {
              student: true,
              subject: true,
            }
          });
        }

        return prisma.result.create({
          data: {
            studentId: String(result.studentId),
            subjectId: result.subjectId,
            internal: result.internal,
            external: result.external,
            attendance: result.attendance,
            total: result.total,
          },
          include: {
            student: true,
            subject: true,
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      data: { results: savedResults },
      count: savedResults.length
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving results:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A result with this data already exists',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Referenced student or subject does not exist',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save results',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
