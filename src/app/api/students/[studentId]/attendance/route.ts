import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    // Get all lessons and attendance records for the student
    const attendanceRecords = await prisma.lesson.findMany({
      where: {
        attendances: {
          some: {
            studentId: params.studentId
          }
        }
      },
      select: {
        id: true,
        subjectOfferingId: true,
        attendances: {
          where: {
            studentId: params.studentId
          },
          select: {
            present: true
          }
        }
      }
    });

    // Group and calculate attendance by subject
    const attendanceBySubject = attendanceRecords.reduce((acc, lesson) => {
      const subjectId = lesson.subjectOfferingId;
      if (!acc[subjectId]) {
        acc[subjectId] = {
          totalLessons: 0,
          presentCount: 0
        };
      }
      
      acc[subjectId].totalLessons++;
      if (lesson.attendances[0]?.present) {
        acc[subjectId].presentCount++;
      }
      
      return acc;
    }, {} as Record<number, { totalLessons: number; presentCount: number }>);

    // Convert to percentage format
    const attendance = Object.entries(attendanceBySubject).map(([subjectId, counts]) => {
      const percentage = counts.totalLessons > 0
        ? (counts.presentCount / counts.totalLessons) * 100
        : 0;

      return {
        subjectId: parseInt(subjectId),
        totalLessons: counts.totalLessons,
        attendedLessons: counts.presentCount,
        percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
      };
    });

    console.log('Calculated attendance:', attendance); // Debug log

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}