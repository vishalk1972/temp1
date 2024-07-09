const express=require('express')
const router=express.Router()

const TotalQuestions = require('../controller/dashboard/TotalQuestions.js')
const PercentageChangeInQuestions = require('../controller/dashboard/PercentageChangeInQuestions.js')
const userCount = require('../controller/dashboard/userCount')
const userPercentageChange = require('../controller/dashboard/userPercentageChange')
const QuestionsPerWeek = require('../controller/dashboard/QuestionsPerWeek')

router.get('/TotalQuestions', TotalQuestions);
router.get('/PercentageChangeInQuestions', PercentageChangeInQuestions);
router.get('/userCount',userCount)
router.get('/userPercentageChange',userPercentageChange)
router.get('/QuestionsPerWeek',QuestionsPerWeek)

module.exports=router