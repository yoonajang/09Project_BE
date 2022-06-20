const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const startChat = require('../controller/chat');

// 채팅 시작하기
router.get('/getchat/:postId', authMiddleware, startChat); 

module.exports = router;