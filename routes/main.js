const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const main = require('../controller/main');


// 메인페이지 게시글 불러오기
router.post('/postlist', main)


module.exports = router;
