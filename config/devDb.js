const { PrismaClient } = require('@prisma/client');

const globalForDevDb = globalThis;

const devDb = globalForDevDb.devDb || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DEV,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForDevDb.devDb = devDb;

module.exports = { devDb };
