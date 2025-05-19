import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const results = await prisma.result.findMany({
      include: {
        student: true,
        subject: true,
      },
    });
    
    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { results } = await request.json();

    // Validate input
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid results data' },
        { status: 400 }
      );
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: results[0].studentId }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Create or update results
    const savedResults = await Promise.all(
      results.map(async (result) => {
        const existingResult = await prisma.result.findFirst({
          where: {
            studentId: result.studentId,
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
          });
        }

        return prisma.result.create({
          data: {
            studentId: result.studentId,
            subjectId: result.subjectId,
            internal: result.internal,
            external: result.external,
            attendance: result.attendance,
            total: result.total,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      results: savedResults
    });
  } catch (error: any) {
    console.error('Error saving results:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save results' },
      { status: 500 }
    );
  }
}
