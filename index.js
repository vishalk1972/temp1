const express=require('express')
require("dotenv").config();
const app=express();
app.use(express.json());

app.use('/api/categorize',require('./routes/CategorizationRoutes'))
app.use('/api/query',require('./routes/QueryRoutes'))

const Port=process.env.PORT;
app.listen(Port,()=>{
    console.log(`......Server Listening on PORT ${Port} ........ \n\n`)
})
