const express= require('express');
const router = express.Router();
const db = require('../config');
const authMiddleware = require("../middlewares/auth");

//호스트 게시글 작성 수정전
router.post('/hostAdd', authMiddleware, upload.array('postImg', 5), // 이미지 여러개 받기 최대5장
  async (req, res) => {
    const today = new Date();
    const date = today.toLocaleString();
    const { user } = res.locals.user;
    console.log(user)
    const email = res.locals.user.email;
    const nickName = res.locals.user.nickName;
    const userProfile = res.locals.user.userProfile;
    const { postTitle, postDesc, postCharge, address, room, wifi, laundry, parkinglot, latitude, longitude } = req.body;    
    const postImg = [];
    console.log(req.body);
    for (let i = 0; i < req.files.length; i++) {
      postImg.push(req.files[i]?.location);
    }
    console.log(postImg)
    try {
      await Posts.create({
        email,
        userProfile,
        date,
        nickName,
        postTitle, 
        postDesc, 
        postCharge, 
        address,
        room, wifi, laundry, parkinglot,
        latitude: Number(latitude),
        longitude: Number(longitude),
        postImg,
      });
      res.status(200).send({
        message: '호스트 게시글이 등록되었습니다.',
      });
    } catch (err) {
      res.status(400).send({
        message: '호스트 게시글 등록이 실패했습니다.',
      });
    }
  }
);


module.exports=router;