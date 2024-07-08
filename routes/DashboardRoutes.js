const express=require('express')
const router=express.Router()
const userCount = require('../controller/dashboard/userCount')
const userPercentChange = require('../controller/dashboard/userPercentageChange')


router.get('/userCount',userCount)
router.get('/userPercentageChange',userPercentChange)

module.exports=router