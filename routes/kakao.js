require('dotenv').config();
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const upload = require('../S3/s3');



router.get(
    '/kakao',
    upload.single('profileImage'),
    passport.authenticate('kakao'),
);

const kakaoCallback = (req, res, next) => {
    passport.authenticate('kakao', { failureRedirect: '/' }, (err, user) => {
        if (err) return next(err);

        const { userId, provider, userEmail, userName, userImage, point, tradeCount } = user;
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
        res.send({ msg:"success", user: result, });
    })(req, res, next);
};

router.get('/kakao/callback', kakaoCallback);
module.exports = router;
