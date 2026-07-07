import http from 'http';

const data = JSON.stringify({
  email: 'newdriver2@test.com',
  password: 'password123',
  phone: '0711122244',
  fullName: 'New Driver 2',
  nic: '888888888V', // Same NIC as before!
  licenseNumber: 'B8888889',
  busRegNumber: 'ND-8889'
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
