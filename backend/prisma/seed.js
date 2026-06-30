const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  // Check if database is already seeded to prevent data loss on auto-deploys
  const condoCount = await prisma.condominium.count();
  if (condoCount > 0) {
    console.log('Database already contains condominium records. Skipping seeding to protect existing user data.');
    return;
  }

  console.log('Seeding Nestly PostgreSQL Database (Multi-Tenant)...');

  // 1. Clean existing records (new models first due to foreign key constraints)
  await prisma.notification.deleteMany({});
  await prisma.sellerVerification.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.foodMenu.deleteMany({});
  await prisma.foodOrder.deleteMany({});
  await prisma.serviceBooking.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.lostFound.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.adBanner.deleteMany({});
  
  // Existing models
  await prisma.moduleSetting.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.parcel.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.chat.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.condominium.deleteMany({});

  // 2. Onboard Condominiums
  const regentHome = await prisma.condominium.create({
    data: {
      name: 'Regent Home Bangna',
      address: 'Sukhumvit 103, Bang Na',
      province: 'Bangkok'
    }
  });

  const ideoMobi = await prisma.condominium.create({
    data: {
      name: 'Ideo Mobi Sukhumvit',
      address: 'Sukhumvit Road, Bang Na',
      province: 'Bangkok'
    }
  });
  console.log('Condominiums onboarded: Regent Home Bangna (ID:', regentHome.id, '), Ideo Mobi (ID:', ideoMobi.id, ')');

  // 3. Hash passwords using Argon2id
  const adminPasswordHash = await argon2.hash('admin12345', { type: argon2.argon2id });
  const residentPasswordHash = await argon2.hash('resident12345', { type: argon2.argon2id });
  const sellerPasswordHash = await argon2.hash('seller12345', { type: argon2.argon2id });

  // 4. Create Users for Regent Home Bangna
  const nokAdmin = await prisma.user.create({
    data: {
      condominiumId: regentHome.id,
      email: 'admin@nestly.com',
      passwordHash: adminPasswordHash,
      fullName: 'Nok Moderator',
      roomNumber: 'Admin-A',
      phoneNumber: '0899999999',
      role: 'SYSTEM_ADMIN',
      pdpaConsent: true,
      isEmailVerified: true
    }
  });

  const somchaiBuyer = await prisma.user.create({
    data: {
      condominiumId: regentHome.id,
      email: 'somchai@nestly.com',
      passwordHash: residentPasswordHash,
      fullName: 'Somchai Saetang',
      roomNumber: '402/89',
      phoneNumber: '0812345678',
      role: 'RESIDENT',
      pdpaConsent: true,
      isEmailVerified: true
    }
  });

  const kanyaSeller = await prisma.user.create({
    data: {
      condominiumId: regentHome.id,
      email: 'kanya@nestly.com',
      passwordHash: sellerPasswordHash,
      fullName: 'Kanya Sompong',
      roomNumber: '305/112',
      phoneNumber: '0823456789',
      role: 'SELLER',
      pdpaConsent: true,
      isEmailVerified: true
    }
  });

  const kanyaProfile = await prisma.seller.create({
    data: {
      condominiumId: regentHome.id,
      userId: kanyaSeller.id,
      shopName: "Kanya's Condo Kitchen & Sweets",
      verificationStatus: 'APPROVED',
      idCardUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
      proofOfResidencyUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
      agreementSigned: true,
      agreementSignedAt: new Date(),
      verifiedAt: new Date(),
      verifiedBy: nokAdmin.id
    }
  });

  // Create listings for Kanya (Regent Home)
  await prisma.listing.create({
    data: {
      condominiumId: regentHome.id,
      sellerId: kanyaProfile.id,
      title: 'Homemade Fudge Brownies (6 Pieces)',
      description: 'Baked fresh in building B. 100% organic cocoa, rich fudge centers. Pickup or elevator delivery available today.',
      price: 150.00,
      category: 'food',
      images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c'],
      status: 'ACTIVE',
      legalAffirmation: true
    }
  });

  await prisma.listing.create({
    data: {
      condominiumId: regentHome.id,
      sellerId: kanyaProfile.id,
      title: 'Need 7-Eleven Run - Buy 2 Milk Bottles',
      description: 'Quick errand request: Please purchase two large bottles of pasteurized milk from the gate 7-Eleven and deliver to building B, floor 5. Payment in cash.',
      price: 40.00,
      category: 'runner',
      images: ['https://images.unsplash.com/photo-1542838132-92c53300491e'],
      status: 'ACTIVE',
      legalAffirmation: true
    }
  });

  // 5. Create Users for Ideo Mobi
  const veeraBuyer = await prisma.user.create({
    data: {
      condominiumId: ideoMobi.id,
      email: 'veera@nestly.com',
      passwordHash: residentPasswordHash,
      fullName: 'Veera Kittisup',
      roomNumber: '1008/14',
      phoneNumber: '0834567890',
      role: 'RESIDENT',
      pdpaConsent: true,
      isEmailVerified: true
    }
  });

  const wipaSeller = await prisma.user.create({
    data: {
      condominiumId: ideoMobi.id,
      email: 'wipa@nestly.com',
      passwordHash: sellerPasswordHash,
      fullName: 'Wipa Rakdee',
      roomNumber: '1012/99',
      phoneNumber: '0845678901',
      role: 'SELLER',
      pdpaConsent: true,
      isEmailVerified: true
    }
  });

  const wipaProfile = await prisma.seller.create({
    data: {
      condominiumId: ideoMobi.id,
      userId: wipaSeller.id,
      shopName: 'Wipa Air Cleaners',
      verificationStatus: 'APPROVED',
      idCardUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
      proofOfResidencyUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
      agreementSigned: true,
      agreementSignedAt: new Date(),
      verifiedAt: new Date()
    }
  });

  // Create listings for Wipa (Ideo Mobi)
  await prisma.listing.create({
    data: {
      condominiumId: ideoMobi.id,
      sellerId: wipaProfile.id,
      title: 'Air Conditioner Filter Cleaning',
      description: 'Professional high-pressure washing for your wall AC units. Resident special discount. Clean air today!',
      price: 600.00,
      category: 'services',
      images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e'],
      status: 'ACTIVE',
      legalAffirmation: true
    }
  });

  // 5. Seed default advertisement banners
  await prisma.adBanner.create({
    data: {
      title: 'Welcome to Nestly SaaS!',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      linkUrl: '/legal/guidelines',
      isActive: true
    }
  });
  console.log('Seeded default advertisement banners.');

  console.log('Seeded active accounts and isolated listings for both condominiums.');
  console.log('Database Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error('Seed execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
