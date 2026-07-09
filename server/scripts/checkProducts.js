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

function getProducts(token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };

    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: d });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    const login = await postLogin();
    console.log('LOGIN_RESPONSE', JSON.stringify(login));
    if (!login.token) {
      console.error('No token in login response');
      process.exit(1);
    }
    const products = await getProducts(login.token);
    console.log('PRODUCTS_RESPONSE', products.status, products.body);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
