"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

const ApplicationStatus: React.FC = () => {
  const [submissionTime, setSubmissionTime] = useState<string>("");

  // Get submission time from localStorage on component load
  useEffect(() => {
    const storedTime = localStorage.getItem("submissionTime");
    if (storedTime) {
      setSubmissionTime(storedTime);
    } else {
      // If no time is stored, set the current time only once
      const now = new Date();
      const formattedTime = `${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
      localStorage.setItem("submissionTime", formattedTime);
      setSubmissionTime(formattedTime);
      
    }
  }, []);
  
  const checkStatus = () => {
    document.getElementById("statusModal")?.classList.remove("hidden");
  };

  const closeModal = () => {
    document.getElementById("statusModal")?.classList.add("hidden");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 flex items-center justify-center mb-6">
            <Image
              src="/check-icon.png"
              alt="Success Icon"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>

          <p className="text-gray-600 mb-8">
            Thank you for submitting your admission application and payment.
            Your payment is currently being verified by our finance team.
          </p>

          {/* Next Steps Section */}
          <div className="w-full bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Next Steps:</h2>
            <ul className="space-y-4 text-left">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm mr-3 mt-0.5">
                  1
                </span>
                <span className="text-gray-600">
                  Our finance team will verify your payment within 24 hours.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm mr-3 mt-0.5">
                  2
                </span>
                <span className="text-gray-600">
                  You will receive a confirmation email with your student
                  credentials once payment is verified.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm mr-3 mt-0.5">
                  3
                </span>
                <span className="text-gray-600">
                  Use the provided credentials to complete your enrollment
                  process.
                </span>
              </li>
            </ul>
          </div>

          {/* Button Group */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-[#40e0d0] px-6 py-2 rounded-lg hover:bg-[#1ba396] transition-colors whitespace-nowrap"
            >
              Return to Home
            </button>
            <button
              onClick={checkStatus}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Check Payment Status
            </button>
          </div>

          {/* Support Link */}
          <p className="mt-8 text-sm text-gray-500">
            Need help? Contact support at{" "}
            <a
              href="https://mail.google.com/mail/?view=cm&to=mooontona275@gmail.com"
              className="text-primary hover:text-[#40e0d0] hover:underline"
            >
              support@Lernox.edu
            </a>
          </p>
        </div>
      </div>

      {/* Modal Section */}
      <div
        id="statusModal"
        className="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Payment Status</h3>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <Image
                src="/close-icon.png"
                alt="Close Icon"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </button>
          </div>

          {/* Payment Status Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/pending-icon.png"
                  alt="Pending Icon"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Payment Verification in Progress
                </p>
                <p className="text-sm text-gray-500">
                  Submitted on{" "}
                  <span className="font-semibold">{submissionTime}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={closeModal}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
