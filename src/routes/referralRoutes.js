import express from "express"
import {
  generateInvite,
  getReferralStats,
  processReferral,
  creditReferralBonus,
} from "../controllers/referralController.js"
import { protect, admin } from "../middleware/authMiddleware.js"

const router = express.Router()

// @route   GET /api/referrals/invite
router.get("/invite", protect, generateInvite)

// @route   GET /api/referrals/stats
router.get("/stats", protect, getReferralStats)

// @route   POST /api/referrals/process
router.post("/process", processReferral)

// @route   POST /api/referrals/credit
router.post("/credit", protect, admin, creditReferralBonus)

export default router
