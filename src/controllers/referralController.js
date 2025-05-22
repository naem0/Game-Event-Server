import User from "../models/User.js"
import Transaction from "../models/Transaction.js"
import { successResponse, errorResponse } from "../utils/apiResponse.js"

// @desc    Generate an invite link
// @route   GET /api/referrals/invite
// @access  Private
export const generateInvite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      referralCode: user.referralCode,
      inviteLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
      pendingReferralBalance: user.pendingReferralBalance || 0,
    })
  } catch (error) {
    console.error("Generate invite error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get referral stats
// @route   GET /api/referrals/stats
// @access  Private
export const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const referrals = await User.find({ referredBy: user._id }).select("name email profileImage createdAt")

    res.status(200).json({
      referralCount: user.referralCount,
      balance: user.balance,
      pendingReferralBalance: user.pendingReferralBalance || 0,
      referrals,
    })
  } catch (error) {
    console.error("Get referral stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Process referral registration
// @route   POST /api/referrals/process
// @access  Public
export const processReferral = async (req, res) => {
  try {
    const { referralCode } = req.body

    if (!referralCode) {
      return res.status(400).json({ message: "Referral code is required" })
    }

    // Find the referring user
    const referrer = await User.findOne({ referralCode })
    if (!referrer) {
      return res.status(404).json({ message: "Invalid referral code" })
    }

    return res.status(200).json({
      referrerId: referrer._id,
      referrerName: referrer.name,
    })
  } catch (error) {
    console.error("Process referral error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Credit referral bonus when referred user makes a top-up
// @route   POST /api/referrals/credit
// @access  Private/Admin
export const creditReferralBonus = async (req, res) => {
  try {
    const { userId, amount } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ message: "User ID and amount are required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.balance += amount
    user.pendingReferralBalance = Math.max(0, (user.pendingReferralBalance || 0) - amount)
    await user.save()

    // Create transaction record
    await Transaction.create({
      user: user._id,
      amount: amount,
      type: "referral",
      description: `Referral bonus credited`,
    })

    res.status(200).json({
      message: `${amount} added to user's balance`,
      newBalance: user.balance,
      pendingReferralBalance: user.pendingReferralBalance,
    })
  } catch (error) {
    console.error("Credit referral error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Add pending referral balance when a user registers with referral code
// @route   POST /api/referrals/pending
// @access  Private/Admin
export const addPendingReferralBalance = async (req, res) => {
  try {
    const { referrerId } = req.body

    if (!referrerId) {
      return res.status(400).json({ message: "Referrer ID is required" })
    }

    const referrer = await User.findById(referrerId)
    if (!referrer) {
      return res.status(404).json({ message: "Referrer not found" })
    }

    // Add to pending balance
    referrer.pendingReferralBalance = (referrer.pendingReferralBalance || 0) + 20
    referrer.referralCount += 1
    await referrer.save()

    return res.status(200).json({
      message: "Pending referral balance added successfully",
      pendingReferralBalance: referrer.pendingReferralBalance,
    })
  } catch (error) {
    console.error("Add pending referral error:", error)
    return res.status(500).json({ message: "Server error" })
  }
}
