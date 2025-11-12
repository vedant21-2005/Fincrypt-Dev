const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config(); // ✅ Load env variables

const app = express();
app.use(express.json());
app.use(cors());

// ✅ MongoDB connection using env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Atlas connection error:', err));

// ✅ Schema
const userSchema = new mongoose.Schema({
  officialEmail: String,
  aadharCard: String,
  name: String,
  course: String,
  phoneNumber: String,
  password: String
});

const User = mongoose.model('Users', userSchema);

// ✅ Register route
app.post('/register', async (req, res) => {
  const { officialEmail, aadharCard, name, course, phoneNumber, newPassword } = req.body;

  if (!officialEmail || !aadharCard || !name || !course || !phoneNumber || !newPassword) {
    return res.status(400).send({ message: 'Missing required fields' });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    const user = new User({
      officialEmail,
      aadharCard,
      name,
      course,
      phoneNumber,
      password: hashedPassword
    });

    await user.save();
    res.send({ message: 'Registration successful' });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).send({ message: 'A server error occurred! Please try again.' });
  }
});

// ✅ Login route
app.post('/login', async (req, res) => {
  const { officialEmail, password } = req.body;

  try {
    const user = await User.findOne({ officialEmail });
    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ message: 'Invalid email or password' });
    }

    res.status(200).send({
      message: 'Login successful',
      user: {
        officialEmail: user.officialEmail,
        name: user.name,
        aadharCard: user.aadharCard,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send({ message: 'Error logging in' });
  }
});

// ✅ Get admin details by email
app.get('/api/admin/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const admin = await User.findOne({ officialEmail: email });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      name: admin.name,
      officialEmail: admin.officialEmail,
      aadharCard: admin.aadharCard,
      course: admin.course,
      phoneNumber: admin.phoneNumber
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Send OTP
app.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || phoneNumber.length !== 10) {
    return res.status(400).json({ message: 'Invalid phone number' });
  }

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${phoneNumber}/AUTOGEN/Fincrypt_Verification`
    );

    if (response.data.Status === 'Success') {
      res.status(200).json({
        message: 'OTP sent successfully!',
        sessionId: response.data.Details,
      });
    } else {
      res.status(400).json({ message: 'Failed to send OTP', details: response.data });
    }
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
});

// ✅ Verify OTP
app.post('/verify-otp', async (req, res) => {
  const { sessionId, otp } = req.body;

  if (!sessionId || !otp) {
    return res.status(400).json({ message: 'Session ID or OTP missing' });
  }

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`
    );

    if (response.data.Status === 'Success') {
      res.status(200).json({ verified: true, message: 'OTP verified successfully!' });
    } else {
      res.status(400).json({ verified: false, message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    res.status(500).json({ message: 'Server error while verifying OTP' });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
