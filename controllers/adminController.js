const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModal')
const Banner = require('../models/bannerModel')
const bcrypt = require('bcrypt')
const express = require('express')
const app = express();
const sharp = require('sharp')
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
        const orderData =  await Order.find({}).populate('userId').sort({currentData:-1})
        res.render('order',{orderData:orderData})
    }catch(error){
        console.log(error.message)
    }
}

const orderStatus = async (req, res) => {
    try {
        const id = req.query.orderId;
        const selectedOption = req.query.selectedStatus;
        console.log(id)
        if (!id || !selectedOption) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const updateStatus = await Order.findByIdAndUpdate(id, { $set: { Status: selectedOption } });

        if (!updateStatus) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// module.exports = { orderStatus };

const viewsorders =  async(req,res)=>{
    try{
        id=req.query.id
        const orderData = await Order.findById(id).populate('items.productId')

        res.render('view-orders',{orderData})
    }catch(error){
        console.log(error.message)
    }
}

const cancelOrder = async(req,res)=>{
    try{
        console.log("hai i am reached here",req.body)
        const orderData = await Order.findOneAndUpdate({_id:req.body.orderId},{$set:{Status:'Cancelled'}})
if (orderData) {
    for (const item of orderData.items) {
        try {
            console.log("Product ID:", item.productId);
            const editQuantity = await Product.findOneAndUpdate(
                { _id: item.productId },
                { $inc: { Quantity: 1 * item.quantity } }
            );
            console.log("Quantity updated for Product ID:", item.productId);
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    }
    if(orderData.paymentMethod !== 'Cash on delevery'){
        const addToWallet = await User.findOneAndUpdate(
            { _id: orderData.userId },
            { $inc: { wallet: orderData.totalAmount } }
        );
        console.log(addToWallet)
    }
} else {
    console.log("Order not found");
}

        res.redirect('/admin/order')
    }catch(error){
        console.log(error.message)
    }
}


// ==============================end of order details=================================

// =============================Coupon======================================

const couponManagement = async (req,res)=>{
    try{
        const currentDate = new Date();
        const couponData = await Coupon.find()
        for (const coupon of couponData) {
            if (coupon.expiryDate < currentDate) {
                await Coupon.findByIdAndUpdate(coupon._id, { is_active: 0 });
            }
        }
        res.render('coupon',{couponData:couponData})
    }catch(error){
        console.log(error.message)
    }
}

const addCoupons = async (req,res)=>{
    try{
        console.log(req.body)
        const couponData = new Coupon({
            couponCode:req.body.couponname,
            Discount:req.body.discount,
            expiryDate:req.body.expdate,
            Limit:req.body.limit,
            minPurchase:req.body.minPurchase
        })
        const coupon = await couponData.save()
        res.redirect('/admin/coupon') 
    }catch(error){
        console.log(error.message);
    }
}


const updateCouponStatus = async (req,res)=>{
    try{
        id=req.body.couponId
        const currentDate = new Date();
        const couponExpiryDate = await Coupon.findById({_id:id})
        const is_active =req.body.is_active
        
            if (couponExpiryDate.expiryDate > currentDate) {
                let changeStatus 
                if(is_active==1){
                    changeStatus=0;
                }else{
                    changeStatus=1;
                }
                const couponData = await Coupon.findOneAndUpdate({_id:id},{$set:{is_active:changeStatus}})
                res.status(200).json({ message: "Success" });
                console.log("i am here at if")
            }else{
                res.status(500).json({ message: "Failed"});
                console.log("i am here at else")

            }  
    }catch(error){
        console.log(error.message);
    }
}


const loadEditCoupon = async (req,res)=>{
    try{
        const couponId=req.query.couponId
        const couponData = await Coupon.findById({_id:couponId})
        console.log(couponData)
        res.render('editcoupon',{couponData:couponData})
    }catch(error){
        console.log(error.message)
    }
}


const EditCoupon =  async (req,res)=>{
    try{
        id=req.body.id
        const coupon = await Coupon.findById({_id:id})
        console.log(req.body)
        const updatedData = {
            couponCode:req.body.couponname,
            Discount:req.body.discount,
            expiryDate:req.body.expdate,
            minPurchase:req.body.minPurchase,
            Limit:req.body.limit
        }
        const couponData =await Coupon.findOneAndUpdate(coupon._id,updatedData, { new: true })
        if(couponData){
            res.redirect('/admin/coupon')
        }
    }catch(error){
        console.log(error.message);
    }
}




// ============================end of coupon================================


// ============================Banner===============================
const banneranagement = async (req,res)=>{
    try{
        const bannerData = await Banner.find()
        console.log("bannerData",bannerData);
       res.render('banner',{bannerData:bannerData})
    }catch(error){
        console.log(error.message)
    }
}

const loadAddBanner = async (req,res)=>{
    try{
        res.render('add-banner')
    }catch(error){
        console.log(error.message)
    }
}


const addBanner = async (req,res)=>{
    try{
        let images
        const tickOption = req.body.tickOption
        if(tickOption=="yes"){
            console.log("i am in true");
             images = [];
            for (const file of req.files) {
                const resizedImg = `resized_${file.filename}`;
                await sharp(file.path)
                    .resize({ width: 470, height: 470 })
                    .toFile(`public/bannerimages/${resizedImg}`);

                images.push(resizedImg);
            }
        }else{
            console.log("i am in else");
             images = req.files.map(file => file.filename);
        }
            
        const Data = new Banner({
            Name:req.body.bannername,
            Text:req.body.text,
            Target:req.body.target,
            expiryDate:req.body.date,
            Image:images
        })
        await Data.save()
        res.redirect('/admin/addbanner')
    }catch(error){
        console.log(error.message)
    }
}

const blockBanner = async (req,res)=>{
    try{
        id=req.body.couponId
        const currentDate = new Date();
        const bannerExpiryDate = await Banner.findById({_id:id})
        const is_active =req.body.is_active
        
            if (bannerExpiryDate.expiryDate > currentDate) {
                let changeStatus 
                if(is_active==1){
                    changeStatus=0;
                }else{
                    changeStatus=1;
                }
                const couponData = await Banner.findOneAndUpdate({_id:id},{$set:{is_active:changeStatus}})
                res.status(200).json({ message: "Success" });
                console.log("i am here at if")
            }else{
                res.status(500).json({ message: "Failed"});
                console.log("i am here at else")

            }  
    }catch(error){
        console.log(error.message);
    }
}

const editBanner =  async (req,res)=>{
    try{
        
       
    }catch(error){
        console.log(error.message)
    }
}


// ==========================End of Banner=================================



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
    orderStatus,
    viewsorders,
    viewsorders,
    cancelOrder,
    couponManagement,
    addCoupons,
    updateCouponStatus,
    loadEditCoupon,
    EditCoupon,
    banneranagement,
    loadAddBanner,
    addBanner,
    blockBanner,
    editBanner  


    
}