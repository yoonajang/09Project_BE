// import winston from 'winston';
// import winstonDaily from 'winston-daily-rotate-file';

const { winston } = require ('winston');
const { winstonDaily } = require ('winston-daily-rotate-file');

const logDir = 'logs';  // logs 디렉토리 하위에 로그 파일 저장
const { combine, timestamp, printf } = winston.format;

// Define log format
const logFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `%DATE%.log`,
      maxFiles: 30,  // 30일치 로그 파일 저장
      zippedArchive: true, 
    }),
    // error 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error',  // error.log 파일은 /logs/error 하위에 저장 
      filename: `%DATE%.error.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
});

// Production 환경이 아닌 경우(dev 등) 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),  // 색깔 넣어서 출력
      winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
    )
  }));
}

module.exports = logger;
// export { logger };


// //config 폴더의winston.js 파일을 만들고 아래의 코드를 붙여넣는다.
// const appRoot = require("app-root-path");
// // app root 경로를 가져오는 lib
// const winston = require("winston");
// // winston lib
// const process = require("process");
// const { combine, timestamp, label, printf } = winston.format;
// const myFormat = printf(({ level, message, label, timestamp }) => {
//   return `${timestamp} [${label}] ${level}: ${message}`;
//   // log 출력 포맷 정의
// });
// const options = {
//   // log파일
//   file: {
//     level: "info",
//     filename: `${appRoot}/logs/winston-test.log`, // 로그파일을 남길 경로
//     handleExceptions: true,
//     json: false,
//     maxsize: 5242880, // 5MB
//     maxFiles: 5,
//     colorize: false,
//     format: combine(
//       label({ label: "winston-test" }),
//       timestamp(),
//       myFormat // log 출력 포맷
//     ),
//   },
//   // 개발 시 console에 출력
//   console: {
//     level: "debug",
//     handleExceptions: true,
//     json: false, // 로그형태를 json으로도 뽑을 수 있다.
//     colorize: true,
//     format: combine(label({ label: "nba_express" }), timestamp(), myFormat),
//   },
// };
// let logger = new winston.createLogger({
//   transports: [
//     new winston.transports.File(options.file),
//     // 중요! 위에서 선언한 option으로 로그 파일 관리 모듈 transport
//   ],
//   exitOnError: false,
// });
// if (process.env.NODE_ENV !== "production") {
//   logger.add(new winston.transports.Console(options.console));
//   // 개발 시 console로도 출력
// }
// module.exports = logger;