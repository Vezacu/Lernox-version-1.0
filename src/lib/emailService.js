// const nodemailer = require('nodemailer');

// /**
//  * Email service for sending verification and notification emails
//  * Includes proper error handling and retry logic
//  */
// class EmailService {
//   constructor(config) {
//     this.transporter = nodemailer.createTransport({
//       host: config.host,
//       port: parseInt(config.port),
//       secure: config.secure === 'true',
//       auth: {
//         user: config.user,
//         pass: config.password
//       },
//       // Adding these options to fix connection issues
//       tls: {
//         rejectUnauthorized: false,
//         ciphers: 'SSLv3'
//       },
//       // Connection timeout settings
//       connectionTimeout: 10000, // 10 seconds
//       greetingTimeout: 10000,
//       socketTimeout: 15000
//     });
//   }

//   /**
//    * Send an email with retry logic
//    * @param {Object} mailOptions - Email options (to, subject, text, html)
//    * @param {number} maxRetries - Maximum number of retry attempts
//    * @returns {Promise<boolean>} - Success status
//    */
//   async sendEmail(mailOptions, maxRetries = 3) {
//     let retries = 0;
    
//     while (retries < maxRetries) {
//       try {
//         const info = await this.transporter.sendMail({
//           from: `"${mailOptions.fromName || 'LERNOX MANAGEMENT'}" <${mailOptions.from || 'learnoxmanagement@gmail.com'}>`,
//           to: mailOptions.to,
//           subject: mailOptions.subject,
//           text: mailOptions.text,
//           html: mailOptions.html
//         });
        
//         console.log(`Email sent successfully: ${info.messageId}`);
//         return true;
//       } catch (error) {
//         retries++;
//         console.error(`Email sending attempt ${retries} failed:`, error);
        
//         if (retries >= maxRetries) {
//           console.error('Maximum retry attempts reached. Email could not be sent.');
//           throw error;
//         }
        
//         // Wait before retrying (exponential backoff)
//         await new Promise(resolve => setTimeout(resolve, 1000 * retries));
//       }
//     }
    
//     return false;
//   }
  
//   /**
//    * Send a verification email
//    * @param {string} to - Recipient email
//    * @param {string} verificationLink - Verification link
//    * @returns {Promise<boolean>} - Success status
//    */
//   async sendVerificationEmail(to, verificationLink) {
//     const mailOptions = {
//       to,
//       subject: 'Email Verification',
//       text: `Please verify your email by clicking on the following link: ${verificationLink}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
//           <h2 style="color: #333;">Email Verification</h2>
//           <p>Thank you for registering. Please verify your email by clicking the button below:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
//           </div>
//           <p>If the button doesn't work, you can also click on this link or copy it to your browser:</p>
//           <p><a href="${verificationLink}">${verificationLink}</a></p>
//           <p>This link will expire in 24 hours.</p>
//         </div>
//       `
//     };
    
//     return this.sendEmail(mailOptions);
//   }
// }

// // Create and export the email service instance using environment variables
// const emailService = new EmailService({
//   host: process.env.EMAIL_SERVER,
//   port: process.env.EMAIL_PORT,
//   secure: process.env.EMAIL_SECURE,
//   user: process.env.EMAIL_USER,
//   password: process.env.EMAIL_PASSWORD
// });

// module.exports = emailService;

const EmailService = require('../lib/emailService');

// Configuration for testing
// Replace these with your actual SMTP server details
const testConfig = {
  host: 'smtp.gmail.com',  // Use your SMTP server
  port: '587',             // Common SMTP ports: 25, 465, 587
  secure: 'false',         // true for 465, false for other ports
  user: 'your-email@gmail.com',  // Your email address
  password: 'your-app-password'  // Your email password or app password
};

// Create a test function
async function testEmailService() {
  try {
    console.log('Initializing email service...');
    const emailService = new EmailService(testConfig);
    
    // Test a basic email
    console.log('Testing basic email sending...');
    const testResult = await emailService.sendEmail({
      to: 'recipient@example.com', // Replace with a real recipient email
      subject: 'Test Email from EmailService',
      text: 'This is a test email to verify the EmailService is working correctly.',
      html: '<p>This is a <b>test email</b> to verify the EmailService is working correctly.</p>'
    });
    
    console.log('Basic email test result:', testResult ? 'SUCCESS' : 'FAILED');
    
    // Test verification email
    console.log('Testing verification email...');
    const verificationLink = 'https://yourdomain.com/verify?token=sample-verification-token';
    const verificationResult = await emailService.sendVerificationEmail(
      'recipient@example.com', // Replace with a real recipient email
      verificationLink
    );
    
    console.log('Verification email test result:', verificationResult ? 'SUCCESS' : 'FAILED');
    
    return testResult && verificationResult;
  } catch (error) {
    console.error('Test failed with error:', error);
    return false;
  }
}

// Run the test
testEmailService()
  .then(success => {
    console.log('Overall test result:', success ? 'SUCCESS' : 'FAILED');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error during testing:', err);
    process.exit(1);
  });