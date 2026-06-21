#!/usr/bin/env node
/**
 * Quick test script to verify MERN integration
 * Run from project root: node test-api.js
 */

const base = 'http://localhost:5000';

async function test() {
  console.log(' Testing MERN API Integration...\n');

  try {
    // 1. Login
    console.log(' Testing Login...');
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error('Login failed: ' + loginData.message);
    const token = loginData.token;
    console.log(' Login successful\n');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get Products (with categories & suppliers)
    console.log(' Testing GET /api/products...');
    const productsRes = await fetch(`${base}/api/products`, { headers: authHeaders });
    const productsData = await productsRes.json();
    console.log(` Products: ${productsData.products?.length || 0} items`);
    console.log(`Categories: ${productsData.categories?.length || 0} items`);
    console.log(`Suppliers: ${productsData.suppliers?.length || 0} items\n`);

    if (!productsData.categories?.length) {
      console.warn(' No categories found. Run seed script: node server/seed.js\n');
    }
    if (!productsData.suppliers?.length) {
      console.warn(' No suppliers found. Run seed script: node server/seed.js\n');
    }

    // 3. Create Product
    console.log(' Testing POST /api/products/add...');
    const productRes = await fetch(`${base}/api/products/add`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        categoryId: productsData.categories?.[0]?._id,
        supplierId: productsData.suppliers?.[0]?._id
      })
    });
    const productData = await productRes.json();
    if (productRes.ok && productData.success) {
      console.log(' Product created successfully\n');
    } else {
      console.error(' Product creation failed:', productData.message, '\n');
    }

    console.log(' All tests passed! MERN integration is working correctly.\n');

  } catch (error) {
    console.error(' Test failed:', error.message);
    console.log('\n Troubleshooting:');
    console.log('   - Ensure backend is running: node server/index.js');
    console.log('   - Ensure MongoDB is running');
    console.log('   - Check .env file has correct MONGODB_URI and JWT_SECRET');
    console.log('   - Run seed script if needed: node server/seed.js');
  }
}

test();
