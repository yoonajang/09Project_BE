// const express = require("express");
// const router = express.Router();
// // const dotenv = require("dotenv").config();
// const rp = require("request-promise");
// const db = require('../config');
// const jwt = require("jsonwebtoken");

// const kakao = {
//   clientid: `${process.env.CLIENTID}`, //REST API
//   redirectUri: "https://d191gfhy5yq8br.cloudfront.net/main",
// };
// // kakao login page URL
// router.get("/kakaoLogin", (req, res) => {
//   const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${kakao.clientid}&redirect_uri=${kakao.redirectUri}`;
//   res.redirect(kakaoAuthURL);
// });

// // kakao register
// router.get("/main", async (req, res) => {
//   const { code } = req.query;
//   // console.log('code-->' , code);
//   const options = {
//     url: "https://kauth.kakao.com/oauth/token",
//     method: "POST",
//     form: {
//       grant_type: "authorization_code",
//       client_id: kakao.clientid,
//       redirect_uri: kakao.redirectUri,
//       code: code,
//     },
//     headers: {
//       "content-type": "application/x-www-form-urlencoded",
//     },
//     json: true,
//   };
//   const kakaotoken = await rp(options);
//   //    console.log('token', token)
//   const options1 = {
//     url: "https://kapi.kakao.com/v2/user/me",
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${kakaotoken.access_token}`,
//       "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
//     },
//     json: true,
//   };
//   const userInfo = await rp(options1);
//   // console.log('userInfo->', userInfo);
//   const userId = userInfo.id;
//   const userNick = userInfo.kakao_account.profile.nickname;
//   // console.log('userId-->',userId);
//   // console.log('userNick-->',userNick);
//   const existUser = await User.find({ userId });
//   console.log("existUser-->", existUser);

//   if (!existUser.length) {
//     const from = "kakao";
//     const user = new User({ userId, userNick, from });
//     console.log("user-->", user);
//     await user.save();
//   }

//   const loginUser = await User.find({ userId });
//   console.log("loginUser-->", loginUser);
//   const token = jwt.sign({ userId: loginUser.userId }, `${process.env.KEY}`);
//   console.log("kakaotoken-->", token);
//   res.status(200).send({
//     token,
//     userId,
//     userNick,
//   });
//   console.log("User-->", token, userId, userNick);
// });

// module.exports = router;