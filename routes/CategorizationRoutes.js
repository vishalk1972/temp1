const express=require('express')
const router=express.Router()
const similarQuestionAndCategory = require('../controller/similarQuestionAndCategory');
const categoryTableData = require('../controller/categoryTableData');

router.post('/similarQuestionAndCategory',similarQuestionAndCategory);
router.post('/categoryDataAdd',categoryTableData);
router.post('/categorySubcategory',)

module.exports=router