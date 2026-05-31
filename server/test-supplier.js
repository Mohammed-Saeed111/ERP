const BASE = 'http://localhost:5000';
const ADMIN = { email: 'admin@gmail.com', password: 'admin' };

const log = (title, data) => {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(data, null, 2));
};

const parseResponse = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: res.status, text };
  }
};

const run = async () => {
  try {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN),
    });
    const loginJson = await parseResponse(loginRes);
    log('Login response', loginJson);

    if (!loginJson?.success || !loginJson?.token) {
      console.error('Login failed, aborting tests');
      return;
    }

    const authHeader = {
      Authorization: `Bearer ${loginJson.token}`,
      'Content-Type': 'application/json',
    };

    const newSupplier = {
      name: 'Test Supplier',
      email: `supplier-${Date.now()}@example.com`,
      number: '0123456789',
      address: '123 Test Lane',
    };

    const addRes = await fetch(`${BASE}/api/supplier/add`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(newSupplier),
    });
    const addJson = await parseResponse(addRes);
    log('Add supplier response', addJson);

    const getRes = await fetch(`${BASE}/api/supplier`, { headers: authHeader });
    const getJson = await parseResponse(getRes);
    log('Get suppliers response', getJson);

    const createdSupplier = addJson?.supplier || getJson?.suppliers?.[0];
    if (!createdSupplier?._id) {
      console.error('No supplier created, stopping update/delete tests');
      return;
    }

    const updatedRes = await fetch(`${BASE}/api/supplier/${createdSupplier._id}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ ...createdSupplier, name: 'Updated Test Supplier' }),
    });
    const updatedJson = await parseResponse(updatedRes);
    log('Update supplier response', updatedJson);

    const deleteRes = await fetch(`${BASE}/api/supplier/${createdSupplier._id}`, {
      method: 'DELETE',
      headers: authHeader,
    });
    const deleteJson = await parseResponse(deleteRes);
    log('Delete supplier response', deleteJson);
  } catch (error) {
    console.error('Test runner error', error);
  }
};

run();
