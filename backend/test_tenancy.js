const http = require('http');

const makeRequest = (path, headers = {}) => {
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
          if (res.statusCode !== 200) {
            reject(new Error(`Server returned status code ${res.statusCode}: ${data}`));
            return;
          }
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.end();
  });
};

async function main() {
  console.log('Starting Nestly Tenancy Verification Tests...');
  try {
    // 1. Fetch active condominiums dynamically
    const condos = await makeRequest('/api/auth/condos');
    console.log(`[TEST] Found ${condos.length} active condominiums in registry.`);

    if (condos.length < 2) {
      throw new Error('Test requires at least 2 condominiums in the database.');
    }

    const regentHome = condos.find(c => c.name.includes('Regent'));
    const ideoMobi = condos.find(c => c.name.includes('Ideo'));

    if (!regentHome || !ideoMobi) {
      throw new Error('Seed condominiums not found in registry.');
    }

    // 2. Query listings for Regent Home Bangna (should contain brownies & errand = 2 listings)
    // Wait, since we reclassified brownies to 'food', they are still listings under this condo!
    const regentListings = await makeRequest('/api/listings', { 'X-Condo-ID': regentHome.id.toString() });
    console.log(`[TEST] "${regentHome.name}" (ID ${regentHome.id}): Received ${regentListings.length} listings. (Expected: 2)`);
    if (regentListings.length !== 2) {
      throw new Error(`Regent Home listing count mismatch. Got ${regentListings.length}`);
    }

    // 3. Query listings for Ideo Mobi Sukhumvit (should contain air-con cleaning = 1 listing)
    const ideoListings = await makeRequest('/api/listings', { 'X-Condo-ID': ideoMobi.id.toString() });
    console.log(`[TEST] "${ideoMobi.name}" (ID ${ideoMobi.id}): Received ${ideoListings.length} listings. (Expected: 1)`);
    if (ideoListings.length !== 1) {
      throw new Error(`Ideo Mobi listing count mismatch. Got ${ideoListings.length}`);
    }

    console.log('SUCCESS: Tenancy isolation verification tests passed!');
  } catch (error) {
    console.error('FAILURE: Tenancy verification tests failed!', error.message);
    process.exit(1);
  }
}

main();
