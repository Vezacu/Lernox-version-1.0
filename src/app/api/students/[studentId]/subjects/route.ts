import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        subjectOfferings: {
          some: {
            enrollments: {
              some: {
                studentId: params.studentId,
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        subjectOfferings: {
          where: {
            enrollments: {
              some: {
                studentId: params.studentId,
                status: 'ACTIVE'
              }
            }
          },
          select: {
            id: true,
            semester: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Fetched subjects for student:', subjects);

    return NextResponse.json({ 
      success: true,
      subjects 
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subjects' 
      },
      { status: 500 }
    );
  }
}