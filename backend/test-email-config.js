require('dotenv').config();

console.log('=== Email Configuration Check ===\n');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length || 0);
console.log('EMAIL_PASS (masked):', process.env.EMAIL_PASS ? 
  process.env.EMAIL_PASS.substring(0, 4) + '****' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');

// Check for common issues
const issues = [];

if (!process.env.EMAIL_USER) {
  issues.push('❌ EMAIL_USER is not set');
}

if (!process.env.EMAIL_PASS) {
  issues.push('❌ EMAIL_PASS is not set');
} else {
  if (process.env.EMAIL_PASS.includes(' ')) {
    issues.push('❌ EMAIL_PASS contains spaces (remove them!)');
  }
  if (process.env.EMAIL_PASS.length !== 16) {
    issues.push(`⚠️  EMAIL_PASS length is ${process.env.EMAIL_PASS.length} (Google App Passwords are typically 16 characters)`);
  }
}

console.log('\n=== Issues Found ===');
if (issues.length === 0) {
  console.log('✓ Configuration looks correct');
  console.log('\nIf authentication still fails:');
  console.log('1. Generate a NEW App Password at: https://myaccount.google.com/apppasswords');
  console.log('2. Make sure 2-Step Verification is enabled');
  console.log('3. Use the exact password without any modifications');
} else {
  issues.forEach(issue => console.log(issue));
}
