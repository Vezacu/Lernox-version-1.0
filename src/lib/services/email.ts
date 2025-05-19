import nodemailer from 'nodemailer';

// Debug check for environment variables at load time
console.log("Email Environment Variables (DEBUG):");
console.log(`- EMAIL_SERVER: ${process.env.EMAIL_SERVER || 'Not set'}`);
console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT || 'Not set'}`);
console.log(`- EMAIL_SECURE: ${process.env.EMAIL_SECURE || 'Not set'} (as string)`);
console.log(`- EMAIL_SECURE parsed: ${process.env.EMAIL_SECURE === 'true'} (as boolean)`);
console.log(`- EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
console.log(`- EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0} characters`);
console.log(`- EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || 'Not set'}`);
console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);

// Configure email transporter - using direct Gmail settings
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use the built-in Gmail configuration
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  tls: {
    rejectUnauthorized: false
  },

  // Add timeout options
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  // Debug output
  debug: true,  // Show debug info
  logger: true  // Log information
});

// Send verification email to parent
export async function sendVerificationEmail(
  email: string,
  token: string,
  admissionId: string,
  studentFirstName: string,
  studentLastName: string
) {
  console.log("Attempting to send verification email to:", email);
  
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-parent?token=${token}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'School Admin'}" <${process.env.EMAIL_USER}>`,  // Use EMAIL_USER as the from address
    to: email,
    subject: `Verify Your Email for ${studentFirstName} ${studentLastName}'s Admission`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Email Verification Required</h2>
        <p>Dear ${studentFirstName} ${studentLastName}'s parent/guardian,</p>
        <p>Thank you for submitting an admission application. To complete the verification process, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p>If you did not request this verification, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>School Administration</p>
      </div>
    `,
  };

  try {
    console.log("Sending verification email with the following options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent successfully to ${email}`, info.messageId || '');
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
}

// Send admission confirmation email with optional credentials
export async function sendAdmissionConfirmationEmail(
  email: string,
  studentName: string,
  studentSurname: string,
  courseName: string,
  credentials?: { role: string; username: string; password: string }
) {
  try {
    console.log(`Sending admission confirmation email to ${email}`);
    
    let credentialsHtml = '';
    if (credentials) {
      credentialsHtml = `
        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 4px;">
          <h3 style="color: #2b6cb0; margin-top: 0;">Your Login Credentials</h3>
          <p><strong>Role:</strong> ${credentials.role}</p>
          <p><strong>Username:</strong> ${credentials.username}</p>
          <p><strong>Password:</strong> ${credentials.password}</p>
        </div>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Admission Confirmed for ${studentName} ${studentSurname}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Admission Confirmed</h2>
          <p>Dear ${studentName} ${studentSurname},</p>
          <p>Your admission to ${courseName} has been confirmed.</p>
          ${credentialsHtml}
          <p>Please keep your login credentials safe.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}

// Simple test function to verify email configuration
export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection test successful");
    return { success: true, message: "SMTP connection test successful" };
  } catch (error:any) {
    console.error("❌ SMTP connection test failed:", error);
    return { 
      success: false, 
      message: "SMTP connection test failed", 
      error: error.message,
      code: error.code
    };
  }
}