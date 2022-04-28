require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routers = require("./routes");
const fs = require('fs')
const http = require ('http')

// const db = require('../config');
// const AWS = require('aws-sdk');
const https = require("https");
const app = express();
const port = 3000;
 

//소켓
// const socketIo = require('socket.io');
// const { Iot, Route53Domains } = require('aws-sdk');
// const { SocketAddress } = require('net');
// const server = require('http').createServer(app)


app.use(cors());

// 미들웨어 (가장 상위에 위치)
const requestMiddleware = (req, res, next) => {
    console.log('Request URL:', req.originalUrl, '-', new Date());
    next();
}

app.use(express.static("static"))
app.use(express.urlencoded({extended: false}))
app.use(express.json());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(requestMiddleware);


app.use('/', routers);

app.get(
 "/.well-known/pki-validation/FEFFF8AAD41B2BDD0AC37B8AE376E000.txt",
 (req, res) => {
   res.sendFile(__dirname + "/.well-known/pki-validation/FEFFF8AAD41B2BDD0AC37B8AE376E000.txt");
 }
);



//도메인
app.listen(port, () => {
  console.log(port, '포트로 서버가 켜졌어요!')
}); 

