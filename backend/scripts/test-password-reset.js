/**
 * Test script for password reset and change password functionality
 * 
 * Usage: node scripts/test-password-reset.js
 */

const dotenv = require('dotenv');
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_SECRET_KEY;

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const NEW_PASSWORD = 'newpassword456';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    data,
  };
}

async function testForgotPassword() {
  console.log('\n🔍 Testing Forgot Password...');
  console.log('Endpoint: POST /api/auth/forgot-password');
  console.log('Email:', TEST_EMAIL);
  
  const result = await makeRequest('/api/auth/forgot-password', 'POST', {
    email: TEST_EMAIL,
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200) {
    console.log('✅ Forgot password request successful!');
    console.log('📧 Check your email for the reset link');
  } else {
    console.log('❌ Forgot password request failed');
  }
  
  return result;
}

async function testResetPassword(token) {
  console.log('\n🔍 Testing Reset Password...');
  console.log('Endpoint: POST /api/auth/reset-password');
  console.log('Email:', TEST_EMAIL);
  console.log('Token:', token);
  console.log('New Password: ********');
  
  const result = await makeRequest('/api/auth/reset-password', 'POST', {
    email: TEST_EMAIL,
    token: token,
    newPassword: NEW_PASSWORD,
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200) {
    console.log('✅ Password reset successful!');
  } else {
    console.log('❌ Password reset failed');
  }
  
  return result;
}

async function testLogin(password) {
  console.log('\n🔍 Testing Login...');
  console.log('Endpoint: POST /api/auth/login');
  console.log('Email:', TEST_EMAIL);
  console.log('Password: ********');
  
  const result = await makeRequest('/api/auth/login', 'POST', {
    email: TEST_EMAIL,
    password: password,
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200 && result.data.token) {
    console.log('✅ Login successful!');
    return result.data.token;
  } else {
    console.log('❌ Login failed');
    return null;
  }
}

async function testChangePassword(token, currentPassword, newPassword) {
  console.log('\n🔍 Testing Change Password...');
  console.log('Endpoint: POST /api/auth/change-password');
  console.log('Current Password: ********');
  console.log('New Password: ********');
  
  const result = await makeRequest('/api/auth/change-password', 'POST', {
    currentPassword: currentPassword,
    newPassword: newPassword,
  });
  
  // Add auth token to headers for this request
  const headers = {
    'x-api-key': API_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      currentPassword: currentPassword,
      newPassword: newPassword,
    }),
  });
  
  const data = await response.json();
  
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (response.status === 200) {
    console.log('✅ Password changed successfully!');
  } else {
    console.log('❌ Password change failed');
  }
  
  return { status: response.status, data };
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 Password Reset & Change Password Test Suite');
  console.log('='.repeat(60));
  
  if (!API_KEY) {
    console.error('❌ API_SECRET_KEY not found in environment variables');
    return;
  }
  
  console.log('Configuration:');
  console.log('- API Base URL:', API_BASE_URL);
  console.log('- API Key:', API_KEY.substring(0, 10) + '...');
  console.log('- Test Email:', TEST_EMAIL);
  
  try {
    // Test 1: Forgot Password
    await testForgotPassword();
    
    console.log('\n📝 Next Steps:');
    console.log('1. Check the email inbox for', TEST_EMAIL);
    console.log('2. Copy the reset token from the email link');
    console.log('3. Run: node scripts/test-password-reset.js <token>');
    console.log('\nOr test change password:');
    console.log('4. Login first to get auth token');
    console.log('5. Use the token to test change password endpoint');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Check if token provided as command line argument
const token = process.argv[2];

if (token) {
  // If token provided, test reset password
  testResetPassword(token)
    .then(() => {
      console.log('\n✅ Test completed. Try logging in with new password.');
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
    });
} else {
  // Otherwise run full test suite
  runTests();
}
