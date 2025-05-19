import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events List | School Management System",
  description: "View and manage school events",
};

export default async function EventsPage() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Add authorization check
  if (!userId || !["admin", "teacher", "student"].includes(role?.toLowerCase() || "")) {
    redirect("/sign-in");
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-6">Events</h1>
      <div className="bg-white p-6 rounded-md shadow-sm">
        <p className="text-gray-500 text-center py-8">
          Event management functionality coming soon.
        </p>
      </div>
    </div>
  );
}
