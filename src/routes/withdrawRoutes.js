import express from "express"
import {
  createWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  processWithdrawal,
} from "../controllers/withdrawController.js"
import { protect, admin } from "../middleware/authMiddleware.js"

const router = express.Router()

// User routes
router.post("/", protect, createWithdrawal)
router.get("/", protect, getUserWithdrawals)

// Admin routes
router.get("/admin", protect, admin, getAllWithdrawals)
router.put("/:id/process", protect, admin, processWithdrawal)

export default router
