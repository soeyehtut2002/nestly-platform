process.env.NODE_ENV = 'test';
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const makeGetRequest = (path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.end();
  });
};

const makePostRequest = (path, body, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.write(postData);
    req.end();
  });
};

async function main() {
  console.log('Starting Nestly Security & Verification Flow Tests...');
  let testEmail = 'test_user_' + Date.now() + '@nestly.com';
  let testPassword = 'Password12345';
  let newPassword = 'NewPassword12345';
  
  try {
    const condosRes = await makeGetRequest('/api/auth/condos');
    if (condosRes.status !== 200 || !condosRes.body.length) {
      throw new Error('Failed to fetch condominiums dynamically.');
    }
    const regentHome = condosRes.body.find(c => c.name.includes('Regent'));
    if (!regentHome) {
      throw new Error('Regent Home Bangna not found in condos list.');
    }
    let condoId = regentHome.id;
    // 1. Register a new user
    console.log('\n[STEP 1] Registering a new unverified user...');
    const regRes = await makePostRequest('/api/auth/register', {
      email: testEmail,
      password: testPassword,
      fullName: 'Test User',
      roomNumber: '101/A',
      pdpaConsent: true
    }, { 'X-Condo-ID': condoId });

    console.log(`[TEST] Register Status: ${regRes.status}. Expected: 201`);
    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    }
    console.log('User registered successfully (unverified).');

    // 2. Try to login (should fail because email is unverified)
    console.log('\n[STEP 2] Attempting login before email verification...');
    const loginFailRes = await makePostRequest('/api/auth/login', {
      email: testEmail,
      password: testPassword
    }, { 'X-Condo-ID': condoId });

    console.log(`[TEST] Login Fail Status: ${loginFailRes.status}. Expected: 403`);
    if (loginFailRes.status !== 403) {
      throw new Error(`Login should have been blocked but returned status ${loginFailRes.status}`);
    }
    console.log('Login correctly blocked due to unverified email.');

    // 3. Retrieve verification token from DB
    console.log('\n[STEP 3] Retrieving email verification token from database...');
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!dbUser) {
      throw new Error('User record not found in database.');
    }
    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { userId: dbUser.id }
    });
    if (!tokenRecord) {
      throw new Error('Verification token not found in database.');
    }
    console.log(`Retrieved token: ${tokenRecord.token}`);

    // 4. Verify email using the token
    console.log('\n[STEP 4] Submitting verification token...');
    const verifyRes = await makePostRequest('/api/auth/verify-email', {
      token: tokenRecord.token
    });

    console.log(`[TEST] Verification Status: ${verifyRes.status}. Expected: 200`);
    if (verifyRes.status !== 200) {
      throw new Error(`Email verification failed: ${JSON.stringify(verifyRes.body)}`);
    }
    console.log('Email verified successfully.');

    // 5. Try logging in again (should succeed)
    console.log('\n[STEP 5] Logging in after email verification...');
    const loginSuccessRes = await makePostRequest('/api/auth/login', {
      email: testEmail,
      password: testPassword
    }, { 'X-Condo-ID': condoId });

    console.log(`[TEST] Login Success Status: ${loginSuccessRes.status}. Expected: 200`);
    if (loginSuccessRes.status !== 200) {
      throw new Error(`Login failed after verification: ${JSON.stringify(loginSuccessRes.body)}`);
    }
    console.log('Login successful! Received Access Token.');

    // 6. Test Forgot Password
    console.log('\n[STEP 6] Requesting a password reset link...');
    const forgotRes = await makePostRequest('/api/auth/forgot-password', {
      email: testEmail
    }, { 'X-Condo-ID': condoId });

    console.log(`[TEST] Forgot Password Status: ${forgotRes.status}. Expected: 200`);
    if (forgotRes.status !== 200) {
      throw new Error(`Forgot password query failed: ${JSON.stringify(forgotRes.body)}`);
    }
    console.log('Forgot password email logged successfully.');

    // 7. Retrieve password reset token from DB
    console.log('\n[STEP 7] Retrieving reset token from database...');
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: dbUser.id }
    });
    if (!resetRecord) {
      throw new Error('Reset token not found in database.');
    }
    console.log(`Retrieved reset token: ${resetRecord.token}`);

    // 8. Submit new password
    console.log('\n[STEP 8] Submitting new password reset...');
    const resetRes = await makePostRequest('/api/auth/reset-password', {
      token: resetRecord.token,
      newPassword: newPassword
    });

    console.log(`[TEST] Reset Password Status: ${resetRes.status}. Expected: 200`);
    if (resetRes.status !== 200) {
      throw new Error(`Password reset failed: ${JSON.stringify(resetRes.body)}`);
    }
    console.log('Password updated successfully.');

    // 9. Login with old password (should fail)
    console.log('\n[STEP 9] Attempting login with old password...');
    const oldLoginRes = await makePostRequest('/api/auth/login', {
      email: testEmail,
      password: testPassword
    }, { 'X-Condo-ID': condoId });

    console.log(`[TEST] Old Password Login Status: ${oldLoginRes.status}. Expected: 401`);
    if (oldLoginRes.status !== 401) {
      throw new Error(`Login with old password should have been blocked but returned ${oldLoginRes.status}`);
    }
    console.log('Login with old password successfully blocked.');

    // 10. Login with new password (should succeed)
    console.log('\n[STEP 10] Attempting login with new password...');
    const newLoginRes = await makePostRequest('/api/auth/login', {
      email: testEmail,
      password: newPassword
    }, { 'X-Condo-ID': condoId });

    console.log(`[TEST] New Password Login Status: ${newLoginRes.status}. Expected: 200`);
    if (newLoginRes.status !== 200) {
      throw new Error(`Login with new password failed: ${JSON.stringify(newLoginRes.body)}`);
    }
    console.log('Login with new password succeeded! Hashing and verification rotated successfully.');

    console.log('\nSUCCESS: All Nestly security flow verification tests passed!');
  } catch (error) {
    console.error('\nFAILURE: Security flow tests failed!', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
