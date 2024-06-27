const {db}= require('../../db.js')
const TopQuestionsAndUniqueUserData=async(req,res)=>{
    try{
        console.log(req.body);
        const param=req.body.count;
        const questions = await prisma.questionMetadata.findMany({
            select: {
              question: true,
              relatedQAIds: true,
            }
          })

          const filteredQuestions = questions.filter(question => question.question !== '-1')
          
          const sortedQuestions = filteredQuestions.map(question => ({
            ...question,
            Count: question.relatedQAIds.length,
          })).sort((a, b) => b.Count - a.Count)

          let ResulData=[]
          const limit=parseInt(param)
          if(param.toLowerCase()==='all')
          {
                ResulData=sortedQuestions
          }
          else{
                ResulData=sortedQuestions.slice(0,limit)
          }
          // Top X Most Asked Question
          
        res.json({
            "success":true,
            "message":"Done",
            "data":ResulData
        })
    }catch(error)
    {
        res.json({
            "success":false,
            "message":error
        })
    }
}

module.exports=TopQuestionsAndUniqueUserData;