require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Resolve querySrv ECONNREFUSED on Windows / ISP DNS for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore in case environment restricts custom DNS
}

let memoryServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

  const maskUri = (uri) => (uri && uri.includes('@') ? uri.replace(/:([^:@]+)@/, ':****@') : uri);

  try {
    // Connect with 15s server selection timeout for cloud MongoDB Atlas
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[MongoDB] Connected to database: ${maskUri(primaryUri)}`);
    return;
  } catch (primaryErr) {
    console.warn(`[MongoDB] Could not connect to primary URI (${maskUri(primaryUri)}): ${primaryErr.message}`);

    // If an explicit MongoDB Atlas / remote authenticated URI was configured, fail loudly so data is not written elsewhere
    if (primaryUri.startsWith('mongodb+srv://') || primaryUri.includes('@')) {
      console.error('[MongoDB] Fatal: Could not connect to configured MongoDB Atlas cluster. Please check internet connection and Atlas IP Access List.');
      throw primaryErr;
    }

    console.log('[MongoDB] Initializing embedded persistent local MongoDB engine...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbPath = path.join(__dirname, '../../data/db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger',
        },
      });

      const embeddedUri = memoryServer.getUri() + 'restaurant_pos';
      await mongoose.connect(embeddedUri);
      console.log(`[MongoDB] Connected to embedded persistent database: ${embeddedUri}`);
    } catch (embeddedErr) {
      console.error(`[MongoDB] Fatal error initializing embedded database:`, embeddedErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[MongoDB] Disconnected.');
  } catch (err) {
    console.error('[MongoDB] Error disconnecting:', err);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
