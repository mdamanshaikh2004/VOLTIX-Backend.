require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const connectDB = require('../config/db');
const { invalidateByPrefix } = require('../services/redisService');
const catalog = require('../catalog/electronicsCatalog12');

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required.');

  await connectDB();

  const operations = catalog.map((product) => ({
    updateOne: {
      filter: { sku: product.sku },
      update: { $set: product },
      upsert: true,
    },
  }));

  const result = await Product.bulkWrite(operations, { ordered: false });
  await invalidateByPrefix('product');

  console.log(JSON.stringify({
    success: true,
    catalogueProducts: catalog.length,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
    message: 'The 12-product catalogue was imported/upserted without deleting existing products.',
  }, null, 2));
};

run()
  .catch((error) => {
    console.error('Catalog import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
    process.exit();
  });
