const express=require('express')
const router=express.Router()

const TotalQuestions = require('../controller/dashboard/TotalQuestions.js')
const PercentageChangeInQuestions = require('../controller/dashboard/PercentageChangeInQuestions.js')

router.get('/TotalQuestions', TotalQuestions);
router.get('/PercentageChangeInQuestions', PercentageChangeInQuestions);

module.exports=router