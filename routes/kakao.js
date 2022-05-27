require('dotenv').config();
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
<<<<<<< HEAD:kakao-auth/kakao/kakao.js
// const upload = require('..../S3/s3');
=======
const upload = require('../S3/s3');


>>>>>>> e43a41a7073a04b575c27a47200f9cecf3c787f5:routes/kakao.js

router.get(
    '/kakao',
    // upload.single('profileImage'),
    passport.authenticate('kakao'),
);

const kakaoCallback = (req, res, next) => {
    passport.authenticate('kakao', { failureRedirect: '/' }, (err, user) => {
        if (err) return next(err);

<<<<<<< HEAD:kakao-auth/kakao/kakao.js
        const { userId, provider, introduce, profileImage, nickname, type } =
            user;
=======
        const { userId, provider, userEmail, userName, userImage, point, tradeCount } = user;
>>>>>>> e43a41a7073a04b575c27a47200f9cecf3c787f5:routes/kakao.js
        const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET);

        result = {
            token,
            userId,
            provider,
            userEmail, 
            userName,
            userImage,
            point, 
            tradeCount
        };
<<<<<<< HEAD:kakao-auth/kakao/kakao.js
        console.log('result', result);
        res.send({ msg: 'success', user: result });
=======
        res.send({ msg:"success", user: result, });
>>>>>>> e43a41a7073a04b575c27a47200f9cecf3c787f5:routes/kakao.js
    })(req, res, next);
};

router.get('/kakao/callback', kakaoCallback);
module.exports = router;
