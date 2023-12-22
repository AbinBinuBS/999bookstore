const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const express = require('express')
const app = express();
app.use(express.urlencoded({extended:true}))
const nodemailer = require('nodemailer')
const session = require('express-session')

// =================password bcryption==================

const securePassword = async(password)=>{

    try{
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    }catch(error){
        console.log(error.message)
    }
}


// =================end of password bcryption==================

// =================for sending mail===========================

function generateOTP() {
    const otp = Math.floor(1000 + Math.random() * 9000);
    
    return otp.toString() // Convert to string for a 4-digit format
}
const generatedOTP = generateOTP();

const sendVerifyMail = async(data)=>{

    let mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'skycrowlove@gmail.com',
            pass: 'rete eeaa kcdk pbwm'
        }
    });
     
    let mailDetails = {
        from: 'xyz@gmail.com',
        to: data.email,
        subject: `ypur otp is:${generatedOTP}`,
        text: 'Node.js testing mail for GeeksforGeeks',
        
    };
     
    mailTransporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log('Error Occurs');
        } else {
            console.log(`${generatedOTP}`)
            console.log('Email sent successfully');
        }
    });
}

// ==================end of sending mail========================

// =================user registration=======================

const registerLogin = async(req,res)=>{
    try{
        res.render('register')

    }catch(error){
        console.log(error)
    }
}

const insertUser = async(req,res)=>{
    try{
        console.log(req.body)
        const Data ={
            name:req.body.name,
            email:req.body.email,
            phone:req.body.phone,
            image:req.file.filename,
            password:req.body.password,
            password1:req.body.password1
        } 
        req.session.Data=Data;  

        const userEmail = await User.findOne({email:req.body.email})

        if(userEmail)
        {
            res.render('register',{message:"email already exist.."})
        }else{
            const userPhone = await User.findOne({phone:req.body.phone})
             if(userPhone){
                res.render('register',{message:"phone number already exist.."})
             }else{
                if(Data.password===Data.password1)
                {
                    sendVerifyMail(Data)
                    res.render('registerOtp')
                 console.log("1:"+Data.password+Data.password1)
                }else{
                    console.log("2:"+Data.password+" dub: "+Data.password1)
        
                    res.render('register',{message:"your registration has been failed.."})
        
                }
             }
        }
    }catch(error){
        console.log(error.message)
    }
}

// =================end of user registration=======================

// ==================otp registration========================

const verifyOtp = async(req,res)=>{
    try{

         const spassword = await securePassword(req.session.Data.password)
         const spassword1 = await securePassword(req.session.Data.password1)
        console.log("when created secure password :",spassword)

        const {name,email,phone,image,password,password1}=req.session.Data


        const Otp=req.body.otp
       
       
        if(generatedOTP===Otp)
        {
            const user = new User({
                name:name,
                email:email,
                phone:phone,
                image:image,
                password:spassword,
                is_admin:0,
                password1:spassword1
            })
            const userData = await user.save();
            res.render('login',{message:"Otp verified..."})
        }else{
            res.render('registerOtp',{message:"wrong otp"})
        }
        
        
    }catch(error){
        console.log(error.message)
    }
}

// ==================end of otp registration========================


// =================user login=======================


const userLogin = async(req,res)=>{
    try{
        res.render('login');
    }catch (error){
        console.log(error.message)
    }
} 

const verifyLogin = async(req,res)=>{

    try{
            const email = req.body.email;
            const password = req.body.password;
            console.log(email,password);
         const userData = await User.findOne({email:email})
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if(passwordMatch){
                if(userData.is_varified === 0){
                    res.render('login',{message:"please verify your mail"})
                }else{
                    req.session.user_id = userData._id
                    res.redirect('/home')
                } 
            }else{
                res.render('login',{message:'password is incorrect'})
            }
        }
        else{
            res.render('login',{message:'email is incorrect'})
        }
    }catch(error) {
        console.log(error.message)
    }
}

// =================end of user login=======================

// ==================logout========================


const userLogout = async(req,res)=>{

    try{
        req.session.destroy()
        res.redirect('/')

    }catch(error){
        console.log(error.message)
    }
}



// ======================end of logout=======================

// =======================Home page==========================

