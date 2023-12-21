const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const bcrypt = require('bcrypt')
const express = require('express')
const app = express();
app.use(express.urlencoded({extended:true}))



const adminLogin = async(req,res)=>{
    try{
        res.render('login')

    }catch(error){
        console.log(error.message)
    }
}
const verifyLogin = async(req,res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email})
        if(userData)
        {
            
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if(passwordMatch)
            {
                if(userData.is_admin===1){
                    req.session.admin = userData._id
                    res.render('dashboard')
                }else{
                    res.render('login',{message:"invalid user..."})
                }
            }else{
                res.render('login',{message:"invalid user..."})
            }
        }else{
            res.render('login',{message:"invalid user..."})
        }
    }catch(error){
        console.log(error.message)
    }
}

const adminLogout = async(req,res)=>{
    try{
        req.session.destroy()
        res.redirect('/admin')
    }catch(error){
        console.log(error.message)
    }
}


const adminDashboard = async(req,res)=>{
    try{
        res.render('dashboard')
    }catch(error){
        console.log(error.message)
    }
}

const customerList = async(req,res)=>{
    try{
        const userData = await User.find({is_admin:0})
        console.log(userData)
        res.render('customerList',{users:userData})
    }catch(error){
        console.log(error.message)
    }
}

const activeList = async(req,res)=>{
    try{
        const activeUser = await User.find({is_varified:1,is_admin:0})
        console.log(activeUser)
        res.render('customerList',{users:activeUser})
    }catch(error){
        console.log(error.message)
    }
}

const uactiveList = async(req,res)=>{
    try{
        const activeUser = await User.find({is_varified:0,is_admin:0})
        console.log(activeUser)
        res.render('customerList',{users:activeUser})
    }catch(error){
        console.log(error.message)
    }
}

const customerBlock = async(req,res)=>{
    try{
    
       console.log("Body :", req.body.id)
    const is_verified = req.body.is_varified;

    if( is_verified == 1){
        updateValue = 0
    }else{
        updateValue = 1
    }
    const updatedData =  await User.findByIdAndUpdate({_id:req.body.id},{$set:{is_varified:updateValue}})
    console.log("Updated Data :",updatedData)
    const referringPage = req.headers.referer || '/admin/customer';
        res.redirect(referringPage);

    }catch(error)
    {
        console.log(error)
    }
}




const productManagement = async(req,res)=>{
    try{
        const productData = await Product.find({}).populate('Category')
        res.render('product',{products:productData})
    }catch(error){
        console.log(error.message)
    }
}

const loadProduct = async(req,res)=>{
    try{
        const productsData = await Category.find({})
        res.render('addProduct',{product:productsData})
    }catch(error){
        console.log(error)
    }
}

const addProduct= async(req,res)=>{
    try{
        const catgoryData = await Category.findOne({Name:req.body.category})
        const images = req.files.map(file => file.filename);
        const duplicateData = await Product.findOne({ productName: { $regex: new RegExp(`^${req.body.pname}$`, 'i') } });
        if(duplicateData)
        {
            const categoryData = await Category.find({}) 
                res.render('addProduct',{product:categoryData,message:"already exist....!"})
            
        }else{
        const Data = new Product({
            productName:req.body.pname,
            Author:req.body.author,
            Category:catgoryData._id,
            Description:req.body.description,
            productPrice:req.body.pprice,
            salePrice:req.body.sprice,
            Quantity:req.body.quantity,
            Image:images,
            Publisher:req.body.publisher,
            Country:req.body.country,
            aboutAuthor:req.body.aabout,
            bookWeight:req.body.bweight,
            Pages:req.body.pages
        })
        const productData = await Data.save()
        res.redirect('/admin/product')
        }

    }catch(error){
        console.log(error.message)
    }
}

const loadEditProduct = async(req,res)=>{
    try{
        const id = req.query.id
        const productData = await Product.findById({_id:id}).populate('Category')
        const categoryData = await Category.find({}) 
        if(productData)
        {
            res.render('edit-product',{products:productData,categoryData:categoryData})
        }
        
    }catch(error){
        console.log(error.message)
    }
}



const editProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.findOne({ Name: req.body.category });
        const existingProduct = await Product.findById(id);
        const existingImages = existingProduct.Image || [];
        const newImages = req.files.map(file => file.filename);
        const removedImages = req.body.removedImages || [];
        const updatedImages = existingImages
            .concat(newImages) 
            .filter(img => !removedImages.includes(img));

            const data = req.body.pname
        const duplicateDataCount = await Product.countDocuments({
            productName: { $regex: new RegExp(`^${data}$`, 'i') },
            _id: { $ne: id }
        });
        if(duplicateDataCount>0){
            const productData = await Product.findById({_id:id}).populate('Category')
            const categoryData = await Category.find({}) 
            res.render('edit-product',{products:productData,categoryData:categoryData,message:"Already exist...!"})
        }else{
        const updatedData = {
            productName: req.body.pname,
            Author: req.body.author,
            Category: categoryData._id,
            Description: req.body.description,
            productPrice: req.body.pprice,
            salePrice: req.body.sprice,
            Quantity: req.body.quantity,
            Image: updatedImages,
            Publisher: req.body.publisher,
            Country: req.body.country,
            aboutAuthor: req.body.aabout,
            bookWeight: req.body.bweight,
            Pages: req.body.pages
        };
         
        const productData = await Product.findByIdAndUpdate(id, updatedData, { new: true });
        res.redirect('/admin/product/' );
    }
    } catch (error) {
        console.log(error.message);
       
    }
};



const deleteProduct = async(req,res)=>{
    try{
        const id=req.query.id
        const del = await Product.deleteOne({_id:id})
        if(del)
        {
            res.redirect('/admin/product')
        }
    }catch(error){
        console.log(error.message)
    }
}

const categoryManagement = async(req,res)=>{
    try{
        const productData = await Category.find({})
        if(productData)
        {
            res.render('category',{categories:productData})
        }

    }catch(error)
    {
        console.log(error.message)
    }
}



const addCategory = async (req, res) => {
    try {
        const duplicateData = await Category.findOne({ Name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } });
        if (duplicateData) {
            const productData = await Category.find({})
            res.render('category',{message:" already exist..!",categories:productData});
        } else {
            const Data = new Category({
                Name: req.body.name,
                Image: req.file.filename
            });
            const CategoryData = await Data.save();
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.log(error.message);
    }
};


const loadEditCategory =async(req,res)=>{
    try{
        const id=req.query.id
        const categoryData =await Category.findById({_id:id})
        res.render('edit-category',{categories:categoryData})
    }catch(error){
        console.log(error.message)
    }
}


const editCategory = async(req,res)=>{
    try{
        const id=req.query.id
        const data = req.body.name
        const existingCategory = await Category.findById(id);
        const existingImage = existingCategory.Image || 'defaultImage.jpg'; 
        let newImage = '';
        if (req.file && req.file.filename) {
        newImage = req.file.filename; 
        } else {
        newImage = existingImage; 
        }
        const imagesToUse = newImage.length > 0 ? newImage : existingImage;
        const duplicateDataCount = await Category.countDocuments({
            Name: { $regex: new RegExp(`^${data}$`, 'i') },
            _id: { $ne: id } 
        });
        console.log(duplicateDataCount)
        if(duplicateDataCount>0)
        {
            const categoryData =await Category.findById({_id:id})
            res.render('edit-category',{categories:categoryData,message:"Already exist"})
        }else{
            const CategoryData = await Category.findByIdAndUpdate({_id:id},{$set:{Name:req.body.name,Image:imagesToUse}})
        res.redirect('/admin/category')

        }
    }catch(error){
        console.log(error.message)
    }
}

const deleteCategory = async(req,res)=>{
    try{
        id=req.query.id
        const Data = await Category.deleteOne({_id:id})
        if(Data){
            const referringPage = req.headers.referer || '/admin/category';
            res.redirect(referringPage);
        }
    }catch(error)
    {
        console.log(error.message)
    }
}

const categoryBlock = async(req,res)=>{
    try{
        let is_active=req.body.is_active
        if(is_active==1)
        {
             updateValue = 0
        }else{
             updateValue = 1
        }
        const updatedData = await Category.findByIdAndUpdate({_id:req.body.id},{$set:{is_active:updateValue}})
        const referringPage = req.headers.referer || '/admin/category';
        res.redirect(referringPage);
        

}catch(error)
{
    console.log(error.message)
}
}







// =================================order details===================================

const orderManagement = async(req,res)=>{
    try{
        const orderData =  await Order.find({}).populate('userId')
        res.render('order',{orderData:orderData})
    }catch(error){
        console.log(error.message)
    }
}

const orderStatus = async(req,res)=>{
    try{
        console.log("hai")

        id=req.query.id
        console.log("id",id)
        const selectedOption =req.query.selectedOption
        console.log("option",selectedOption)

        const updateStatus = await Order.findByIdAndUpdate(id, { $set: { Status: selectedOption } });
        res.redirect('/admin/orderStatus')
    }catch(error){
        console.log(error.message)
    }
}






// ==============================end of order details=================================





module.exports = {
    adminLogin,
    verifyLogin,
    adminLogout,
    adminDashboard,
    customerList,
    activeList,
    uactiveList,
    customerBlock,
    productManagement,
    loadProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    deleteProduct,
    categoryManagement,
    addCategory,
    loadEditCategory,
    editCategory,
    deleteCategory,
    categoryBlock,
    orderManagement,
    orderStatus
    


    
}