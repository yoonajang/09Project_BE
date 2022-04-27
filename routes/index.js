const express = require("express");
const challengeRouter = require("./challenge");
const userRouter = require("./user");


const router = express.Router();

// 앞에 /api/로 시작됨
router.use('/challenge', challengeRouter);
router.use('/challenge', userRouter);

module.exports = router;