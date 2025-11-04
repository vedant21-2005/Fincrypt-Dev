import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import './NewRegStyle.css';

function Signup() {
  const [userData, setUserData] = useState({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const history = useHistory();

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (confirmPassword !== userData.newPassword) {
      alert('Passwords do not match');
      return;
    }
    axios
      .post('http://127.0.0.1:5001/register', userData)
      .then((response) => {
        alert(response.data.message);
        setUserData({});
        setConfirmPassword('');
        history.push('/'); // redirect to login page
      })
      .catch((error) => {
        console.error(error);
        alert('Error registering user');
      });
  };

  const handleLoginRedirect = () => {
    history.push('/'); // redirect to login page
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create Your Account</h2>
        <p className="auth-subtitle">Register to access secure online voting</p>

        <form onSubmit={handleFormSubmit} className="auth-form">
          <label>Official Email</label>
          <input
            type="email"
            name="officialEmail"
            placeholder="Enter your official email"
            onChange={handleInputChange}
            required
          />

          <label>Student ID</label>
          <input
            type="text"
            name="studentID"
            placeholder="Enter your student ID"
            onChange={handleInputChange}
            required
          />

          <label>Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            onChange={handleInputChange}
            required
          />

          <label>Course</label>
          <input
            type="text"
            name="course"
            placeholder="Enter your course"
            onChange={handleInputChange}
            required
          />

          <label>University Roll Number</label>
          <input
            type="text"
            name="universityRollno"
            placeholder="Enter your roll number"
            onChange={handleInputChange}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            placeholder="Create a password"
            onChange={handleInputChange}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
          />

          <button type="submit" className="btn-primary">
            Register
          </button>
        </form>

        <p className="auth-footer">
          Already registered?{' '}
          <button type="button" onClick={handleLoginRedirect} className="link-login">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
