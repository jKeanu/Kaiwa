import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch'


const isProduction = process.env.NODE_ENV === 'production'

const awsCredentials ={
  credentials:{
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  },
  region: process.env.AWS_REGION
}

export const errLogger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    isProduction?
    new WinstonCloudWatch({
      awsOptions:awsCredentials,
      logGroupName: process.env.CLOUDWATCH_ERROR_LOG_GROUP_NAME,
      logStreamName: process.env.CLOUDWATCH_ERROR_LOG_STREAM, 
    }):
    new winston.transports.File({ filename: 'error.log'})
  ]
})

export const infoLogger = winston.createLogger({
  level:'info',
  format: winston.format.json(),
  transports: [
    isProduction?
    new WinstonCloudWatch({
      awsOptions:awsCredentials,
      logGroupName: process.env.CLOUDWATCH_INFO_LOG_GROUP_NAME,
      logStreamName: process.env.CLOUDWATCH_INFO_LOG_STREAM,
    }):
    new winston.transports.File({ filename: 'info.log'})
  ]
})