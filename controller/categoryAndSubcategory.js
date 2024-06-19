const {db}=require('../db.js')
const categorySubcategoryAssignment=async()=>{
    try{
        const StdQuestions=await db.QuestionMetadata.
        res.json({
            "successs":true,
            "message":"OK"
        })
    }catch(error)
    {
        res.json({
            "successs":false,
            "message":"Ther is a issue"
        })
    }
}
module.exports=categorySubcategoryAssignment;