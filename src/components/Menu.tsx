
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import DropdownMenu from "@/components/dropdownMenu";

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  const userId = user?.id;

  // Modify menuItems dynamically based on user role
  const getMenuItems = () => {
    const baseMenuItems = [
      {
        title: "MENU",
        items: [
          {
            icon: "/home.png",
            label: "Home",
            href: "/",
            visible: ["admin", "teacher", "student", "parent", "cashier"],
          },
          {
            icon: "/pending.png",
            label: "pendings",
            href: "/list/pendings",
            visible: ["admin", "cashier"],
          },
          {
            icon: "/home.png",
            label: "Enrollment",
            href: "/list/enrollments",
            visible: ["admin"],
          },
          {
            icon: "/teacher.png",
            label: "Teachers",
            href: "/list/teachers",
            visible: ["admin", "teacher"],
          },
          {
            icon: "/student.png",
            label: "Students",
            href: "/list/students",
            visible: ["admin", "teacher"],
          },
          {
            icon: "/parent.png",
            label: "Parents",
            href: "/list/parents",
            visible: ["admin", "teacher"],
          },
          {
            icon: "/home.png",
            label: "Course",
            href: "/list/courses",
            visible: ["admin"],
          },
          {
            icon: "/subject.png",
            label: "Subjects",
            href: "/list/subjects",
            visible: ["admin"],
          },
          // {
          //   icon: "/class.png",
          //   label: "Classes",
          //   href: "/list/classes",
          //   visible: ["admin", "teacher"],
          // },
          {
            icon: "/lesson.png",
            label: "Lessons",
            href: "/list/lessons",
            visible: ["admin", "teacher"],
          },
          // {
          //   icon: "/exam.png",
          //   label: "Exams",
          //   href: "/list/exams",
          //   visible: ["admin", "teacher", "student", "parent"],
          // },
          {
            icon: "/assignment.png",
            label: "Assignments",
            href: "/list/assignments",
            visible: ["admin", "teacher", "student", "parent"],
          },
          {
            icon: "/coursecatalog.png",
            label: "Subjects Offering",
            href: "/list/subjectofferings",
            visible: ["admin"],
          },
           {
              icon: "/result.png",
              label: "Results",
              href: "/list/results",
              visible: ["admin", "teacher", "parent"],
            },
          {
            icon: "/result.png",
            label: "Results",
            href: role === "student" ? `/list/results/${userId}` : "/list/results",
            visible: ["student"],
          },
          {
            icon: "/attendance.png",
            label: "Attendance",
            href: "/list/attendances",
            visible: ["admin", "teacher"],
          },
          // {
          //   icon: "/calendar.png",
          //   label: "Events",
          //   href: "/list/events",
          //   visible: ["admin", "teacher", "student", "parent"],
          // },
          // {
          //   icon: "/message.png",
          //   label: "Messages",
          //   href: "/list/messages",
          //   visible: ["admin", "teacher", "student", "parent"],
          // },
          {
            icon: "/announcement.png",
            label: "Announcements",
            href: "/list/announcements",
            visible: ["admin", "teacher", "student", "parent", "cashier"],
          },
        ],
      },
      {
        title: "OTHER",
        items: [
          {
            icon: "/profile.png",
            label: "Profile",
            href: "/profile",
            visible: ["admin", "teacher", "student", "parent", "cashier"],
          },
          // {
          //   icon: "/setting.png",
          //   label: "Settings",
          //   href: "/settings",
          //   visible: ["admin", "teacher", "student", "parent"],
          // },
          {
            icon: "/logout.png",
            label: "Logout",
            href: "/logout",
            visible: ["admin", "teacher", "student", "parent", "cashier"],
          },
        ],
      },
    ];

    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  return <DropdownMenu menuItems={menuItems} role={role} />;
};

export default Menu;
