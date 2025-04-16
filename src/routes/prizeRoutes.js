import express from "express"
import {
  createPrizeRequest,
  getUserPrizeRequests,
  getAllPrizeRequests,
  getPrizeRequestDetails,
  processPrizeRequest,
  distributePrizeMoney,
  getRecentTournaments,
} from "../controllers/prizeController.js"
import { protect, admin } from "../middleware/authMiddleware.js"

const router = express.Router()

// User routes
router.get("/recent-tournaments", protect, getRecentTournaments)
router.post("/", protect, createPrizeRequest)
router.get("/", protect, getUserPrizeRequests)
router.get("/:id", protect, getPrizeRequestDetails)

// Admin routes
router.get("/admin", protect, admin, getAllPrizeRequests)
router.put("/:id/process", protect, admin, processPrizeRequest)
router.post("/distribute", protect, admin, distributePrizeMoney)

export default router
