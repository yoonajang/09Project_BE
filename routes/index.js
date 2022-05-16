const express = require('express');
const userRouter = require('./user');
const meRouter = require('./me');
const mainRouter = require('./main');
// const chatRouter = require('./chat');

const router = express.Router();

// 앞에 /로 시작됨
router.use('/user', userRouter);
router.use('/user', meRouter);
router.use('/main', mainRouter);
// router.use('/main', chatRouter);

module.exports = router;
