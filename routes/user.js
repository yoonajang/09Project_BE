const express= require('express')
const router = express.Router()


const db= require('../config')

const bcrypt = require('bcrypt')
const saltRounds =10 


<<<<<<< Updated upstream

<<<<<<< HEAD
    if (originPw != password) {
        res.status(400).send({errorMessage: '닉네임 또는 비밀번호를 확인해주세요'});
        return;
    } else {
        const userinfo = await User.findOne({ userId : user.userId},    
            {_id:0, userId:1, nickName:1, startTime:1, totalTime:1, connecting:1, friendList:1, userImage:1, statusMeg:1 })
        const token = jwt.sign({ userId : user.userId},process.env.JWT_SECRET);
        res.json({token, userinfo})
    }

});


// 로그인시, 미들웨어로 회원인식 및 회원으로 입장가능 (보류) 
router.get("/islogin", authMiddleware, async (req, res) => {
    const {user} = res.locals;
    console.log({user})
    res.send({
        user: {
            userId: user.userId,
            nickName: user.nickName,
            startTime: user.startTime,
            totalTime: user.totalTime,
            connecting: user.connecting,
            friendList: user.friendList,
            userImage: user.userImage,
            statusMeg: user.statusMeg,
        }
    });
});



// 회원가입
router.post("/signup", async (req, res) => {
    const { userId, nickName, password, passwordCheck } = req.body
    // console.log(userId, nickName, password, passwordCheck)

    // //비밀번호 암호화
    const hashedpassword = CryptoJS.AES.encrypt(password, process.env.keyForDecrypt).toString();
 
    const startTime = '';
    const totalTime = 0;
    const connecting = false;
    const userImage = '';
    const statusMeg = '';

    const user = new User({ userId, nickName, hashedpassword, startTime,totalTime, connecting,userImage, statusMeg})

    await user.save();
    res.status(201).send({});       

});


//회원가입: 아이디 중복확인
router.post("/idCheck", async (req, res) => {
    const { userId } = req.body

    const existUsers = await User.find({
        $or: [{ userId }]
    });

    if (existUsers.length) {
        res.status(201).send({result: "false"});
        return;
    } else {
        res.status(201).send({result: "true"}); 
    }     

=======
//회원가입
=======
>>>>>>> main
router.post('/signup',(req,res,next)=>{
    const param= [ req.body.userEmail, req.body.userName ,req.body.password, req.body.userImage ]
    
    bcrypt.hash(param[1],saltRounds,(error,hash)=>{
    param[2]=hash;
    db.query('INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`) VALUES (?,?,?,?)',
    param,(err,row) => {
   if(err) {
       console.log(err)}
       res.status(201).send({row})
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> main
});

//이메일 중복검사

})
})

module.exports=router; 