const homePage = async(req,res)=>{
    try{
        const activeCategories = await Category.find({ is_active: '1' }).limit(4)       
        const activeCategoryIds = activeCategories.map(category => category._id);

        const bestSeller= await Product.find({ Category: { $in: activeCategoryIds }})
        .populate({
            path: 'Category',
            match: { is_active: '1' },
            select: '-is_active'
        }).limit(8)
       
        const newProduct = await Product.find({ Category: { $in: activeCategoryIds } })
        .populate({
            path: 'Category',
            match: { is_active: '1' },
            select: '-is_active'
        })
        .sort({ currentDate: -1 })
        .limit(8);
         const dicountProduct = await Product.find({}).sort({'currentDate': -1}).limit(12)


        const displayCategory = await Product.find({}).populate('Category')

        const userData = await User.findById({_id:req.session.user_id}).limit(8)
       
        if(userData){
            if(userData.is_varified==1)
            {
            res.render('home',{user:userData,newProduct:newProduct,bestSeller:bestSeller,dicountProduct:dicountProduct ,displayCategory:displayCategory,activeCategories:activeCategories})
            }else{
                delete req.session.user_id
                req.session.save()
                res.redirect('/')
            }
        }
        else{
            res.redirect('/')
        }
    }catch(error){
        console.log(error)
    }
}


// =======================end of Home page==========================

// =======================Product page==============================

const productPage = async(req,res)=>{
    try{
      
        const id = req.query.id ||''
        console.log(id);
        const productData = await Product.findOne({_id:id}).populate('Category')
        const catId=productData.Category._id
        
        const similarProducts = await Product.find({Category:catId})
        const activeCat = await Category.find({_id:catId,is_active:1})

       console.log("activity",activeCat)
        if(activeCat.length>0)
        {
        const userData = await User.findById({_id:req.session.user_id}).limit(8)
        if(userData.is_varified==1)
         {
        res.render('productDetails',{product:productData,similarproduct:similarProducts })
         }else{
            delete req.session.user_id
            req.session.save()
            res.redirect('/')
         }
        }else{
            res.redirect('/home')
        }
    }catch(error){
        console.log(error)
    }
}

// =======================end of Product page==============================


// =======================Book listing=============================

const BookDisplay = async(req,res)=>{
    try{
        const userData = await User.findById({_id:req.session.user_id})
        max = parseFloat(req.query.max);
        min = parseFloat(req.query.min);        
        if (max && min) {
            console.log("true")
            const filterByPrice = await Product.find({ salePrice: { $gte: min, $lte: max } });
           
            console.log("max:",max," ","min",min)
        const activeCategories = await Category.find({ is_active: '1' })
        const activeCategoryIds = activeCategories.map(category => category._id);

        const bookData =  await Product.find({ Category: { $in: activeCategoryIds } })
        .populate({
            path: 'Category',
            match: { is_active: '1' },
            select: '-is_active'
        })
        const categoryData = await Category.find({is_active:1})
        res.render('productListing',{productData:filterByPrice,categoryData:categoryData})
        }else{
            console.log("false")
            
        const activeCategories = await Category.find({ is_active: '1' })
        const activeCategoryIds = activeCategories.map(category => category._id);

        const bookData =  await Product.find({ Category: { $in: activeCategoryIds } })
        .populate({
            path: 'Category',
            match: { is_active: '1' },
            select: '-is_active'
        })
        const categoryData = await Category.find({is_active:1})
        if(userData.is_varified==1)
         {
            res.render('productListing',{productData:bookData,categoryData:categoryData})
         }else{
            delete req.session.user_id
            req.session.save()
            res.redirect('/')
         }
        
        }
        
        
    }catch(error){
        console.log(error.message)
    }
}

const productListing = async (req,res)=>{
    try{
        id=req.query.id
        
        const catData = await Category.findOne({_id:id,is_active:1})
        const catId = catData._id
        const categoryData = await Category.find({is_active:1})
        const productData = await Product.find({Category:catId}).limit(9)
        

        res.render('productListing',{productData:productData,categoryData:categoryData})
    }catch(error){
        console.log(error.message)
    }
}

// ===============================end of blk listing===============================

// =====================================Cart=======================================


const cartManagement = async(req,res)=>{
    try{
        
        const CartData = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');
        
        
        if (CartData) {
           
            res.render('cart', { CartData: CartData });
        } else {
           
            res.render('cart', { CartData: CartData });
        }
    }catch(error){
        console.log(error.message)
    }
}

