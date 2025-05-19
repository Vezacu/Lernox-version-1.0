"use client";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';

interface AttendanceData {
  present: number;
  absent: number;
  total: number;
  percentage: number;
  recentAttendances: {
    date: Date;
    present: boolean;
    lessonName: string;
  }[];
}

interface StudentAttendanceCardProps {
  id: string;
  studentName?: string;
  attendanceData: AttendanceData; // Required prop since we won't fetch via API
}

const StudentAttendanceCard = ({ id, studentName, attendanceData }: StudentAttendanceCardProps) => {
  const router = useRouter();

  // Get color based on attendance percentage
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-green-400';
    if (percentage >= 60) return 'bg-yellow-400';
    if (percentage >= 50) return 'bg-orange-400';
    return 'bg-red-500';
  };
  
  // Get text description of attendance
  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    if (percentage >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  // Navigation functions using Next.js router
  const viewStudentDetails = () => {
    router.push(`/list/students/${id}`);
  };

  const viewAttendanceList = () => {
    // Navigate to the attendance page with filters for this student
    router.push(`/list/attendances?studentId=${id}`);
  };

  // If no attendance data is provided, show a message
  if (!attendanceData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-center h-48">
        <div className="text-gray-500">No attendance data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {studentName && (
        <div className="flex items-center justify-between mb-4">
          <h3 
            className="font-medium text-gray-800 cursor-pointer hover:text-blue-600" 
            onClick={viewStudentDetails}
          >
            {studentName}
          </h3>
          <div 
            className={`text-white text-sm font-medium rounded-full px-3 py-1 ${getAttendanceColor(attendanceData.percentage)}`}
          >
            {attendanceData.percentage}%
          </div>
        </div>
      )}
      
      <div className="flex justify-between text-sm text-gray-600 mb-3">
        <div>Present: {attendanceData.present}</div>
        <div>Absent: {attendanceData.absent}</div>
        <div>Total: {attendanceData.total}</div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className={`h-2.5 rounded-full ${getAttendanceColor(attendanceData.percentage)}`} 
          style={{ width: `${attendanceData.percentage}%` }}
        ></div>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        Status: <span className="font-medium">{getAttendanceStatus(attendanceData.percentage)}</span>
      </div>
      
      {attendanceData.recentAttendances && attendanceData.recentAttendances.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-500">Recent Attendance</h4>
            <button 
              onClick={viewAttendanceList}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {attendanceData.recentAttendances.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center">
                  <div 
                    className={`w-2 h-2 rounded-full mr-2 ${item.present ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span>{item.lessonName}</span>
                </div>
                <div className="text-gray-500">{format(new Date(item.date), 'dd MMM')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceCard;