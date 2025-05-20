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
    
    const detailUrl = href || `/list/announcements/${item.id}`;
    router.push(detailUrl);
  };

  return (
    <tr 
      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" 
      onClick={handleRowClick}
    >
      <td className="py-3 px-0">{item.title}</td>
      <td className="p-py-3 px-0">
        {format(new Date(item.startDate), "MMM dd, yyyy")}
      </td>
      <td className="py-3 px-0-0">
        {format(new Date(item.endDate), "MMM dd, yyyy")}
      </td>
      {(role === "admin" || role === "teacher") && (
        <td className="py-3 px-0 actions-cell" onClick={e => e.stopPropagation()}>
          {actions}
        </td>
      )}
    </tr>
  );
};

export default InteractiveRow;