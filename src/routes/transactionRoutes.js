import express from "express"
import { getUserTransactions, getAllTransactions } from "../controllers/transactionController.js"
import { protect, admin } from "../middleware/authMiddleware.js"

const router = express.Router()

// User routes
router.get("/", protect, getUserTransactions)

// Admin routes
router.get("/admin", protect, admin, getAllTransactions)

export default router
