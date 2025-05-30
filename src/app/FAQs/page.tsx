"use client";
import React from "react";
import "./FAQs.css";
import Link from "next/link";
const FAQsPage: React.FC = () => {
  return (
    <div className="faqs-container">
      <h1>Frequently Asked Questions</h1>

      <ul className="faqs-list">
        <li>
          <h3>What are the admission requirements?</h3>
          <p>To apply for admission, you need to provide the following:</p>
          <ul>
            <li>Completed admission form</li>
            <li>Valid identification (e.g., passport or national ID)</li>
            <li>Academic transcripts or certificates</li>
            <li>Profile photo</li>
          </ul>
          <p>
            For more details, visit our{" "}
            <Link href="paymentInstruction">Admission Requirements</Link>

          </p>
        </li>

        <li>
          <h3>How do I submit my application?</h3>
          <p>You can submit your application by filling out the admission form on our website.</p>
          <ul>
            <li>Fill in all required fields accurately.</li>
            <li>Upload the necessary documents.</li>
            <li>Submit the form and proceed to the payment section.</li>
          </ul>
          <p>
            Visit the <Link href="/admission-form">Admission Form</Link> page.
          </p>
        </li>

        <li>
          <h3>What is the payment process?</h3>
          <p>After submitting your admission form, you will be redirected to the payment section.</p>
          <ul>
            <li>Scan the provided QR code.</li>
            <li>Use a supported payment method.</li>
            <li>Upload a screenshot of the payment confirmation.</li>
          </ul>
          <p>
            More details at <Link href="/payment-instructions" className="text-[#007bff]">Payment Instructions</Link>.
          </p>
        </li>

        <li>
          <h3>How do I upload my payment screenshot?</h3>
          <p>After making the payment:</p>
          <ul>
            <li>Take a clear screenshot.</li>
            <li>Click `&quot;`Upload Payment Screenshot`&quot;` on the payment form`&ldquo;`</li>
            <li>Select the file and upload it.</li>
            <li>Click `&ldquo;Submit Payment Proof`&ldquo;`.</li>
          </ul>
        </li>

        <li>
          <h3>What if I encounter an error?</h3>
          <p>If you encounter issues during the application process:</p>
          <ul>
            <li>Refresh the page and try again.</li>
            <li>Ensure all fields are correctly filled.</li>
            <li>
              Contact support at{" "}
              <a href="mailto:support@lernox.com">support@lernox.com</a> or call +123-456-7890.
            </li>
          </ul>
        </li>
      </ul>

      <div className="back-link">
        <Link href="admission">← Back to Admission Form</Link>
      </div>
    </div>
  );
};

export default FAQsPage;
