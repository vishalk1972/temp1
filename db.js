// db.js

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const db =globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

module.exports = { db };
