import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating result creation/update
// Updated to use string for studentId to match Clerk user IDs
const resultSchema = z.object({
  studentId: z.string(),  // Changed to string to match Clerk user IDs
  subjectId: z.number().int().positive(),
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
export async function GET(request: NextRequest) {
  console.log('GET /api/results called');
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    
    console.log('Query parameters:', { studentId, subjectId });
    
    const whereClause: any = {};
    
    if (studentId) {
      whereClause.studentId = studentId;
      console.log('Filtering by studentId:', studentId);
    }
    
    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
      console.log('Filtering by subjectId:', subjectId);
    }
    
    console.log('Using where clause:', whereClause);
    
    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        student: true,
        subject: true,
      },
    });
    
    console.log(`Found ${results.length} results`);
    
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
  console.log('POST /api/results called');
  try {
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    // Check if results property exists
    if (!body || !body.results || !Array.isArray(body.results)) {
      console.error('Invalid request: Missing or invalid results array');
      return NextResponse.json(
        { success: false, error: 'Invalid request: results array is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${body.results.length} results`);
    
    const { results } = body;

    // Pre-process to ensure subjectId is a number (in case it comes as a string)
    const processedResults = results.map((result: any) => ({
      ...result,
      // Keep studentId as string
      subjectId: typeof result.subjectId === 'string' ? parseInt(result.subjectId, 10) : result.subjectId,
      // Ensure scores are numbers
      internal: Number(result.internal),
      external: Number(result.external),
      attendance: Number(result.attendance),
      total: Number(result.total)
    }));

    // Validate input with Zod
    const validationResult = batchResultsSchema.safeParse(processedResults);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.flatten());
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
    const studentIdSet = new Set<string>(); // Changed to string
    validationResult.data.forEach((result) => studentIdSet.add(result.studentId));
    const studentIds = Array.from(studentIdSet);
    console.log('Unique student IDs:', studentIds);
    
    // Validate all students exist
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } }
    });
    console.log(`Found ${students.length} students out of ${studentIds.length} requested`);

    if (students.length !== studentIds.length) {
      const foundIds = students.map(s => s.id);
      const missingIds = studentIds.filter(id => !foundIds.includes(id));
      console.error('Missing student IDs:', missingIds);
      return NextResponse.json(
        { success: false, error: 'One or more students not found' },
        { status: 404 }
      );
    }

    // Extract unique subject IDs using Array.from to avoid Set iteration issues
    const subjectIdSet = new Set<number>();
    validationResult.data.forEach((result) => subjectIdSet.add(result.subjectId));
    const subjectIds = Array.from(subjectIdSet);
    console.log('Unique subject IDs:', subjectIds);
    
    // Validate all subjects exist
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } }
    });
    console.log(`Found ${subjects.length} subjects out of ${subjectIds.length} requested`);

    if (subjects.length !== subjectIds.length) {
      const foundIds = subjects.map(s => s.id);
      const missingIds = subjectIds.filter(id => !foundIds.includes(id));
      console.error('Missing subject IDs:', missingIds);
      return NextResponse.json(
        { success: false, error: 'One or more subjects not found' },
        { status: 404 }
      );
    }

    console.log('Starting to save results...');
    // Create or update results
    const savedResults = await Promise.all(
      validationResult.data.map(async (result) => {
        console.log(`Processing result for student ${result.studentId}, subject ${result.subjectId}`);
        const existingResult = await prisma.result.findFirst({
          where: {
            studentId: result.studentId, // No need to convert to string
            subjectId: result.subjectId,
          },
        });

        if (existingResult) {
          console.log(`Updating existing result ID: ${existingResult.id}`);
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

        console.log(`Creating new result for student ${result.studentId}, subject ${result.subjectId}`);
        return prisma.result.create({
          data: {
            studentId: result.studentId, // No need to convert to string
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

    console.log(`Successfully saved ${savedResults.length} results`);
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
