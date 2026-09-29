require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const User = require('./src/models/User');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Auto-seed if database is brand new and has no admin
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Running auto-initialization seed...');
      // Invoke seed logic safely
      try {
        const { execSync } = require('child_process');
        execSync('node src/utils/seed.js', { stdio: 'inherit', cwd: __dirname });
        console.log('[Server] Auto-seed complete.');
      } catch (seedErr) {
        console.warn('[Server] Auto-seed warning:', seedErr.message);
      }
    }

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Taraaang POS Backend running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Closed remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
