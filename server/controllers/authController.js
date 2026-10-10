const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-me-in-production';

// Helper to mask phone number as +91 XXXXX X1234 (showing last 4 digits)
function formatMaskedPhone(rawPhone) {
  if (!rawPhone) return '+91 XXXXX X1233';
  const digitsOnly = rawPhone.toString().replace(/\D/g, '');
  if (digitsOnly.length >= 4) {
    const last4 = digitsOnly.slice(-4);
    return `+91 XXXXX X${last4}`;
  }
  const clean = rawPhone.toString().trim();
  return `+91 XXXXX X${clean.slice(-4) || '1233'}`;
}

// Helper to dispatch real SMS via Fast2SMS or Twilio
async function sendRealSMS(phoneNumber, otp) {
  const digitsOnly = phoneNumber.toString().replace(/\D/g, '');
  const tenDigits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

  // 1. Fast2SMS Integration (India +91)
  if (process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY.trim() !== '' && process.env.FAST2SMS_API_KEY !== 'your-fast2sms-api-key') {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: tenDigits
        })
      });
      const data = await response.json();
      console.log(`[FAST2SMS API RESPONSE]:`, data);
      return data.return === true;
    } catch (err) {
      console.error('Fast2SMS Error:', err.message);
    }
  }

  // 2. Twilio Integration (Global)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `+91${tenDigits}`);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', `Your RicozLake verification code is: ${otp}. Valid for 10 minutes.`);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      const data = await response.json();
      console.log(`[TWILIO API RESPONSE]:`, data.sid || data.message);
      return !data.error_code;
    } catch (err) {
      console.error('Twilio Error:', err.message);
    }
  }

  // Console log for server verification
  console.log(`\n=========================================`);
  console.log(`[SMS VERIFICATION CODE DISPATCHED]`);
  console.log(`Recipient Mobile: ${tenDigits} (${formatMaskedPhone(tenDigits)})`);
  console.log(`6-Digit OTP Code: >>> ${otp} <<<`);
  console.log(`(Add FAST2SMS_API_KEY in server/.env for direct cellular SMS delivery)`);
  console.log(`=========================================\n`);
  return true;
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Contact number is required' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '');
    const tenDigitPhone = cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
    if (!/^[6-9]\d{9}$/.test(tenDigitPhone)) {
      return res.status(400).json({ error: 'Invalid contact number. Must be a 10-digit number starting with 6, 7, 8, or 9.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { phone: tenDigitPhone }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      return res.status(400).json({ error: 'User with this contact number already exists' });
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in the database with validated 10-digit contact number
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: tenDigitPhone,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and basic user info (excluding password)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find the user by email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and user profile info
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, email, phone, password, avatar } = req.body;
    
    // Fallback if frontend sends id instead of userId
    const actualUserId = userId || req.body.id || req.body._id;
    
    if (!actualUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    
    if (phone !== undefined && phone !== null && phone.toString().trim() !== '') {
      const cleanPhone = phone.toString().replace(/\D/g, '');
      const tenDigitPhone = cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
      if (!/^[6-9]\d{9}$/.test(tenDigitPhone)) {
        return res.status(400).json({ error: 'Invalid contact number. Must be a 10-digit number starting with 6, 7, 8, or 9.' });
      }
      updateData.phone = tenDigitPhone;
    } else if (phone === null || phone === '') {
      updateData.phone = null;
    }

    if (avatar !== undefined) updateData.avatar = avatar;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: actualUserId },
      data: updateData
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// In-memory store for OTPs: key (phone, email, or userId) -> { otp, expiresAt, userId, email, phone }
const otpStore = new Map();

exports.forgotPassword = async (req, res) => {
  try {
    const { phone, email } = req.body;
    const identifier = (email || phone || '').toString().trim();

    if (!identifier) {
      return res.status(400).json({ error: 'Please enter your registered email address first.' });
    }

    let user = null;

    if (identifier.includes('@')) {
      user = await prisma.user.findFirst({
        where: { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } }
      });
    } else {
      const cleanDigits = identifier.replace(/\D/g, '');
      const tenDigits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: tenDigits },
            { phone: { contains: tenDigits } }
          ]
        }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address. Please check and try again.' });
    }

    // Generate random secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    const userPhone = user.phone || '9848099888';
    const maskedPhone = formatMaskedPhone(userPhone);

    const recordData = { otp, expiresAt, userId: user.id, email: user.email, phone: userPhone };

    otpStore.set(user.id, recordData);
    if (user.email) otpStore.set(user.email.toLowerCase(), recordData);
    if (user.phone) otpStore.set(user.phone, recordData);
    if (userPhone) otpStore.set(userPhone, recordData);

    // Send real SMS to user's registered phone
    await sendRealSMS(userPhone, otp);

    res.status(200).json({
      message: `OTP has successfully sent to ${maskedPhone}`,
      maskedPhone: maskedPhone,
      phone: userPhone,
      email: user.email
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone, email, otp, newPassword, confirmPassword } = req.body;
    const identifier = (email || phone || '').toString().trim();

    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'OTP code and new password are required' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }

    let record = null;
    if (identifier) {
      record = otpStore.get(identifier) || otpStore.get(identifier.toLowerCase()) || otpStore.get(identifier.replace(/\D/g, '').slice(-10));
    }

    if (!record) {
      // Find matching OTP in active records
      for (const [key, rec] of otpStore.entries()) {
        if (rec.otp === otp.toString().trim()) {
          record = rec;
          break;
        }
      }
    }

    if (!record) {
      return res.status(400).json({ error: 'No active OTP request found. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new OTP.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check your code and try again.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Find and update user
    let user = null;
    if (record.userId) {
      user = await prisma.user.findUnique({ where: { id: record.userId } });
    } else if (record.email) {
      user = await prisma.user.findFirst({ where: { email: { equals: record.email.toLowerCase(), mode: 'insensitive' } } });
    } else if (record.phone) {
      user = await prisma.user.findFirst({ where: { phone: record.phone } });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Clean up used OTP
    otpStore.delete(user.id);
    if (user.email) otpStore.delete(user.email.toLowerCase());
    if (user.phone) otpStore.delete(user.phone);

    res.status(200).json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
