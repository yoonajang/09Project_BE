require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const routers = require('./routes');
const kakaoPassport = require('./routes/kakaoIndex');
const fs = require('fs');
const http = require('http');
const https = require('https');
const app = express();
const app_http = express();
const httpPort = 80;
const httpsPort = 443;
const SocketIO = require('./socket');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');


kakaoPassport();
app.use(cors()); 

const credentials = {
    key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/certificate.crt', 'utf8'),
    ca: fs.readFileSync(__dirname + '/ca_bundle.crt', 'utf8'),
};

// 미들웨어 (가장 상위에 위치)
const requestMiddleware = (req, res, next) => {
    console.log(
        `[ip] ${req.ip}   [${req.method}] [BASE] ${req.rawHeaders[1]} [URL] ${req.originalUrl}  `, moment().format("YY-MM-DD HH:mm:ss")
    );
    next();
};

app.use(helmet());
app.use(express.static('static'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestMiddleware);
app.use('/', routers);



app_http.use((req, res, next) => {
    if (req.secure) {
        next();
    } else {
        const to = `https://${req.hostname}:${httpsPort}${req.url}`;
        // console.log(to);
        res.redirect(to);
    }
});

app.get(
    '/.well-known/pki-validation/FEFFF8AAD41B2BDD0AC37B8AE376E000.txt',
    (req, res) => {
        res.sendFile(
            __dirname +
                '/.well-known/pki-validation/FEFFF8AAD41B2BDD0AC37B8AE376E000.txt',
        );
    },
);

const httpServer = http.createServer(app_http);
const httpsServer = https.createServer(credentials, app);
SocketIO(httpsServer);

console.log(moment().format("YY-MM-DD HH:mm:ss"))
httpServer.listen(httpPort, () => {
    console.log(`${httpPort}`,'http서버가 켜졌어요!');
});

httpsServer.listen(httpsPort, () => {
    console.log(`${httpPort}`, 'https서버가 켜졌어요!');
});

