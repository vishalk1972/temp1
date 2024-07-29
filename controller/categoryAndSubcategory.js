const Groq=require('groq-sdk')
const { PrismaClient: PrismaClientLive } = require('@prisma-live/client');
const { PrismaClient: PrismaClientDev } = require('@prisma-dev/client');

const liveDb = new PrismaClientLive();
const devDb = new PrismaClientDev();
let LogData=[]
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}
const categorySubcategoryAssignment=async(req,res)=>{
    try{
        // Category json
        let temp=[]
        let categoryJson=[]; // contains all categories and subcategoires data
        let allCategoriesData=await devDb.Category.findMany({
            select:{
                id:true,
                name:true,
                subcategoryIds:true
            }
        })
        for(i=0;i<allCategoriesData.length;i++)
        {
            let tempArray=[];
            let subcategoryIdsArray=allCategoriesData[i].subcategoryIds;
            for(j=0;j<subcategoryIdsArray.length;j++)
            {
                let subname=await devDb.Subcategory.findUnique({
                    where:{
                        id:subcategoryIdsArray[j]
                    }
                })
                let a={
                    "id":"",
                    "name":""
                }
                a.id=subname.id;
                a.name=subname.name;
                tempArray.push(a);
            }
            let json={
                "category":{},
                "subcategory":[]
            }
            let a1={
                "id":"",
                "name":"",
            }
            a1.id=allCategoriesData[i].id
            a1.name=allCategoriesData[i].name;
            json.category=a1;
            json.subcategory=tempArray;
            categoryJson.push(json);
        }
        console.log(categoryJson);
        const stdQuestion = await devDb.QuestionMetadata.findMany({
            select: {
                id: true,
                question: true,
            },
            where: {
                categoryIds: { equals: ["1"] },
                subcategoryIds: { equals: ["1"] }
            }
        });

        stdQuestion.sort((a, b) => a.id - b.id);

        console.log(stdQuestion)
        let categoryPart = categoryJson.map((C) => {
            let subcategories = C.subcategory.map((sub, i) => {
                return `{ Id: ${sub.id} , Name : ${sub.name} } ,`;
            }).join(' ');
            return `{ Main category :- Id:${C.category.id}, Name: ${C.category.name} } ,\nsubcategories:- ${subcategories} \n`;
        }).join('');
        let prmpt;
        let chunkSize=10;
        for (let i = 0; i < stdQuestion.length; i += chunkSize) {
            let selectedArray = stdQuestion.slice(i, i + chunkSize);
            let questionsPart = selectedArray.map((q, i) => {
                return `{ Id:${q.id} , Question: ${q.question} } \n`;
            }).join('');
        
            // Constructed the full prompt
            prmpt = `
            Given the following medical question, categorize it into the relevant categories and sub-categories. If you cannot categorize the question into any of the categories listed below,Then Non medical Category is suitable for them.

            
            Example:
            Main category: { Id: 34567b69-a569-4d34-9640-1797b0e9bb5d , Name: General Orthopedics },
            subcategories: { Id: 75b52b67-6147-4635-9e2a-5b2d0b864589 , Name : Terminology }, { Id: b772487f-5051-4103-a70d-ff244ac12096 , Name : Diagnostic Procedures }, { Id: f43fe012-094a-41cb-8d8c-91d428f906c5 , Name : Treatment Protocols }, { Id: 93139ac8-7647-43b5-b6ec-6fbefc651289 , Name : Rehabilitation }

            Now, I will be providing you with the actual categories and subcategories in which you have to categorize the question into.
            
            ${categoryPart}

            Now, I will give you an example on how to categorize a question into multiple categories and subcategories.

            Question: "What are the treatment protocols for a fractured wrist and the rehabilitation process?"
            Expected Output Format is This . Json format NO extra Explanations
            [
                {   
                    "Qid":"34567b69-a569-4d34-9640-1797b0e9bb5d", 
                    "Maincategory":["34567b69-a569-4d34-9640-1797b0e9bb5d,34567b69-a569-4d34-9640-1797b0e9bb5d"],
                    "Subcategories":["75b52b67-6147-4635-9e2a-5b2d0b864589", "f43fe012-094a-41cb-8d8c-91d428f906c5", "93139ac8-7647-43b5-b6ec-6fbefc651289"]
                },
                {   
                    "Qid":"34567b69-a569-4d34-9640-1797b0e9bb5d", 
                    "Maincategory":["34567b69-a569-4d34-9640-1797b0e9bb5d"],
                    "Subcategories":["75b52b67-6147-4635-9e2a-5b2d0b864589", "f43fe012-094a-41cb-8d8c-91d428f906c5", "93139ac8-7647-43b5-b6ec-6fbefc651289"]
                }
            ]
            
            Now I'm Giving List Of Questions which you have to categorize based on the categories and subcategories I have provided you with:
            ${questionsPart}
            `;
           
            try{
                const completion = await groq.chat.completions.create({
                    messages: [
                      { role: 'system', content: 'You are a Professional Medical Expert.' },
                      { role: 'user', content: prmpt }
                    ],
                    model: 'llama3-70b-8192',
                    temperature: 0,
                });
                const response=completion.choices[0].message.content;
                const start = response.indexOf('[');
                const end = response.lastIndexOf(']') + 1;

                
                const arrayPart = response.substring(start, end);
                const questionsArray = JSON.parse(arrayPart);
               
                const updatedPromise=questionsArray.map(async(q)=>{
                    return devDb.QuestionMetadata.update({
                        where:{
                            id:q.Qid,
                        },
                        data:{
                            subcategoryIds:{
                                set:q.Subcategories
                            },
                            categoryIds:{   
                                set :q.Maincategory
                            },
                        }
                    })
                })

                await Promise.all(updatedPromise);
                
                console.log('------------------------ Final Output ------------------')
                Promise.all(updatedPromise).then(resolvedQuestions => {
                    resolvedQuestions.forEach((question, index) => {
                      console.log(`Question ${index + 1}:`);
                      console.log(`ID: ${question.id}`);
                      console.log(`Question: ${question.question}`);
                      console.log(`Related QA IDs: ${question.relatedQAIds}`);
                      console.log(`Category IDs: ${question.categoryIds}`);
                      console.log(`Subcategory IDs: ${question.subcategoryIds}`);
                      console.log('-------------------------');
                    });
                });

                const currentDateTime = new Date();
                const formattedDateTime = formatDateTime(currentDateTime);
                console.log("Processed Last Batch:",formattedDateTime);
                LogData.push(formattedDateTime);

            }catch (error) {
                console.error('Error:', error);
                liveDb.$disconnect();
                devDb.$disconnect();
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message || error,
                });
            }
        }
        
        res.json({
            "successs":true,
            "message":"OK here",
            "logData":LogData
        })
    }catch (error) {
        console.error('Error:', error);
        liveDb.$disconnect();
        devDb.$disconnect();
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message || error,
        });
    }
}
module.exports=categorySubcategoryAssignment;