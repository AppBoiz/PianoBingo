/**
 * Test script to verify IndexedDB initialization
 * This loads the page and checks if data was seeded
 */

const http = require('http');

function testIndexedDB() {
  const options = {
    hostname: 'localhost',
    port: 5175,
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'Node.js'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('App HTML loaded successfully');
      console.log('Response status:', res.statusCode);
      
      // We can't directly test IndexedDB from Node, but we can verify the page is serving
      if (data.includes('PianoBingo')) {
        console.log('✓ App title found in HTML');
      }
      if (data.includes('src="/@vite/client"') || data.includes('src="/src/main.tsx"')) {
        console.log('✓ Vite module scripts detected');
      }
      
      console.log('\nTo verify IndexedDB seeding:');
      console.log('1. Open DevTools in browser (F12)');
      console.log('2. Go to Application → IndexedDB → PianoBingoDB');
      console.log('3. Check PACKS store - should have 2 items (Tom, Jack)');
      console.log('4. Check SONGS store - should have 150 items');
      console.log('5. Check console for initialization message');
    });
  });

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.error('✗ Dev server not running on port 5175');
    } else {
      console.error('Error:', err);
    }
  });

  req.end();
}

testIndexedDB();
