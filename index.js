const express=require('express')
const app=express()
require("dotenv").config();
const mongoose=require('mongoose')
mongoose.connect(process.env.MONGO_URL)
const nocache = require('nocache')

app.use(nocache())

app.use(express.json())
app.use(express.static('public'));


PORT = process.env.PORT || 4000

// =============user route==============

const userRoute = require('./Router/userRouter')
app.use('/',userRoute)

// =====================================


// ==============admin route==============

const adminRoute =  require('./Router/adminRouter')
app.use('/admin',adminRoute)

// =======================================



app.listen(PORT,()=>{
    console.log("server is running at port 3000.....")
})