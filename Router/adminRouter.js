const express=require('express')
const admin_route=express()
const bodyparser=require('body-parser')
admin_route.use(bodyparser.json());
admin_route.use(bodyparser.urlencoded({extended:true}))
const upload=require('../config/multer')
const bannerUplods = require('../config/bannerMulter')

const adminController = require('../controllers/adminController')



const session = require('express-session')
const config = require('../config/config')

admin_route.use(session({secret:config.sessionSecret}))

const adminAuth = require('../middileware/adminAuth')


admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')


const path = require ('path')





admin_route.get('/',adminAuth.isLogout,adminController.adminLogin)
admin_route.post('/',adminAuth.isLogout,adminController.verifyLogin)

admin_route.get('/logout',adminAuth.isLogin,adminController.adminLogout)

admin_route.get('/dashboard',adminAuth.isLogin,adminController.adminDashboard)

admin_route.get('/customer',adminAuth.isLogin,adminController.customerList)
admin_route.get('/activeuser',adminAuth.isLogin,adminController.activeList)
admin_route.get('/Unactive-user',adminAuth.isLogin,adminController.uactiveList)

admin_route.post('/blockCustomer',adminAuth.isLogin,adminController.customerBlock)

admin_route.get('/product',adminAuth.isLogin,adminController.productManagement)

admin_route.get('/addproduct',adminAuth.isLogin,adminController.loadProduct)
admin_route.post('/addproduct',adminAuth.isLogin,upload.array('image',5),adminController.addProduct)

admin_route.get('/edit-product',adminAuth.isLogin,adminController.loadEditProduct)
admin_route.post('/edit-product',adminAuth.isLogin,upload.array('image',5),adminController.editProduct)

admin_route.post('/deleteproduct',adminAuth.isLogin,adminController.deleteProduct)

admin_route.get('/category',adminAuth.isLogin,adminController.categoryManagement)
admin_route.post('/add-category',adminAuth.isLogin,upload.single('image'),adminController.addCategory)
admin_route.post('/block-category',adminAuth.isLogin,adminController.categoryBlock)


admin_route.get('/editcategory',adminAuth.isLogin,adminController.loadEditCategory)
admin_route.post('/editcategory',adminAuth.isLogin,upload.single('image'),adminAuth.isLogin,adminController.editCategory)

admin_route.post('/deletecategory',adminAuth.isLogin,adminController.deleteCategory)
admin_route.get('/order',adminAuth.isLogin,adminController.orderManagement)

admin_route.get('/orderStatus',adminAuth.isLogin,adminController.orderStatus)
admin_route.get('/vieworders',adminController.viewsorders)
admin_route.post('/orderstatus',adminController.cancelOrder)
admin_route.get('/coupon',adminController.couponManagement)
admin_route.post('/coupon',adminController.addCoupons)
admin_route.post('/updateCouponStatus',adminController.updateCouponStatus)
admin_route.get('/editCoupon',adminController.loadEditCoupon)
admin_route.post('/editCoupon',adminController.EditCoupon)
admin_route.get('/banner',adminController.banneranagement)
admin_route.get('/addbanner',adminController.loadAddBanner)
admin_route.post('/addbanner',bannerUplods.array('image',5),adminController.addBanner)
admin_route.post('/updateBannerStatus',adminController.blockBanner)
admin_route.post('/editBanner',adminController.editBanner)










module.exports = admin_route;
