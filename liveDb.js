// // db.js

// const { PrismaClient } = require('@prisma/client');

// const globalForPrisma = globalThis;

// const db =globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// module.exports = { db };

const { PrismaClient } = require('@prisma/client');

const globalForLiveDb = globalThis;

const liveDb = globalForLiveDb.liveDb || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_LIVE,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForLiveDb.liveDb = liveDb;

module.exports = { liveDb };