const cartManagementAddtocart = async(req,res)=>{
    try{
        const CartData = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');
        const hai = req.body.hai
        console.log(hai)
        const id = req.query.id;
        const userId = req.session.user_id;
        qty = req.query.qty;
        console.log('qty:', qty);
        const userData = await User.findById(userId);
        const productData = await Product.findById(id);
        let cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            if (productData.Quantity >= qty) {
            cart = new Cart({
                userId: userId,
                product: [{
                    productId: productData._id,
                    Quantity: 1*qty
                }]
            });
        }else{
            return res.status(400).json({ message: "Out of stock" });
        }
        } else {
        const cartProductIndex = cart.product.findIndex(item => item.productId.toString() === id);
        if (cartProductIndex !== -1) {
            let cartDatas = await Cart.findOne(
                { userId: userId, "product.productId": id },
                { "product.$": 1, _id: 0 }
            );
            const specificProduct = cartDatas.product[0];
            console.log("specificProduct.Quantity:", specificProduct.Quantity);

            const totalQuantity = parseInt(specificProduct.Quantity) + parseInt(qty);
            console.log("Total Quantity:", totalQuantity);

            if (productData.Quantity >= specificProduct.Quantity+parseInt(qty)) {
                cart.product[cartProductIndex].Quantity += 1*qty;
            }else{
                return res.status(400).json({ message: "Out of stock" });
            }
        } else {
            let cartDatas = await Cart.findOne(
                { userId: userId, "product.productId": id },
                { "product.$": 1, _id: 0 }
            );
           
            if (productData.Quantity >= qty) {
            cart.product.push({
                productId: productData._id,
                Quantity: 1*qty
            });
        }else{
                return res.status(400).json({ message: "Out of stock" });
            }
        }
    }

    await cart.save();
    res.redirect('/cart')
        }catch(error){
            console.log(error.message)
        }
    }


    const addToCart = async (req, res) => {
        try {
            const id = req.query.id;
            const userId = req.session.user_id;

            const userData = await User.findById(userId);
            const productData = await Product.findById(id);
            console.log('productData',productData.Quantity)

            let cart = await Cart.findOne({ userId: userId });
            if(productData.Quantity==0){
                return res.status(400).json({ message: "Out of stock" });
            }else{
            if (!cart) {
            
                cart = new Cart({
                
                    userId: userId,
                    product: [{
                        productId: productData._id,
                        Quantity: 1
                       
                    }]
                });
            } else {
                const cartProductIndex = cart.product.findIndex(item => item.productId.toString() === id);
                if (cartProductIndex !== -1) {
                    let cartDatas = await Cart.findOne(
                        { userId: userId, "product.productId": id },
                        { "product.$": 1, _id: 0 }
                    );
                    let specificProduct = cartDatas.product[0];
                    if (productData.Quantity > specificProduct.Quantity) {
                        cart.product[cartProductIndex].Quantity += 1;
                        await cart.save();
                        return res.status(200).json({ message: "Quantity updated successfully", cart });
                    } else {
                        return res.status(400).json({ message: "Out of stock" });
                    }
                } else {
                    cart.product.push({
                        productId: productData._id,
                        Quantity: 1
                    });
                }
            }
        }
            await cart.save();
            return res.status(200).json({ message: "added to cart" });

        } catch (error) {
            console.log(error.message);
        }
    }





