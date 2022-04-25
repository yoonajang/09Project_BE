const express = require("express");
const challengeRouter = require("./challenge");


const router = express.Router();

// 앞에 /api/로 시작됨
router.use('/challenge', challengeRouter);

module.exports = router;