const express = require('express');
const userRouter = require('./user');

const router = express.Router();

// 앞에 /로 시작됨
router.use('/user', userRouter);

module.exports = router;
