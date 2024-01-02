const dotenv = require('dotenv')
const mongoose = require('mongoose')
const http = require('http')
const socketServerSetup = require('./socketServer')

dotenv.config({ path: './config.env' });
const app = require('./app');
const server = http.createServer(app)


//Similar node.js process
socketServerSetup(server)


process.on('uncaughtException', err=>{
  console.log('UNCAUGHT EXCEPTION! Shutting down...')
  console.log(err.name, err.message)
  //When there's an uncaught exception we need to crash our application
  //since the entire node process is in uncleaned state.
  process.exit(1);
});

//Connect to the Database
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
mongoose.connect(DB, {}).then(()=>console.log('DB connection successful')).catch(err=>console.log(err))


const port = process.env.PORT || 3001;
const httpServer=server.listen(port, () => {
    console.log(`App running on port ${port}...`); 
  });

  process.on('unhandledRejection', err=>{
  console.log(`UNHANDLED REJECTION! Shutting down...` ) 
  httpServer.close(()=>{
    //0 for success, 1 for uncaught exception
    //1 is usually used here
    process.exit(1)
    
  })
})

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  httpServer.close(() => {
    console.log(' Process terminated!');
  });
});
