const express=require('express')
const app=express()
const mongoose=require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/999books')
const nocache = require('nocache')

app.use(nocache())

app.use(express.json())
app.use(express.static('public'));


// =============user route==============

const userRoute = require('./Router/userRouter')
app.use('/',userRoute)

// =====================================


// ==============admin route==============

const adminRoute =  require('./Router/adminRouter')
app.use('/admin',adminRoute)

// =======================================



app.listen(3000,()=>{
    console.log("server is running at port 3000.....")
})