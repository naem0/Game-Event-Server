const express = require('express');
const { getProducts, getProductById, deleteProduct, updateProduct, addProduct } = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.delete('/:id', deleteProduct);
router.put('/:id', updateProduct);
router.post('/', addProduct);

module.exports = router;