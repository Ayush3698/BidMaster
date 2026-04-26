const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    }
});
const fs = require('fs');
const path = require('path');

const codes = {};

const USERDATA_DIR = path.join(__dirname, '..', 'userdata');
if (!fs.existsSync(USERDATA_DIR)) fs.mkdirSync(USERDATA_DIR);

module.exports = function emailRoutes(app) {

    app.post('/api/send-code', async (req, res) => {
        const { email, name } = req.body;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        codes[email] = { code, expires: Date.now() + 10 * 60 * 1000 };

        // Save email to file
        const filePath = path.join(USERDATA_DIR, 'users.json');
        const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : [];
        const alreadyExists = existing.find(u => u.email === email);
        if (!alreadyExists) {
            existing.push({ email, registeredAt: new Date().toISOString() });
            fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
        }

        try {
            await transporter.sendMail({
                from: `BidMaster <${ process.env.GMAIL_USER }>`,
                to: email,
                subject: 'Your BidMaster Verification Code',
                html: `<p>Hi ${ name },</p><p>Your code is: <strong>${ code }</strong></p><p>Expires in 10 minutes.</p>`
            });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    app.post('/api/verify-code', (req, res) => {
        const { email, code } = req.body;
        const record = codes[email];

        if (!record) return res.json({ success: false, message: 'No code found' });
        if (Date.now() > record.expires) return res.json({ success: false, message: 'Code expired' });
        if (record.code !== code) return res.json({ success: false, message: 'Invalid code' });

        delete codes[email];
        res.json({ success: true });
    });
};