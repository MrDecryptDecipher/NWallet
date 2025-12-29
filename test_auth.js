import fetch from 'node-fetch';

async function testAuth() {
  console.log(' Starting Auth System Test...');
  const API_URL = 'http://localhost:3001/api';
  const testUser = {
    email: 'test_' + Date.now() + '@example.com',
    password: 'password123',
    walletData: { mnemonic: 'test mnemonic words here' }
  };

  try {
    // 1. Register
    console.log(`\n1. Testing Registration for ${testUser.email}...`);
    const regRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    
    if (regRes.ok && regData.success) {
      console.log(' Registration Successful:', regData);
    } else {
      console.error(' Registration Failed:', regData);
      process.exit(1);
    }

    // 2. Login
    console.log(`\n2. Testing Login for ${testUser.email}...`);
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const loginData = await loginRes.json();

    if (loginRes.ok && loginData.success) {
       console.log(' Login Successful!');
       console.log(' Retrieved Wallet Data:', loginData.walletData);
    } else {
       console.error(' Login Failed:', loginData);
       process.exit(1);
    }

    console.log('\n All System Tests Passed!');

  } catch (error) {
    console.error(' Test Execution Error:', error);
    process.exit(1);
  }
}

testAuth();