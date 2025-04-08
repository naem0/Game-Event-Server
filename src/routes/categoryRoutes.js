const { getCategory, postCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const express = require("express");
const router = express.Router();


router.get("/", getCategory);
router.post("/", postCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;