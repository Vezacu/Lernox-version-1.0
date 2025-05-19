"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyParentEmail } from '@/lib/actions/admission';
import { useEffect } from 'react';

// Component that uses the search params
function VerifyParentContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        alert("Missing verification token!");
        return;
      }

      try {
        const result = await verifyParentEmail(token);
        if (result.success) {
          alert("Email verified successfully!");
        } else {
          alert("Verification failed: " + result.message);
        }
      } catch (error) {
        alert("Error during verification!");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold">Verifying Email...</h1>
      <p className="mt-4">Please wait while we verify your email address.</p>
    </div>
  );
}

// Main component with Suspense boundary
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">Loading...</h1>
        <p className="mt-4">Please wait...</p>
      </div>
    }>
      <VerifyParentContent />
    </Suspense>
  );
}
