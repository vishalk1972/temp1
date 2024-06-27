const {db}= require('../../db.js')
const TopQuestionsAndUniqueUserData=async(req,res)=>{
  try{
      // Top X Most Asked Question Done
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

          let ResultData=[]
          const limit=parseInt(param)
          if(param.toLowerCase()==='all')
          {
                ResultData=sortedQuestions
          }
          else{
                ResultData=sortedQuestions.slice(0,limit)
          }
          // Unique Users Per Standard Question Done
          const ResultData2=[]
          for(const Eachquestion of filteredQuestions)
          {
              let question=Eachquestion.question
              let QAIdArray=Eachquestion.relatedQAIds
              let uniqueUsers = new Set();
              for(const EachquestionId of QAIdArray)
              {
                const Eachuser = await prisma.qA.findMany({
                    where:{
                        id:EachquestionId
                    },
                    select: {
                        users:true
                    }
                })

                Eachuser.forEach(user => {
                  const userExists = Array.from(uniqueUsers).some(u => u.id === user.users.id);
                  if (!userExists) {
                      uniqueUsers.add(user.users);
                  }
              });
                
              }
              const uniqueUsersArray = Array.from(uniqueUsers);
              const questionData = {
                  question: question,
                  UsersCount:uniqueUsersArray.length,
                  users: uniqueUsersArray
              };

              ResultData2.push(questionData);
          }
        res.json({
            "success":true,
            "message":"Done",
            "TopAskedQuestions":ResultData,
            "UniqueUsersPerQuestion":ResultData2
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