const { db } = require('../db.js');
const { OpenAI } = require('openai');
// const { connect } = require('../routes/CategorizationRoutes.js');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

const similarQuestionAndCategory=async(req,res)=>{
    try{
        const AllQuestions = await db.qA.findMany({
            select: {
              id: true,
              question: true
            }
        });
        const output=[]
        for(i=0;i<500;i++)
        {
            const singleQuesion=AllQuestions[i];

            const qId=singleQuesion.id;
            let qString=singleQuesion.question;
            qString=qString.toLowerCase()
            console.log(qString,"<->")

            const prompt=`
            Extract the 'Standard Question' from the given input question.
            1. A 'Standard Question' is a canonical representation derived from multiple similar questions that share the same meaning and answer.
            2. For example, questions like 'What is Total Knee Replacement?', 'What is TKR?', 'Explain TKR.', and 'Explain me about TKR.' all seek the same information despite variations in wording and can have a standard question as 'what is total knee replacement (tkr)?'.
            3. Another example can be, questions like 'Explain the procedure of TKR.', 'What are the steps to cure TKR?', 'Explain the steps required to cure TKR.' all seek the same information despite variations in wording and can have a standard question as 'what is the procedure to cure total knee replacement (tkr)?'.
            4. The goal is to standardize these questions into a single standard question as stated above.
            5. Input questions are given by normal humans. If the question is not clear, kindly give '-1' as the output and do not provide any other explanations.
            6. Please generate the 'Standard Question' for the input: ${qString}
            7. Ensure the output question maintains clarity and is suitable for categorizing similar queries effectively. Output only a single string format, no explanations. Ensure the 'Standard Question' is in lowercase for consistency.
            8. Please keep consistency in output and provide output in double quotes ("") always.
            9. If the input question is not related to medical procedures, body systems, diseases, medical imaging, medical specialties, anatomy, or the doctor field, then give the output as "-1" in string format.
            10. Before giving "-1", check if the question has a medical reference. If the question has no reference to the medical field, then only return "-1".
            11. To check if a question is related to medical or not, you can refer to this: Medical-related questions typically involve inquiries about health, diseases, treatments, symptoms, anatomy, or healthcare practices. On the other hand, non-medical questions cover a wide range of subjects unrelated to health or medicine. Provide your response based on this distinction.
            `

            const completion = await openai.chat.completions.create({
                messages: [
                  { role: 'system', content: 'You are a Professional Assistant' },
                  { role: 'user', content: prompt }
                ],
                model: 'gpt-4',
                temperature: 0,
            });
            
            let OpenAiStandardQuestion=completion.choices[0].message.content;
            console.log('----------------------------------------- \n')
            console.log(OpenAiStandardQuestion,'\n')

            let check=await db.QuestionMetadata.findUnique({
                where:{
                    question:OpenAiStandardQuestion
                }
            })

            if(!check)
            {
                check=await db.QuestionMetadata.create({
                    data:{
                        question:OpenAiStandardQuestion
                    }
                })
            }

            const check2=await db.QuestionMetadata.findUnique({
                where:{
                    id:check.id
                },
                select:{
                    relatedQAIds:true
                }
            })
            console.log('check 2',check2)
            if(!check2.relatedQAIds.includes(qId))
            {
                const res=await db.QuestionMetadata.update({
                    where: {
                      id: check.id
                    },
                    data: {
                        relatedQAIds: [...check.relatedQAIds,qId],
                        relatedQAs: {
                            connect: { id : qId }
                        }
                    }
                  });
            } 
        }
        const finalData=await db.QuestionMetadata.findMany({
            include:{
                relatedQAs:true,
            }
        })
        
        res.json({
            success:true,
            message:'ok',
            data:finalData
        })
    }catch(error)
    {
        res.json({
            success:false,
            message:error.message ? error.message : "There was a error"
        })
    }
}
module.exports=similarQuestionAndCategory;