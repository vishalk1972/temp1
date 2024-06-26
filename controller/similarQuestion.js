const { db } = require('../db.js');
const Groq=require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const similarQuestion=async(req,res)=>{
    try{
        const AllQuestions = await db.qA.findMany({
            select: {
              id: true,
              question: true
            },
            skip:50
        });
        const output=[]
        for(i=0;i<50;i++)
        {
            const singleQuesion=AllQuestions[i];

            const qId=singleQuesion.id;
            let qString=singleQuesion.question;
            qString=qString.toLowerCase()
            
            const prompt=`
            Extract the 'Standard Question' from the given input question.
            1. A 'Standard Question' is a canonical representation derived from multiple similar questions that share the same meaning and answer.
            2. For example, questions like 'What is Total Knee Replacement?', 'What is TKR?', 'Explain TKR.', and 'Explain me about TKR.' all seek the same information despite variations in wording and can have a standard question as 'what is total knee replacement (tkr)?'.
            3. Another example can be, questions like 'Explain the procedure of TKR.', 'What are the steps to cure TKR?', 'Explain the steps required to cure TKR.' all seek the same information despite variations in wording and can have a standard question as 'what is the procedure to cure total knee replacement (tkr)?'.
            4. The goal is to standardize these questions into a single standard question as stated above.
            5. Input questions are given by normal humans. If the question is not clear, kindly give '-1' as the output and do not provide any other explanations.
            6. Please generate the 'Standard Question' for the input: ${qString}
            7. Ensure the output question maintains clarity and is suitable for categorizing similar queries effectively. Output only a single string format, no explanations needed and just give me a simple output.
            8. Ensure the 'Standard Question' is in lowercase for consistency.
            9. Please output the 'Standard Question' in double-byte quotes (""") always.
            10. If the input question is not related to medical procedures, body systems, diseases, medical imaging, medical specialties, anatomy, or the doctor field, then:
                * Check if the question has a medical reference. If the question has no reference to the medical field, then: Output '-1' as the response.
                * If the question has a medical reference, then: Extract the 'Standard Question' as described above.
            11. To check if a question is related to medical or not, you can refer to this: Medical-related questions typically involve inquiries about health, diseases, treatments, symptoms, anatomy, or healthcare practices. On the other hand, non-medical questions cover a wide range of subjects unrelated to health or medicine. Provide your response based on this distinction.
            12. Output only the 'Standard Question' itself, without any explanations or additional text.
            13. Consider every question as a new question and if the input question is not related to medical procedures, body systems, diseases, medical imaging, medical specialties, anatomy, or the doctor field, and does not have a medical reference, then output "-1" (in double-byte quotes) as the response.
            `
            const completion = await groq.chat.completions.create({
                messages: [
                  { role: 'system', content: 'You are a Professional Medical Expert.' },
                  { role: 'user', content: prompt }
                ],
                model: 'llama3-70b-8192',
                temperature: 0,
            });

            let OpenAiStandardQuestion=completion.choices[0].message.content;
            

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
            console.log('----------------------------------------- \n')
            console.log('No       :',i)
            console.log('Question :',qString)
            console.log('Standard :',OpenAiStandardQuestion)
            const currentDate = new Date();
            const hours = String(currentDate.getHours()).padStart(2, '0');
            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
            const seconds = String(currentDate.getSeconds()).padStart(2, '0');
            const formattedDate = `${hours}:${minutes}:${seconds}`;
            console.log('Time     :',formattedDate);
        }
        const finalData=await db.QuestionMetadata.findMany({
            include:{
                relatedQAs:true,
            }
        })
        
        res.json({
            success:true,
            message:'ok',
            data:finalData,
        })
    }catch(error)
    {
        res.json({
            success:false,
            message:error.message ? error.message : "There was a error"
        })
    }
}
module.exports=similarQuestion;