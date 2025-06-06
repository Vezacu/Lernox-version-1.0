import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Course, Semester, Subject, SubjectOffering, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import '@/components/cssfile/menuPages.css';

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const teacher:
    | (Teacher & {
        subjectOfferings: (SubjectOffering & {
          subject: Subject;
          semester: Semester & { course: Course };
        })[];
      })
    | null = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjectOfferings: {
          include: {
            subject: true,
            semester: { include: { course: true } }
          }
        }
      },
    });

  if (!teacher) {
    return notFound();
  }

  // Get unique courses taught by the teacher
  const courses = Array.from(new Set(teacher.subjectOfferings.map(so => so.semester.course.name))).length;
  
  // Get unique subjects taught by the teacher
  const subjects = Array.from(new Set(teacher.subjectOfferings.map(so => so.subject.id))).length;
  
  // Get unique semesters the teacher teaches in
  const semesters = Array.from(new Set(teacher.subjectOfferings.map(so => so.semester.number))).length;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4 teacherIdpage">
            <div className="w-1/3">
              <Image
                src={teacher.img || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name + " " + teacher.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>
              {/*<p className="text-sm text-gray-500">
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              </p>*/}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2 ">
                  <Image src="/blood.png" alt="" width={14} height={14} className="teacherpageIcon"/>
                  <span>{teacher.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} className="teacherpageIcon"/>
                  <span>
                    {new Intl.DateTimeFormat("en-GB").format(teacher.birthday)}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} className="teacherpageIcon"/>
                  <span>{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} className="teacherpageIcon"/>
                  <span>{teacher.phone || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/subject.png" alt="" width={14} height={14} className="teacherpageIcon"/>
                  <span>{subjects} Subjects</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD - Classes */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] teacherIdsmallCard">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 "
              />
              <div className="">
                <h1 className="text-xl font-semibold"></h1>{/*90% */}
                <span className="text-sm text-gray-400"></span>{/*Attendance*/}
              </div>
            </div>
            {/* CARD - Subjects */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] teacherIdsmallCard">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{subjects}</h1>
                <span className="text-sm text-gray-400">Subjects</span>
              </div>
            </div>
            {/* CARD - Courses */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] teacherIdsmallCard">
              <Image 
                src="/course.png" 
                alt="" 
                width={24} 
                height={24} 
                className="w-6 h-6" 
              />
              <div className="">
                <h1 className="text-xl font-semibold">{courses}</h1>
                <span className="text-sm text-gray-400">Courses</span>
              </div>
            </div>
            {/* CARD - Semesters */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] teacherIdsmallCard">
              <Image 
                src="/semester.png" 
                alt="" 
                width={24} 
                height={24} 
                className="w-6 h-6" 
              />
              <div className="">
                <h1 className="text-xl font-semibold">{semesters}</h1>
                <span className="text-sm text-gray-400">Semesters</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]  teacherIdsmallCard">
          <h1 >Teacher&apos;s Schedule</h1>
          <Suspense fallback="Loading schedule...">
            <BigCalendarContainer type="teacherId"  id={teacher.id} />
          </Suspense>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md  teacherIdpage">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-800">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/subjects?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Subjects
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/students?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Students
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Lessons
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Exams
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Assignments
            </Link>
          </div>
        </div>
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;