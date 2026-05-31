const urls = [
  'http://localhost:5000/api/supplier/debug',
  'http://localhost:5000/api/supplier'
];

(async () => {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log('URL:', url);
      console.log('status', res.status);
      console.log('headers', Object.fromEntries(res.headers.entries()));
      console.log('body', text);
      console.log('---');
    } catch (err) {
      console.error('fetch error', url, err);
    }
  }

  try {
    const res = await fetch('http://localhost:5000/api/supplier/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', number: '123456', address: 'Addr' }),
    });
    const text = await res.text();
    console.log('URL: http://localhost:5000/api/supplier/add');
    console.log('status', res.status);
    console.log('body', text);
  } catch (err) {
    console.error('fetch error POST', err);
  }
})();
