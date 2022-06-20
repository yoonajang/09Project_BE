const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const upload = require('../S3/s3');

const {
    editUser,
    userMe
} = require('../controller/me');


// 유저 프로필 수정
router.post('/me', authMiddleware, upload.single('userImage'), editUser)

//유저 마이페이지
router.get('/:userId', authMiddleware, userMe)


module.exports = router;
