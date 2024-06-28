const express=require('express')
const router=express.Router()

const TopQuestionsAndUniqueUserData=require('../controller/query/TopQuestionsAndUniqueUserData.js')
const DateFilter = require('../controller/query/DateFilter.js')


router.get('/TopQuestionsAndUniqueUserData',TopQuestionsAndUniqueUserData)
router.get('/DateFilter',DateFilter)

module.exports=router