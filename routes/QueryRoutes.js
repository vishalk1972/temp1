const express=require('express')
const router=express.Router()

const TopQuestionsAndUniqueUserData=require('../controller/query/TopQuestionsAndUniqueUserData.js')
const DateFilter = require('../controller/query/DateFilter.js')
const CategoryFilter = require('../controller/query/CategoryFilter.js')


router.get('/TopQuestionsAndUniqueUserData',TopQuestionsAndUniqueUserData)
router.get('/DateFilter',DateFilter)
router.get('/CategoryFilter',CategoryFilter)

module.exports=router