const express= require('express');
const router = express.Router();
const db = require('../config');
   
// const authMiddleware = require("../middlewares/auth");


// 메인페이지 게시글 불러오기
router.get('/postlist', (req, res) => {
    const address = req.body.address;
    const sql = 'select * from Post where address=?'


    db.query(sql, address, (err, data) => {
        if (err) console.log(err);
        console.log(data)
        res.status(201).send({msg:'success',data});
        
    });
});


// 메인페이지 게시글 상세보기
router.get('/postdetail', (req, res) => {
    const postId = req.body.postId;
    const sql = 'select * from Post where postId=?'


    db.query(sql, postId, (err, data) => {
        if (err) console.log(err);
        res.status(201).send({msg:'success',data});
        
    });
});


module.exports=router; 
