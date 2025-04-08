const Category = require('../models/Category');

// 🔹 সব ক্যাটাগরি লিস্ট দেখানো
const getCategory = async (req, res) => {
    try {
        const category = await Category.find();
        console.log(category);
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// post category
const postCategory = async (req, res) => {
    const category = new Category({
        name: req.body.name,
        description: req.body.description,
    });
    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// delete category
const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// update category
const updateCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            category.name = name;
            category.description = description;
            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCategory, postCategory, deleteCategory, updateCategory };