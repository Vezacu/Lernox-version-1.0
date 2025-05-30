//src>components>BigCalendarContainer.tsx
import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "semesterId";
  id: string | number;
}) => {
  let dataRes;
  
  if (type === "teacherId") {
    // Find lessons where the teacher is teaching
    dataRes = await prisma.lesson.findMany({
      where: {
        subjectOffering: {
          teacherId: id as string
        }
      },
      include: {
        subjectOffering: {
          include: {
            subject: true
          }
        }
      }
    });
  } else {
    // Find lessons for a specific semester
    dataRes = await prisma.lesson.findMany({
      where: {
        subjectOffering: {
          semesterId: id as number
        }
      },
      include: {
        subjectOffering: {
          include: {
            subject: true
          }
        }
      }
    });
  }
  
  const data = dataRes.map((lesson) => ({
     id: lesson.id, // add this
    title: lesson.subjectOffering.subject.name,
    start: lesson.startTime,
    end: lesson.endTime,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
