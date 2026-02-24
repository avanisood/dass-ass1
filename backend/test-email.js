require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

/**
 * Test email sending functionality
 */
const testEmailSending = async () => {
  console.log('Testing email sending...');
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass:', process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');

  try {
    // Test 1: Simple plain text email
    console.log('\n=== Test 1: Sending plain text email ===');
    const result1 = await sendEmail(
      process.env.EMAIL_USER, // Send to yourself for testing
      'Test Email from Felicity',
      'This is a test email from Felicity Event Management System.',
      '<h1>Test Email</h1><p>This is a <strong>test email</strong> from Felicity Event Management System.</p>'
    );
    
    if (result1.success) {
      console.log('✓ Plain text email sent successfully!');
      console.log('Message ID:', result1.messageId);
      if (result1.previewUrl) {
        console.log('📧 View email at:', result1.previewUrl);
      }
    } else {
      console.log('✗ Failed to send plain text email');
      console.log('Error:', result1.error);
    }

    // Test 2: Email with embedded image (QR code simulation)
    console.log('\n=== Test 2: Sending email with QR code ===');
    
    // Generate a real QR code using the qrcode library
    const QRCode = require('qrcode');
    const testQRData = 'EVENT:12345|PARTICIPANT:67890|TICKET:TEST-123456';
    const testQRCode = await QRCode.toDataURL(testQRData);
    
    const htmlWithImage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Registration Confirmation</h2>
        <p>Your registration has been confirmed!</p>
        <div style="text-align: center; margin: 20px 0;">
          <p><strong>Your QR Code:</strong></p>
          <img src="cid:qrcode" alt="QR Code" style="max-width: 200px;" />
        </div>
        <p>Show this QR code at the event entrance.</p>
      </div>
    `;

    const result2 = await sendEmail(
      process.env.EMAIL_USER,
      'Test Registration Confirmation with QR Code',
      'Your registration has been confirmed. Please check the HTML version for QR code.',
      htmlWithImage,
      [
        {
          filename: 'qrcode.png',
          content: testQRCode.split('base64,')[1],
          encoding: 'base64',
          cid: 'qrcode'
        }
      ]
    );

    if (result2.success) {
      console.log('✓ Email with QR code sent successfully!');
      console.log('Message ID:', result2.messageId);
      if (result2.previewUrl) {
        console.log('📧 View email at:', result2.previewUrl);
      }
    } else {
      console.log('✗ Failed to send email with QR code');
      console.log('Error:', result2.error);
    }

    console.log('\n=== Email Test Complete ===');
    console.log('✓ Emails sent using Gmail SMTP');
    console.log('Check your inbox:', process.env.EMAIL_USER);
    console.log('(Check spam/promotions folder if you don\'t see it)');
  } catch (error) {
    console.error('Test error:', error);
  }
};

testEmailSending();
