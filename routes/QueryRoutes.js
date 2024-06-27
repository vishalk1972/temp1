const express=require('express')
const router=express.Router()

const TopQuestionsAndUniqueUserData=require('../controller/query/TopQuestionsAndUniqueUserData.js')


router.get('/TopQuestionsAndUniqueUserData',TopQuestionsAndUniqueUserData)

module.exports=router