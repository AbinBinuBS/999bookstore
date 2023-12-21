const express=require('express')
const user_route=express()
const bodyparser=require('body-parser')
user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}))

const userController = require('../controllers/userCountroller')

user_route.set('view engine','ejs')
user_route.set('views','./views/user')

const session = require('express-session')
const config = require('../config/config')

user_route.use(session({secret:config.sessionSecret}))

const auth = require('../middileware/auth')

const multer = require('multer')
const path = require ('path')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/userimages'))
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name)
    }
})
const upload = multer({storage:storage})

user_route.use(express.static('public'))





user_route.get('/',auth.isLogout,userController.userLogin)
user_route.post('/',userController.verifyLogin)

user_route.get('/logout',userController.userLogout)


user_route.get('/register',auth.isLogout,userController.registerLogin)
user_route.post('/register',upload.single('image'),userController.insertUser)

// user_route.get('/getOtp',userController.getOtp)
user_route.post('/verifyOtp',userController.verifyOtp)

user_route.get('/home',auth.isLogin,userController.homePage)

user_route.get('/product',auth.isLogin,userController.productPage)

user_route.get('/productList',auth.isLogin,userController.productListing)
user_route.get('/bookList',auth.isLogin,userController.BookDisplay)
user_route.get('/cart',userController.cartManagement)
user_route.get('/addtocart',userController.addToCart)
user_route.post('/cart',userController.cartManagementAddtocart)

user_route.get('/deleteCartitem',userController.deleteCartitem)
user_route.get('/quantitymanagement',userController.quantityCheck)

user_route.get('/checkout',userController.checkoutOrder)
user_route.post('/checkout',userController.checkoutaddress)
user_route.post('/proceedtoPayment',userController.paymentManagement)
user_route.get('/account',userController.accountManagment)
user_route.get('/orderstatus',userController.cancerlOrReturn)
user_route.post('/orderstatus',userController.cancelOrder)
user_route.get('/editAddress',userController.showeditaddress)
user_route.post('/editAddress',userController.editaddress)
user_route.post('/editProfile',userController.profileEdit)
user_route.post('/changePassword',userController.changePassword)
user_route.get('/deleteAddress',userController.deleteAddress)

user_route.get('/hello',userController.hai)






module.exports = user_route;