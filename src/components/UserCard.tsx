import prisma from "@/lib/prisma";
import Image from "next/image";
import './cssfile/usercard.css';




const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student" | "parent";
}) => {
  const modelMap: Record<typeof type, any> = {
    admin: prisma.admin,
    teacher: prisma.teacher,
    student: prisma.student,
    parent: prisma.parent,
  };

  const imageMap: Record<typeof type, string> = {
    admin: "/student.png",
    teacher: "/teacher.png",
    student: "/parent.png",
    parent: "/staff.png",
  };

  const data = await modelMap[type].count();
  const imageSrc = imageMap[type] || "/default.png";

  return (
    <div className={`user-cards ${type}`}> {/* Wrapper added */}
      <div className="cardBorder"> {/* Main card styling retained */}
        <div className="flex justify-between items-center ">
          <span className="text-[12px] px-1.5 py-1 rounded-full text- userCard-year">
            2024/25
          </span>
          <Image src="/more.png" alt="More" width={20} height={20} />
        </div>
        
        {/* Image section inside user-cardImage wrapper */}
        <div className={`user-cardImage ${type}`}>
          <Image src={imageSrc} alt={type} width={50} height={50} />
        </div>

        <h1 className="text-2xl font-semibold my-4">{data}</h1>
        <h2 className="capitalize text-sm font-medium text-gray-500">{type}s</h2>
      </div>
    </div>
  );
};

export default UserCard;
