const express = require("express");
const userRouter = require("./user");
const mainRouter = require("./main");




const router = express.Router();

// 앞에 /로 시작됨
router.use('/user', userRouter);
router.use('/main', mainRouter);




module.exports = router;