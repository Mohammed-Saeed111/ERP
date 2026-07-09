const http = require('http');

function postLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'admin@gmail.com', password: 'admin' });
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getPath(token, path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    };

    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    const login = await postLogin();
    console.log('LOGIN_RESPONSE', login);
    if (!login.token) return console.error('No token');
    const categories = await getPath(login.token, '/api/category');
    console.log('CATEGORIES', categories.status, categories.body);
    const suppliers = await getPath(login.token, '/api/supplier');
    console.log('SUPPLIERS', suppliers.status, suppliers.body);
  } catch (e) {
    console.error(e);
  }
})();
