import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    // Get all lessons with attendance for this student
    const lessons = await prisma.lesson.findMany({
      where: {
        attendances: {
          some: {
            studentId: params.studentId
          }
        }
      },
      include: {
        subjectOffering: true,
        attendances: {
          where: {
            studentId: params.studentId
          }
        }
      }
    });

    // Calculate attendance per subject
    const attendanceBySubject = new Map();

    lessons.forEach(lesson => {
      const subjectId = lesson.subjectOffering.subjectId;
      const attended = lesson.attendances[0]?.present || false;

      if (!attendanceBySubject.has(subjectId)) {
        attendanceBySubject.set(subjectId, {
          subjectId,
          totalLessons: 0,
          attendedLessons: 0
        });
      }

      const record = attendanceBySubject.get(subjectId);
      record.totalLessons++;
      if (attended) record.attendedLessons++;
    });

    // Convert to array and calculate percentages
    const attendance = Array.from(attendanceBySubject.values()).map(record => ({
      ...record,
      percentage: Math.round((record.attendedLessons / record.totalLessons) * 100)
    }));

    console.log("Calculated attendance:", attendance);
    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}