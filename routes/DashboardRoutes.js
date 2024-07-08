const express=require('express')
const router=express.Router()
const userCount = require('../controller/dashboard/userCount')
const getPercentChange = require('../controller/dashboard/userPercentageChange')


router.get('/userCount',userCount)
router.get('/userPercentageChange',getPercentChange)

module.exports=router