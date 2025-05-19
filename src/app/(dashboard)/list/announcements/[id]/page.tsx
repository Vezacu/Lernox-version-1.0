import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

interface AnnouncementPageProps {
  params: {
    id: string;
  };
}

export default async function AnnouncementPage({ params }: AnnouncementPageProps) {
  const announcement = await prisma.announcement.findUnique({
    where: {
      id: parseInt(params.id)
    }
  });

  if (!announcement) {
    notFound();
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm m-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>Posted: {new Intl.DateTimeFormat("en-US", {
              dateStyle: 'long',
              timeStyle: 'short'
            }).format(announcement.date)}</span>
            <span>•</span>
            <span>Valid until: {new Intl.DateTimeFormat("en-US", {
              dateStyle: 'long'
            }).format(announcement.endDate)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {announcement.description}
          </p>
        </div>

        {/* Course and Semester Info if available */}
        {(announcement.courseId || announcement.semesterId) && (
          <div className="mt-8 pt-4 border-t">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Applicable to:</h2>
            <div className="flex gap-4">
              {announcement.courseId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Course specific
                </span>
              )}
              {announcement.semesterId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Semester specific
                </span>
              )}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <a
            href="/list/announcements"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to announcements
          </a>
        </div>
      </div>
    </div>
  );
}