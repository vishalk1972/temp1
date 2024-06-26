const { db } = require('../db.js');
const Groq=require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function processQuestions(questions) {
    for (const question of questions) {
      qId=question.id
      OpenAiStandardQuestion=question.question
      console.log(qId,OpenAiStandardQuestion,"inside")
      // Find or create the QuestionMetadata
      let check = await db.QuestionMetadata.findUnique({
        where: {
          question: OpenAiStandardQuestion
        }
      });
  
      if (!check) {
        check = await db.QuestionMetadata.create({
          data: {
            question: OpenAiStandardQuestion
          }
        });
      }
  
      // Fetch the relatedQAIds
      const check2 = await db.QuestionMetadata.findUnique({
        where: {
          id: check.id
        },
        select: {
          relatedQAIds: true
        }
      });
      console.log('chcek 2 ------------------------------------ \n------\n')
      console.log(check2)
      // Update relatedQAIds if qId is not included
      if (!check2.relatedQAIds.includes(qId)) {
        const data=await db.QuestionMetadata.update({
          where: {
            id: check.id
          },
          data: {
            relatedQAIds: [...check2.relatedQAIds, qId],
            relatedQAs: {
              connect: { id: qId }
            }
          }
        });
        console.log("Go :- \n",data);
      }
    }
}
const similarQuestion=async(req,res)=>{
    try{
        const AllQuestions = await db.qA.findMany({
            select: {
              id: true,
              question: true
            },
        });
        const output=[]
        let chunkSize=10;
        for (let i = 0; i < 100; i += chunkSize) {
            let selectedArray = AllQuestions.slice(i, i + chunkSize);
            console.log("Chunk :- \n",selectedArray);
            let Qpart=selectedArray.map((q)=>{
                return ` Id: ${q.id} , Question: ${q.question} , \n`
            })
            const prompt=`
            Extract the 'Standard Question' from the given input question.
            1. A 'Standard Question' is a canonical representation derived from multiple similar questions that share the same meaning and answer.
            2. For example, questions like 'What is Total Knee Replacement?', 'What is TKR?', 'Explain TKR.', and 'Explain me about TKR.' all seek the same information despite variations in wording and can have a standard question as 'what is total knee replacement (tkr)?'.
            3. Another example can be, questions like 'Explain the procedure of TKR.', 'What are the steps to cure TKR?', 'Explain the steps required to cure TKR.' all seek the same information despite variations in wording and can have a standard question as 'what is the procedure to cure total knee replacement (tkr)?'.
            4. Also the output should be consistent. For example, """""what is orthoai?""""","""what is orthoai?""","""""what is ortho ai?""""","""What is orthoai in medical context?""","""what is ortho ai?""","""What is orthoai?""", should be standardised as a single standard question "what is ortho ai?", and, """""what is ortho?""""","""what is ortho?""","""What is ortho?""" should be standardised as a single standard question "what is ortho?".
            5. The goal is to standardize these questions into a single standard question as stated above.
            6. Input questions are given by normal humans. If the question is not clear, kindly give '-1' as the output and do not provide any other explanations.
            7. Example Input Format(Questions will be given to you like this):
            Id: 38960143-d9ba-4c8b-acb1-c343fa939ec4 , Question: Explain about modified Henry's approach , 
            Id: f146f8b1-0d65-4f8b-bdbb-fdb91396cb56 , Question: What is it when your thumb hurts when wringing clothes or opposing? , 
            Id: 1cf800d0-66b1-4842-8430-a6b1416273bc , Question: Explain about over the top procedure , 
            Id: ae079974-ab25-4e7e-a64c-e6810968af9e , Question: Continuous low grade pain along trapezius and shoulder blade muscles  , 
            Id: 2f75a564-4282-4d53-8a53-0acf6cc77cd3 , Question: Why knee redness after knee exercise
            8. Now I will give List of Questions Please Create Standard Question for all of those
            ${Qpart}
            9. Ensure the output question maintains clarity and is suitable for categorizing similar queries effectively. No explanations needed and just give me a simple output.
            10. Ensure the 'Standard Question' is in lowercase for consistency.
            11. If the input question is not related to medical procedures, body systems, diseases, medical imaging, medical specialties, anatomy, or the doctor field, then:
                * Check if the question has a medical reference. If the question has no reference to the medical field, then: Output '-1' as the response.
                * If the question has a medical reference, then: Extract the 'Standard Question' as described above.
            12. To check if a question is related to medical or not, you can refer to this: Medical-related questions typically involve inquiries about health, diseases, treatments, symptoms, anatomy, or healthcare practices. On the other hand, non-medical questions cover a wide range of subjects unrelated to health or medicine. Provide your response based on this distinction.
            13. Output only the 'Standard Question' itself in the provided format, without any explanations or additional text.
            14. Consider every question as a new question and if the input question is not related to medical procedures, body systems, diseases, medical imaging, medical specialties, anatomy, or the doctor field, and does not have a medical reference, then output "-1" (in double-byte quotes) as the response.
            15. Example Output Format (JSON):
            [
                {
                    "id":"38960143-d9ba-4c8b-acb1-c343fa939ec4",
                    "question":"explain about modified henry's approach"
                },
                {
                    "id":"f146f8b1-0d65-4f8b-bdbb-fdb91396cb56",
                    "question":"what is it when your thumb hurts when wringing clothes or opposing?"
                },
                {
                    "id":"1cf800d0-66b1-4842-8430-a6b1416273bc",
                    "question":"explain about over the top procedure"
                },
                {
                    "id":"ae079974-ab25-4e7e-a64c-e6810968af9e",
                    "question":"continuous low grade pain along trapezius and shoulder blade muscles"
                },
                {
                    "id":"2f75a564-4282-4d53-8a53-0acf6cc77cd3",
                    "question":"why knee redness after knee exercise"
                }
            ]
            `
            // console.log(prompt)

            try{
                const completion = await groq.chat.completions.create({
                    messages: [
                      { role: 'system', content: 'You are a Professional Medical Expert.' },
                      { role: 'user', content: prompt }
                    ],
                    model: 'llama3-70b-8192',
                    temperature: 0,
                });
                console.log('GROQ OUTPUT ------------------->')
                const response=completion.choices[0].message.content;
                const start = response.indexOf('[');
                const end = response.lastIndexOf(']') + 1;

        
                const arrayPart = response.substring(start, end);
                const StdquestionsArray = JSON.parse(arrayPart);
                console.log('Parsed Array----------------------------->')
                console.log(StdquestionsArray)
                
                processQuestions(StdquestionsArray)
                .then(() => {
                    console.log('All questions processed')
                })
                .catch(err => console.error('Error processing questions:', err));


            }catch(error)
            {
                console.log(error);
            }
        }
        
        res.json({
            success:true,
            message:'ok',
            // data:finalData,
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