const quantityCheck = async(req,res)=>{
   
    const userId = req.session.user_id;
    const id = req.query.id;
    const action = req.query.action;
    console.log("i am here:",id)

    try {
        let cart = await Cart.findOne({ userId: userId });
        let cartData = await Cart.findOne(
            { userId: userId, "product.productId": id },
            { "product.$": 1, _id: 0 }
        );
        let specificProduct = cartData.product[0];
        console.log("i am here:",specificProduct.Quantity)

        let productData = await Product.findOne({_id:id})
        if (action === "increase" || action === "decrease") {
            const cartProductIndex = cart.product.findIndex(item => item.productId.toString() === id);
            console.log("cartproductindex:",cartProductIndex)
            if (cartProductIndex !== -1) {
                if (action === "increase") {
                    console.log('product:',productData.Quantity)
                    if (productData.Quantity > specificProduct.Quantity) {
                        cart.product[cartProductIndex].Quantity += 1;
                        await cart.save();
                        return res.status(200).json({ message: "Quantity updated successfully", cart });
                    } else {
                        return res.status(400).json({ message: "Out of stock" });
                    }
                    
                    
                } else {
                    if (cart.product[cartProductIndex].Quantity > 0) {
                        cart.product[cartProductIndex].Quantity -= 1;
                console.log("cart:",cart)

                    } else {
                        return res.status(400).json({ message: "Quantity cannot be less than zero" });
                    }
                }
                await cart.save();
                return res.status(200).json({ message: "Quantity updated successfully", cart });
            } else {
                return res.status(404).json({ message: "Product not found in the cart" });
            }
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    
        }catch(error){
            console.log(error.message)
        }
    }

const deleteCartitem = async (req,res)=>{
    try{
        const userid =req.session.user_id
        const productid = req.query.id
        console.log(productid)
        const removeCart = await Cart.updateOne(
            { userId: userid },
            { $pull: { product: { productId:productid   } } }
          );
      
          if (removeCart.modifiedCount > 0) {
            res.redirect('/cart');
          }
    }catch(error){
        console.log(error)
    }
}




// ==================================End of Cart=====================================

// ===========================check out=============================

const checkoutOrder = async(req,res)=>{
    try{
        id=req.session.user_id
        const userData = await User.findById(id, { address: 1, _id: 0 })
        const CartData = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');
    
        res.render('checkout',{userData:userData,cartData:CartData})
    }catch(error){
        console.log(error.message)
    }
}

const checkoutaddress = async(req,res)=>{
    try{
        const userId=req.session.user_id
        const addressDetails = {
            firstName: req.body.fname,
            lastName: req.body.lname,
            City: req.body.city,
            District: req.body.district,
            State: req.body.state,
            Pincode: req.body.pincode
        };
        console.log(addressDetails)
        const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.address.push(addressDetails); // Add a new address object to the array

    await user.save();

    res.redirect('/checkout');
    }catch(error){
        console.log(error.message)
    }
}

function generateUniqueNumber() {
    const digits = [];
    while (digits.length < 8) {
        const digit = Math.floor(Math.random() * 10);
        if (!digits.includes(digit)) {
            digits.push(digit);
        }
    }
    return digits.join('');
}

const uniqueNumber = generateUniqueNumber();



const paymentManagement = async (req,res)=>{
    try{

       id=req.session.user_id
       totalAmount=req.body.totalAmount
       payment=req.body.paymentMethod
       const userData = await User.findById({ _id: id });
       const addressAtIndex = userData.address[req.body.address];
       const address = {
        firstName: addressAtIndex.firstName,
        lastName: addressAtIndex.lastName,
        Country: addressAtIndex.Country,
        City: addressAtIndex.City,
        District: addressAtIndex.District,
        State: addressAtIndex.State,
        Pincode: addressAtIndex.Pincode
       }
       const cartData = await Cart.findOne({userId:id})

       const productDetails = [];

       if (cartData && cartData.product) {
           cartData.product.forEach(item => {
               const { productId, Quantity } = item; 
               const product = { productId, Quantity, quantity: Quantity }; 
               productDetails.push(product); 
           });
       }
        const order = new Order({
            userId: id,
            items: productDetails, 
            totalAmount: totalAmount,
            paymentMethod: payment,
            address: address,
            orderId:uniqueNumber
           
        });
        await order.save()
        console.log(uniqueNumber)

        if (cartData && cartData.product) {
            for (const item of cartData.product) {
              const productData = item.productId;
              const Quantity = item.Quantity;
              const product = await Product.findById(productData);
              
              if (product && product.Quantity > 0) {
                await Product.findOneAndUpdate(
                  { _id: productData, Quantity: { $gt: 0 } },
                  { $inc: { Quantity: -1*Quantity } }
                );
              } else {
                console.log(`Product ${productData} is out of stock.`);
                // Handle out of stock scenario here
              }
            }
          } else {
            console.log('Cart is empty or does not exist.');
          }
        const deleteCart = await Cart.deleteOne({ userId: id });
        res.status(200).json({ message: 'Order placed successfully' });
    }catch(error){
        console.log(error)
    }
}


const showeditaddress = async (req, res) => {
    try {
        const userId = req.session.user_id; 
        const index = req.query.index; 

        const user = await User.findById(userId);
        const userAddress = user ? user.address[index] : null;
        res.render('editAddress', { userAddress,index:index }); 
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const editaddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const index = req.body.index;
        const user = await User.findById(userId);
        if (user) {
            const userAddress = user.address[index];
            if (userAddress) {
                userAddress.firstName = req.body.fname;
                userAddress.lastName = req.body.lname;
                userAddress.City = req.body.city;
                userAddress.District = req.body.district;
                userAddress.State = req.body.state;
                userAddress.Pincode = req.body.pincode;
                await user.save();
            } else {
                console.log('Address at index not found');
            }
        } else {
            console.log('User not found');
        }

        res.redirect('/checkout');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const deleteAddress =  async(req,res)=>{
    try{
        const userId = req.session.user_id
        const index = req.query.index
        const user = await User.findById(userId)
        if(user){
            const userAddress = user.address[index];
            if(userAddress){
                const deleteAdress =  await User.updateOne({_id:userId},{$pull:{address:userAddress}})
                res.redirect('/account')
                
            }
        }
        console.log("user",user)
    }catch(error){
        console.log(error.message)
    }
}




// =========================== end of check out=============================



// ===============================user Account=============================


const accountManagment = async(req,res)=>{
    try{
        id=req.session.user_id
        const userData = await User.findById({_id:id})
        const orderData = await Order.find({userId:id}).sort({currentData:-1})

        res.render('Account',{userData:userData,orderData:orderData})
    }catch(error){
        console.log(error.message)
    }
}

const cancerlOrReturn = async(req,res)=>{
    try{
        id=req.query.id
        const orderData = await Order.findById({_id:id}).populate('items.productId')
        const cartid = 
        res.render('cancelOrder',{orderData:orderData})
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
            // Handle error here if necessary
        }
    }
} else {
    console.log("Order not found");
}

        res.redirect('/account')
    }catch(error){
        console.log(error.message)
    }
}


