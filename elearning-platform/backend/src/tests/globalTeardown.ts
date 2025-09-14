export default async () => {
  console.log('🧹 Cleaning up test environment...');

  if (global.__PRISMA__) {
    await global.__PRISMA__.$disconnect();
    console.log('✅ Database disconnected');
  }

  if (global.__REDIS__) {
    await global.__REDIS__.disconnect();
    console.log('✅ Redis disconnected');
  }
};