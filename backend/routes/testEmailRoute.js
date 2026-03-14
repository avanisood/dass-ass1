const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

router.get('/test-email', async (req, res) => {
    try {
        console.log('Testing SMTP connection from route...');
        const result = await sendEmail(
            process.env.EMAIL_USER,
            'Test Email from Deployed Backend',
            'This is a diagnostic email to test SMTP connectivity.',
            '<b>Diagnostic Email</b>'
        );
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

module.exports = router;
