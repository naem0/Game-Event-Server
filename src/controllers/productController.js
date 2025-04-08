const Products = require('../models/Product');

// 🔹 সব প্রোডাক্ট লিস্ট দেখানো
const getProducts = async (req, res) => {
    try {
        const products = await Products.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔹 একটি প্রোডাক্ট দেখানো
const getProductById = async (req, res) => {
    try {
        const product = await Products.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// delete product
const deleteProduct = async (req, res) => {
    try {
        await Products.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// update product
const updateProduct = async (req, res) => {
    const { name, description, price, countInStock, imageUrl } = req.body;
    try {
        const product = await Products.findById(req.params.id);
        if (product) {
            product.name = name;
            product.description = description;
            product.price = price;
            product.countInStock = countInStock;
            product.imageUrl = imageUrl;
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// add product
const addProduct = async (req, res) => {
    const { name, description, price, countInStock, imageUrl } = req.body;
    try {
        const newProduct = new Products({
            name,
            description,
            price,
            countInStock,
            imageUrl,
        });
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = { getProducts, getProductById, deleteProduct, updateProduct, addProduct };