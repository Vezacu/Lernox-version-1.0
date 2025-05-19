'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface InteractiveRowProps {
  item: {
    id: number;
    title: string;
    startDate: Date;
    endDate: Date;
    course?: string | null;
    semester?: number | null;
  };
  role?: string;
  actions?: React.ReactNode;
  href?: string;
}

const InteractiveRow = ({ item, role, actions, href }: InteractiveRowProps) => {
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on actions
    if ((e.target as HTMLElement).closest('.actions-cell')) {
      return;
    }
    
    const detailUrl = href || `/list/assignments/${item.id}`;
    router.push(detailUrl);
  };

  return (
    <tr 
      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" 
      onClick={handleRowClick}
    >
      <td className="p-3">{item.title}</td>
      <td className="p-3">{item.course || 'N/A'}</td>
      <td className="p-3">{item.semester ? `Semester ${item.semester}` : 'N/A'}</td>
      <td className="p-3">
        {format(new Date(item.startDate), "MMM dd, yyyy")}
      </td>
      <td className="p-3">
        {format(new Date(item.endDate), "MMM dd, yyyy")}
      </td>
      {(role === "admin" || role === "teacher") && (
        <td className="p-3 actions-cell" onClick={e => e.stopPropagation()}>
          {actions}
        </td>
      )}
    </tr>
  );
};

export default InteractiveRow;