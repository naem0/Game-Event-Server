import express from "express"
import {
  createTopUp,
  getUserTopUps,
  getAllTopUps,
  approveTopUp,
  rejectTopUp,
  getTopUpDetails,
} from "../controllers/topUpController.js"
import { protect, admin } from "../middleware/authMiddleware.js"

const router = express.Router()

// User routes
router.post("/", protect, createTopUp)
router.get("/", protect, getUserTopUps)
// router.get("/:id", protect, getTopUpDetails)

// Admin routes
router.get("/admin", protect, admin, getAllTopUps)
router.put("/:id/approve", protect, admin, approveTopUp)
router.put("/:id/reject", protect, admin, rejectTopUp)

export default router
