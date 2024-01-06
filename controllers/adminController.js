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





const getMonthlyUserCount = async () => {
    try {
      const userCountByMonth = await User.aggregate([
        {
          $group: {
            _id: { $month: { $toDate: '$currentDate' } },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            months: {
              $push: {
                month: '$_id',
                count: '$count',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            months: {
              $map: {
                input: [
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
                ],
                as: 'month',
                in: {
                  month: '$$month',
                  count: {
                    $let: {
                      vars: {
                        matchedMonth: { $arrayElemAt: [{ $filter: { input: '$months', as: 'm', cond: { $eq: ['$$m.month', '$$month'] } } }, 0] },
                      },
                      in: { $ifNull: ['$$matchedMonth.count', 0] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $sort: { 'months.month': 1 },
        },
        {
          $project: {
            _id: 0,
            months: 1,
          },
        },
      ]);
  
      return userCountByMonth[0].months;
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };


  const getMonthlyOrderDetails = async () => {
    try {
      const orderDetailsByMonth = await Order.aggregate([
        {
          $group: {
            _id: {
              $month: '$currentData'
            },
            count: { $sum: 1 }, 
          },
        },
        {
          $sort: { _id: 1 }
        },
        {
          $group: {
            _id: null,
            months: {
              $push: {
                month: '$_id',
                count: '$count'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            months: {
              $map: {
                input: [
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
                ],
                as: 'month',
                in: {
                  month: '$$month',
                  count: {
                    $let: {
                      vars: {
                        matchedMonth: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$months',
                                as: 'm',
                                cond: { $eq: ['$$m.month', '$$month'] }
                              }
                            }, 0
                          ]
                        },
                      },
                      in: { $ifNull: ['$$matchedMonth.count', 0] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $unwind: '$months'
        },
        {
          $replaceRoot: { newRoot: '$months' }
        },
        {
          $sort: { month: 1 } 
        }
      ]);
  
      return orderDetailsByMonth;
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };


  const getOrderStatusPercentages = async () => {
    try {
      const statusCounts = {
        'Processing': 0,
        'Cancelled': 0,
        'Delivered': 0,
        'Return': 0,
        'Order Placed': 0
      };
  
      const orderStatuses = await Order.aggregate([
        {
          $group: {
            _id: '$Status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            count: 1
          }
        }
      ]);
  
      orderStatuses.forEach(status => {
        statusCounts[status.status] = status.count;
      });
  
      const totalOrders = Object.values(statusCounts).reduce((acc, curr) => acc + curr, 0);
      const statusPercentages = Object.keys(statusCounts).map(status => {
        const percentage = totalOrders > 0 ? (statusCounts[status] / totalOrders) * 100 : 0;
        return { status, percentage };
      });
  
      console.log(statusPercentages);
      return statusPercentages;
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };
  

  const calculateDeliveredRevenue = async () => {
    try {
      const totalDeliveredRevenue = await Order.aggregate([
        {
          $match: { Status: 'Delivered' }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);
  
      if (totalDeliveredRevenue.length > 0) {
        const deliveredRevenue = totalDeliveredRevenue[0].totalAmount;
        return deliveredRevenue;
      }
  
      return 0; 
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };
  
  const getCurrentMonthRevenue = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; 
  
      const currentMonthRevenue = await Order.aggregate([
        {
          $match: {
            Status: 'Delivered',
            currentData: {
              $gte: new Date(currentDate.getFullYear(), currentMonth - 1, 1),
              $lt: new Date(currentDate.getFullYear(), currentMonth, 0), 
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]);
  
      if (currentMonthRevenue.length > 0) {
        return currentMonthRevenue[0].totalAmount;
      } else {
        console.log('No revenue for the current month.');
        return 0;
      }
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };

  const getStatusPercentage = async () => {
    try {
      const statusPercentage = await Order.aggregate([
        {
          $group: {
            _id: '$Status',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            percentage: { $multiply: [{ $divide: ['$count', { $sum: '$count' }] }, 100] },
          },
        },
      ]);
  
      console.log(statusPercentage);
      return statusPercentage;
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  };
  
  
  
  
  
  
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
                    res.redirect('/admin/dashboard')
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
        let arrayforUser = []
        let arrayforOrder = []
        let arrayforStatus = []
        const monthlyUserCounts = await getMonthlyUserCount();
        monthlyUserCounts.forEach(monthData => {
            const { month, count } = monthData; 
            console.log(`Month: ${month}, User Count: ${count}`);
            arrayforUser.push(count)
        })
        const monthlyOrderCounts = await getMonthlyOrderDetails();
        monthlyOrderCounts.forEach(monthData=>{
            const { month, count } = monthData;
            arrayforOrder.push(count)
        })
        const statuspersantage = await getOrderStatusPercentages();
    
        statuspersantage.forEach(monthData => {
          const { status, percentage } = monthData;
          arrayforStatus.push(percentage);
        });
        const roundedArray = arrayforStatus.map(number => Number(number.toFixed(2)));
        console.log(arrayforStatus)
        const productCount = await Product.countDocuments({})
        const categoryCount = await Category.countDocuments({})
        const orderCount = await Order.countDocuments({})
        const revenue = await calculateDeliveredRevenue()
        const monthlyrevenue = await getCurrentMonthRevenue();
        res.render('dashboard',{
            arrayforUser:arrayforUser,
            arrayforOrder:arrayforOrder,
            productCount:productCount,
            categoryCount:categoryCount,
            orderCount:orderCount,
            revenue:revenue,
            monthlyrevenue:monthlyrevenue,
            arrayforStatus:JSON.stringify(roundedArray)
        })
    }catch(error){
        console.log(error.message)
    }
}
const reportDetails = async(req,res)=>{
    try{
        const SortedData = req.query.sorting
        let orderData
        let startDate = req.query.startDateInput
        let endDate = req.query.endDateInput
        if(SortedData){
            orderData = await Order.find({paymentMethod:SortedData,Status: 'Delivered'})
            console.log('orderData',orderData)
        }
        if(startDate && endDate ){
            const adjustedEndDate = new Date(endDate);
            adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
            adjustedEndDate.setHours(0, 0, 0, 0);
            
            orderData = await Order.find({
                currentData: { $gte: startDate, $lt: adjustedEndDate },
                Status: 'Delivered'
            });
            console.log("i am in true")
        // }else{
        //     console.log("i am in else")
        //     orderData = await Order.find({Status:'Delivered'})
        // }
        }
            console.log("data",orderData)
            res.render('report',{
                orderData,
                startDate,
                endDate,
                SortedData

            })

    }catch(error){
        console.log(error)
    }
}

const salesReport = async(req,res)=>{
    try{
        let orderData
        let startDate = req.body.startDateInput
        let endDate = req.body.endDateInput
        if(startDate && endDate ){
            const adjustedEndDate = new Date(endDate);
            adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
            adjustedEndDate.setHours(0, 0, 0, 0);
            
            orderData = await Order.find({
                currentData: { $gte: startDate, $lt: adjustedEndDate },
                Status: 'Delivered'
            });
        }
            console.log("data",orderData)
            res.render('report',{
                orderData,
                startDate,
                endDate
            })

    }catch(error){
        console.log(error)
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
        const trimmedName = req.body.name.trim();
        const nameWithoutSpaces = trimmedName.replace(/\s+/g, '\\s*');
        const regexPattern = `^${nameWithoutSpaces}$`;
        
        const duplicateData = await Category.countDocuments({
          Name: { $regex: new RegExp(regexPattern, 'i') }
        });
        
        if (duplicateData>0) {
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
        console.log("i am here ",req.body)
        id=req.body.id
        const Data = await Category.deleteOne({_id:id})
        console.log(Data)
        if(Data){
            res.status(200).json({message:'Success'})
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
        let updateStatus
        const id = req.query.orderId;
        const selectedOption = req.query.selectedStatus;
        console.log(id)
        if (!id || !selectedOption) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }
        if(selectedOption == 'Delivered'){
            updateStatus = await Order.findByIdAndUpdate(id, { $set: { Status: selectedOption,paymentStatus:'Success' } });
        }else{
            updateStatus = await Order.findByIdAndUpdate(id, { $set: { Status: selectedOption } });
        }

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
        console.log("i am here")
        console.log(req.body)
        const couponData = new Coupon({
            couponCode:req.body.couponname,
            Discount:req.body.discount,
            expiryDate:req.body.couponDate,
            Limit:req.body.limit,
            minPurchase:req.body.minPurchase
        })
        const data = req.body.couponname
        const duplicateDataCount = await Coupon.countDocuments({
            couponCode: { $regex: new RegExp(`^${data}$`, 'i') } 
        });
        if(!duplicateDataCount){
        const coupon = await couponData.save()
        if (coupon) {
            console.log("hai",coupon)
            res.json({ message: 'Success' });
        } else {
            res.json({ message: "Coupon not found" });
        }
    }else{
        console.log("failed");
        res.json({ message: 'Failed' });
    }
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
        const updatedData = {
            couponCode:req.body.couponname,
            Discount:req.body.discount,
            expiryDate:req.body.couponDate,
            minPurchase:req.body.minPurchase,
            Limit:req.body.limit
        }
        const data = req.body.couponname
        const duplicateDataCount = await Coupon.countDocuments({
            couponCode: { $regex: new RegExp(`^${data}$`, 'i') },
            _id: { $ne: coupon._id } 
        });        
            if(!duplicateDataCount){
            const couponData =await Coupon.findOneAndUpdate(coupon._id,updatedData, { new: true })
            if (couponData) {
                console.log("hai",couponData)
                res.json({ message: 'Success' });
            } else {
                res.json({ message: "Coupon not found" });
            }
        }else{
            console.log("failed");
            res.json({ message: 'Failed' });
        }
        
    }catch(error){
        console.log(error.message);
    }
}




// ============================end of coupon================================


// ============================Banner===============================
const banneranagement = async (req,res)=>{
    try{
        const currentDate = new Date();
        const bannerData = await Banner.find()
        for (const  banner of bannerData) {
            if (banner.expiryDate <= currentDate) {
                await Banner.findByIdAndUpdate(banner._id, { is_active: 0 });
            }
        }
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
             images = [];
            for (const file of req.files) {
                const resizedImg = `resized_${file.filename}`;
                await sharp(file.path)
                    .resize({ width: 900, height: 900 })
                    .toFile(`public/bannerimages/${resizedImg}`);

                images.push(resizedImg);
            }
        }else{
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
        res.redirect('/admin/banner')
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

const loadEditBanner =  async (req,res)=>{
    try{
        id = req.query.bannerId
        const bannerData = await Banner.findById({_id:id})
        res.render('editBanner',{bannerData:bannerData}) 
    }catch(error){
        console.log(error.message)
    }
}
const editBanner = async (req, res) => {
    try {
        let resizedImages = [];        
        const id = req.body.id;
        console.log(id);
        const tickOption = req.body.tickOption
        let existingImages = [];
        if(tickOption=="yes"){
            let existingImages = [];
            const existingBanner = await Banner.findById(id);
            if (existingBanner && existingBanner.Image) {
                existingImages = existingBanner.Image || [];
            }
            console.log("existingImages", existingImages);

            const newImages = req.files.map(file => file.filename);
            console.log("newImages", newImages);

            const removedImages = req.body.removedImages || [];
            console.log("removedImages", removedImages);

            const updatedImages = existingImages
                .concat(newImages)
                .filter(img => !removedImages.includes(img));
            console.log("updatedImages", updatedImages);


            for (const file of updatedImages) {
                const resizedImg = `resized_${file}`;
                await sharp(`public/bannerimages/${file}`)
                    .resize({ width: 900, height: 900 })
                    .toFile(`public/bannerimages/${resizedImg}`);

                resizedImages.push(resizedImg);
            }

        }else{
        const existingBanner = await Banner.findById(id);
        if (existingBanner && existingBanner.Image) {
            existingImages = existingBanner.Image || [];
        }
        console.log("existingImages", existingImages);
        const newImages = req.files.map(file => file.filename);
        console.log("newImages",newImages);
        const removedImages = req.body.removedImages || [];
        console.log("removedImages",removedImages);
        resizedImages = existingImages
            .concat(newImages) 
            .filter(img => !removedImages.includes(img));
        console.log("updatedImages",resizedImages);       
    }
        // const duplicateDataCount = await Product.countDocuments({
        //     productName: { $regex: new RegExp(`^${data}$`, 'i') },
        //     _id: { $ne: id }
        // });
        // if(duplicateDataCount>0){
        //     const bannerData = await Banner.findById({_id:id})
        //     const categoryData = await Category.find({}) 
        //     res.render('edit-product',{products:productData,categoryData:categoryData,message:"Already exist...!"})
        // }else{
        const updatedData = {
            Name: req.body.name,
            Text: req.body.description,
            Target: req.body.target,
            expiryDate: req.body.date,
            Image: resizedImages,
        };
        console.log("body:",req.body)
        
        const bannerData = await Banner.findByIdAndUpdate(id, updatedData, { new: true });
        res.redirect('/admin/banner' );
    // }
        console.log("body:",req.body)
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
    reportDetails,
    salesReport,
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
    loadEditBanner,
    editBanner  


    
}