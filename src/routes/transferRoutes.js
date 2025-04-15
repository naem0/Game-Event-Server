import express from "express"
import { transferMoney, getUserTransfers } from "../controllers/transferController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

// User routes
router.post("/", protect, transferMoney)
router.get("/", protect, getUserTransfers)

export default router
