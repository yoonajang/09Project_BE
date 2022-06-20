const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const {
    register,
    sendAuth,
    checkAuth,
    checkEmail,
    checkName,
    login,
    checkLogin,
    checkAlarm,
    deleteUser
} = require('../controller/user');


// 회원가입
router.post('/signup', register);

// 회원가입시 이메일 인증코드 보내기
router.post('/mail', sendAuth);

// 이메일 인증 확인
router.post('/mailauth', checkAuth);

// 이메일 중복확인
router.post('/emailcheck', checkEmail);

// 닉네임 중복확인
router.post('/namecheck', checkName);

// 로그인
router.post('/login', login);

// 로그인 여부확인
router.get('/islogin', authMiddleware, checkLogin);

// 알람확인
router.patch('/ischecked', authMiddleware, checkAlarm);

// 회원탈퇴
router.delete('/:userId', authMiddleware, deleteUser)


module.exports = router;
