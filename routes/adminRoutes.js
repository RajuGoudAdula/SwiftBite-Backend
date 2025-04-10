const express = require('express');

const {getCanteensByCollege,deleteCanteen,updateCanteen,createCanteen} = require('../controllers/admin/adminCanteenController.js');
const {getAllColleges,deleteCollege,createCollege,updateCollege} = require('../controllers/admin/adminCollegeController.js');
const {} = require('../controllers/admin/adminDashboardController.js');
const {} = require('../controllers/admin/adminOrderController.js');
const {} = require('../controllers/admin/adminPaymentController.js');
const {} = require('../controllers/admin/adminProfileController.js');
const {} = require('../controllers/admin/adminReviewController.js');
const {} = require('../controllers/admin/adminUserController.js');
const {getAllProducts,getProductById,addProduct,updateProduct,deleteProduct} = require('../controllers/admin/adminProductsController.js');


const authMiddleware = require('../middleware/auth.js')
const router = express.Router();

//For colleges
router.get('/colleges',getAllColleges);
router.post('/colleges',createCollege);
router.put('/colleges/:collegeId',updateCollege);
router.delete('/colleges/:collegeId',deleteCollege);



//For canteens
router.post('/colleges/:collegeId/canteens',createCanteen);
router.get('/colleges/:collegeId/canteens',getCanteensByCollege);
router.put('/colleges/:collegeId/canteens/:canteenId',updateCanteen);
router.delete('/colleges/:collegeId/canteens/:canteenId',deleteCanteen);


//For Products
router.get('/products',getAllProducts);
router.get('/products/:productId',getProductById);
router.post('/products/new-product',addProduct);
router.put('/products/:productId',updateProduct);
router.delete('/products/:productId',deleteProduct);

module.exports = router;