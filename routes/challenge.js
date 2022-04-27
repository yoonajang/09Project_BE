require("dotenv").config();
const express = require("express"); 
const router = express.Router();
const mysql = require('mysql');
const db = require("../config/db");
// const authMiddleware = require("../middlewares/auth-middleware");


//해당 유저의 챌린지 가져오기 (테스트용)
router.get("/test", async (req, res) => {
 
    // userQuery = "INSERT INTO `Challenge` (`title`,`userId`) VALUES ('hi','1');";
    userQuery = "INSERT INTO `Challenge` (`User_userId`,`title`,`desc`) VALUES (1,'test','설명입니다1');";

    db.query(userQuery, (err, results) => { // testQuery 실행
        if (err) console.log(err);
        console.log( results);
        res.status(201).send({results});
    })
});


//authmiddleware 작동필요
//해당 유저의 챌린지 가져오기
router.get("/me", async (req, res) => {
    
    //const { user } = res.locals
 
    // 일부가져오기
    // challenge = "SELECT * FROM Challenge where User_userId=1"; //userId = user로 수정

    // challenge = "SELECT title, `desc`, goalMoney, currentMoney, dueDay, `donateTo_donateToId` FROM Challenge where User_userId=1; SELECT donateToAddr FROM donateTo"; //userId = user로 수정
    challenge = 


    db.query(challenge, (err, results) => {
        if (err) console.log(err);
        console.log( results);
        res.status(201).send({results});
    })
});


//authmiddleware 작동필요
//챌린지 상세페이지
// router.get("/:postId", async (req, res) => {
    
//     const { postId } = res.params
 
//     challenge = "SELECT * FROM Challenge where User_userId=1"; //userId = user로 수정

//     db.query(challenge, (err, results) => {
//         if (err) console.log(err);
//         console.log( results);
//         res.status(201).send({results});
//     })
// });



module.exports = router;