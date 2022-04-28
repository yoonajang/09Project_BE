const express= require('express');
const router = express.Router();
const db = require('../config');
const authMiddleware = require("../middlewares/auth");



module.exports=router;