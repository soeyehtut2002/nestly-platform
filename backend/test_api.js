process.env.NODE_ENV = 'test';
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const makeGetRequest = (path, headers = {}) => {
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
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.end();
  });
};

const makePostRequest = (path, body, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.write(postData);
    req.end();
  });
};

const makePutRequest = (path, body, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.write(postData);
    req.end();
  });
};

const makeDeleteRequest = (path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path,
      method: 'DELETE',
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
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.end();
  });
};

async function main() {
  console.log('Starting Nestly Phase 6 Integration Tests...');
  let somchaiToken = '';
  let kanyaToken = '';
  let regentCondoId = '';
  let kanyaSellerId = '';
  let activeListingId = '';
  let testReviewId = '';
  let testNotificationId = '';

  try {
    // Resolve Regent Condo ID first
    const condosRes = await makeGetRequest('/api/auth/condos');
    if (condosRes.status !== 200 || !condosRes.body.length) {
      throw new Error(`Failed to fetch condominiums: ${JSON.stringify(condosRes.body)}`);
    }
    const regentHome = condosRes.body.find(c => c.name.includes('Regent'));
    if (!regentHome) {
      throw new Error('Regent Home Bangna not found in condos registry.');
    }
    regentCondoId = regentHome.id;

    // 1. Authenticate users
    console.log('\n[TEST 1] Logging in test accounts...');
    const loginSomchai = await makePostRequest('/api/auth/login', {
      email: 'somchai@nestly.com',
      password: 'resident12345'
    }, { 'X-Condo-ID': regentCondoId });
    
    if (loginSomchai.status !== 200) {
      throw new Error(`Somchai login failed: ${JSON.stringify(loginSomchai.body)}`);
    }
    somchaiToken = `Bearer ${loginSomchai.body.token}`;

    const loginKanya = await makePostRequest('/api/auth/login', {
      email: 'kanya@nestly.com',
      password: 'seller12345'
    }, { 'X-Condo-ID': regentCondoId });
    
    if (loginKanya.status !== 200) {
      throw new Error(`Kanya login failed: ${JSON.stringify(loginKanya.body)}`);
    }
    kanyaToken = `Bearer ${loginKanya.body.token}`;

    // Get Kanya seller profile to get her seller ID
    const kanyaProfile = await makeGetRequest('/api/sellers/profile', {
      'Authorization': kanyaToken
    });
    kanyaSellerId = kanyaProfile.body.id;
    console.log(`Authenticated. Somchai Token acquired. Kanya Seller ID: ${kanyaSellerId}`);

    // Get listings of Regent condo to find an active listing ID
    const listingsRes = await makeGetRequest('/api/listings', {
      'X-Condo-ID': regentCondoId
    });
    if (!listingsRes.body.length) {
      throw new Error('No listings found to test favorites.');
    }
    activeListingId = listingsRes.body[0].id;
    console.log(`Active Listing ID retrieved: ${activeListingId}`);

    // 2. Profile Management
    console.log('\n[TEST 2] Profile Management Tests...');
    // GET Profile
    const profileRes = await makeGetRequest('/api/users/profile', { 'Authorization': somchaiToken });
    if (profileRes.status !== 200 || profileRes.body.email !== 'somchai@nestly.com') {
      throw new Error(`Profile retrieval failed: ${JSON.stringify(profileRes.body)}`);
    }
    console.log('✔ GET Profile passed.');

    // PUT Profile (valid)
    const updateRes = await makePutRequest('/api/users/profile', {
      fullName: 'Somchai Updated',
      phoneNumber: '0999999999'
    }, { 'Authorization': somchaiToken });
    if (updateRes.status !== 200 || updateRes.body.user.fullName !== 'Somchai Updated') {
      throw new Error(`Profile update failed: ${JSON.stringify(updateRes.body)}`);
    }
    console.log('✔ PUT Profile (valid) passed.');

    // PUT Profile (invalid Zod validation)
    const badUpdateRes = await makePutRequest('/api/users/profile', {
      fullName: 'S' // min 2 length
    }, { 'Authorization': somchaiToken });
    if (badUpdateRes.status !== 400 || !badUpdateRes.body.details) {
      throw new Error(`Profile validation guard failed: ${JSON.stringify(badUpdateRes.body)}`);
    }
    console.log('✔ Zod validation guard on PUT Profile passed.');

    // POST Avatar URL
    const avatarRes = await makePostRequest('/api/users/avatar', {
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'
    }, { 'Authorization': somchaiToken });
    if (avatarRes.status !== 200 || avatarRes.body.user.avatarUrl !== 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde') {
      throw new Error(`Avatar upload failed: ${JSON.stringify(avatarRes.body)}`);
    }
    console.log('✔ POST Avatar URL passed.');

    // 3. Favorites CRUD
    console.log('\n[TEST 3] Favorites Endpoints...');
    // Toggle Favorite (Add)
    const favAdd = await makePostRequest(`/api/listings/${activeListingId}/favorite`, {}, { 'Authorization': somchaiToken });
    if (favAdd.status !== 200 || favAdd.body.favorited !== true) {
      throw new Error(`Adding favorite failed: ${JSON.stringify(favAdd.body)}`);
    }
    console.log('✔ Toggle favorite (Add) passed.');

    // Get Favorites list
    const favsList = await makeGetRequest('/api/listings/favorites', { 'Authorization': somchaiToken });
    if (favsList.status !== 200 || !favsList.body.some(l => l.id === activeListingId)) {
      throw new Error(`Listing was not in favorites: ${JSON.stringify(favsList.body)}`);
    }
    console.log('✔ GET Favorites list passed.');

    // Toggle Favorite (Remove)
    const favRemove = await makePostRequest(`/api/listings/${activeListingId}/favorite`, {}, { 'Authorization': somchaiToken });
    if (favRemove.status !== 200 || favRemove.body.favorited !== false) {
      throw new Error(`Removing favorite failed: ${JSON.stringify(favRemove.body)}`);
    }
    console.log('✔ Toggle favorite (Remove) passed.');

    // Verify empty
    const favsListEmpty = await makeGetRequest('/api/listings/favorites', { 'Authorization': somchaiToken });
    if (favsListEmpty.body.some(l => l.id === activeListingId)) {
      throw new Error('Listing was not correctly removed from favorites.');
    }
    console.log('✔ Verification of favorite removal passed.');

    // 4. Reviews Management
    console.log('\n[TEST 4] Reviews CRUD...');
    // A seller cannot review themselves
    const selfReview = await makePostRequest('/api/reviews', {
      sellerId: kanyaSellerId,
      rating: 5,
      reviewText: 'Awesome!'
    }, { 'Authorization': kanyaToken });
    if (selfReview.status !== 400) {
      throw new Error(`Self-review guard failed: status code ${selfReview.status}`);
    }
    console.log('✔ Self-review blocking guard passed.');

    // Somchai reviews Kanya (valid)
    const reviewRes = await makePostRequest('/api/reviews', {
      sellerId: kanyaSellerId,
      rating: 5,
      reviewText: 'Somchai thinks kanya sweets are amazing!'
    }, { 'Authorization': somchaiToken });
    if (reviewRes.status !== 201) {
      throw new Error(`Creating review failed: ${JSON.stringify(reviewRes.body)}`);
    }
    testReviewId = reviewRes.body.review.id;
    console.log('✔ Create Review passed.');

    // Edit Review
    const editReviewRes = await makePutRequest(`/api/reviews/${testReviewId}`, {
      rating: 4,
      reviewText: 'Actually it was 4 stars.'
    }, { 'Authorization': somchaiToken });
    if (editReviewRes.status !== 200 || editReviewRes.body.review.rating !== 4) {
      throw new Error(`Editing review failed: ${JSON.stringify(editReviewRes.body)}`);
    }
    console.log('✔ Edit Review passed.');

    // Delete Review
    const deleteReviewRes = await makeDeleteRequest(`/api/reviews/${testReviewId}`, { 'Authorization': somchaiToken });
    if (deleteReviewRes.status !== 200) {
      throw new Error(`Deleting review failed: ${JSON.stringify(deleteReviewRes.body)}`);
    }
    console.log('✔ Delete Review passed.');

    // 5. Notifications
    console.log('\n[TEST 5] Notifications Endpoints...');
    // Seed a notification for testing
    const seededNotif = await prisma.notification.create({
      data: {
        userId: profileRes.body.id,
        title: 'Test Notification',
        message: 'This is a test notification.',
        type: 'system'
      }
    });
    testNotificationId = seededNotif.id;

    // Get notifications
    const getNotifs = await makeGetRequest('/api/notifications', { 'Authorization': somchaiToken });
    if (getNotifs.status !== 200 || !getNotifs.body.some(n => n.id === testNotificationId)) {
      throw new Error(`Get notifications failed: ${JSON.stringify(getNotifs.body)}`);
    }
    console.log('✔ GET Notifications passed.');

    // Mark specific notification as read
    const readNotif = await makePutRequest(`/api/notifications/${testNotificationId}/read`, {}, { 'Authorization': somchaiToken });
    if (readNotif.status !== 200 || readNotif.body.notification.isRead !== true) {
      throw new Error(`Marking read failed: ${JSON.stringify(readNotif.body)}`);
    }
    console.log('✔ Mark Single Notification Read passed.');

    // Mark all notifications as read
    const readAllNotifs = await makePutRequest('/api/notifications/read-all', {}, { 'Authorization': somchaiToken });
    if (readAllNotifs.status !== 200) {
      throw new Error(`Marking all read failed: ${JSON.stringify(readAllNotifs.body)}`);
    }
    console.log('✔ Mark All Notifications Read passed.');

    // Clean up test notification
    await prisma.notification.delete({
      where: { id: testNotificationId }
    });

    console.log('\nSUCCESS: All Nestly REST API integration tests passed successfully!');
  } catch (error) {
    console.error('\nERROR: Integration test run failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
