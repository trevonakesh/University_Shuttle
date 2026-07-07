import http from 'http';

const data = JSON.stringify({
  email: 'newdriver@test.com',
  password: 'password123',
  phone: '0711122233',
  fullName: 'New Driver',
  nic: '888888888V',
  licenseNumber: 'B8888888',
  busRegNumber: 'ND-8888'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register/driver',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', body);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
