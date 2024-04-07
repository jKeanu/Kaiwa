import mongoose from 'mongoose';
import http from 'http';
import socketServerSetup from './socketServer.js';
import app from './app.js';


const server = http.createServer(app);
// Set up the socket server
socketServerSetup(server);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  // When there's an uncaught exception, we need to crash our application
  // since the entire node process is in an uncleaned state.
  process.exit(1);
});

// Connect to the Database
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {}).then(() => console.log('DB connection successful')).catch((err) => console.error(err));

const port = process.env.PORT || 3001;
const httpServer = server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  httpServer.close(() => {
    // 0 for success, 1 for uncaught exception
    // 1 is usually used here
    process.exit(1);
  });
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated!');
  });
});