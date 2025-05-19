"use client";

import { useRouter } from "next/navigation";
import { verifyPayment } from "@/lib/actions/admission";

interface VerifyPaymentButtonProps {
  paymentId: string;
}

export default function VerifyPaymentButton({ paymentId }: VerifyPaymentButtonProps) {
  const router = useRouter();

  const handleVerify = async () => {
    try {
      const result = await verifyPayment(paymentId);
      if (result.success) {
        alert("Payment verified successfully!");
        router.refresh(); // Refresh the page to reflect changes
      } else {
        alert("Failed to verify payment: " + result.message);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert("An error occurred while verifying the payment.");
    }
  };

  return (
    <button
      onClick={handleVerify}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
    >
      Verify Payment
    </button>
  );
}