const profileEdit = async (req, res) => {
    try {
        const id = req.session.user_id;
        console.log("I am here", id);
        const { name, email, phone } = req.query; 
        console.log("Name:", name, "Email:", email, "Phone:", phone);
        const existEmail = await User.findOne({ _id: { $ne: id }, email: email });
        if(!existEmail){
            const existMobile = await User.findOne({_id:{$ne:id},phone:phone})
            if(!existMobile){
                const userData = await User.findOneAndUpdate(
                    { _id: id },
                    { $set: { name: name, email: email, phone: phone } },
                    { new: true } 
                );
                console.log("i am in true part");
                res.redirect('/account');
            }else{
                let Phone = "Phone number already exists...!"
            return res.status(400).json(Phone);
            }
            
        }else{
            const Email = "Email already exists...!"
            return res.status(400).json(Email);
        }
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error'); 
    }
};


const changePassword = async(req,res)=>{
    try{
        id = req.session.user_id
        const oldPassword = req.query.currentPassword;
        const newPassword = req.query.newPassword
        console.log('i am here',oldPassword)
        const userData = await User.findById({_id:id})
        const passwordMatch = await bcrypt.compare(oldPassword,userData.password)
        if(passwordMatch){
            const spassword = await securePassword(newPassword)
            const changePassword =await User.findOneAndUpdate({_id:id},{$set:{password:spassword}}) 
            res.redirect('/account')
        }else{
            console.log("i am at else part")
            return res.status(400).json({message:"Password is not matching...!"});

        }
        
        console.log("hai",userData)
    }catch(error){
        console.log(error.message)
    }
}

// =================================end of user Account========================

const hai = async (req,res)=>{
    try{
        console.log("hai")
    }catch(error){
        console.log(error)
    }
}








module.exports = {
   
    registerLogin,
    insertUser,
    verifyOtp,
    userLogin,
    verifyLogin,
    userLogout,
    homePage,
    productPage ,
    BookDisplay,
    productListing,
    cartManagement,
    cartManagementAddtocart,
    addToCart,
    deleteCartitem,
    quantityCheck,
    checkoutOrder,
    checkoutaddress,
    showeditaddress,
    editaddress,
    deleteAddress,
    paymentManagement,
    accountManagment,
    cancerlOrReturn,
    cancelOrder,
    profileEdit,
    changePassword,
    hai
    
}