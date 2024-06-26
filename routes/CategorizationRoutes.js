const express=require('express')
const router=express.Router()
const similarQuestion = require('../controller/similarQuestion');
const categoryTableData = require('../controller/categoryTableData');
const categorySubcategoryAssignment=require('../controller/categoryAndSubcategory')


router.post('/categoryDataAdd',categoryTableData);
router.post('/similarQuestion',similarQuestion);
router.post('/categorySubcategory',categorySubcategoryAssignment)

module.exports=router