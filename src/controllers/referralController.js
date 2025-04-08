import User from "../models/User.js"

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

// @desc    Credit referral bonus
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
    await user.save()

    res.status(200).json({
      message: `${amount} added to user's balance`,
      newBalance: user.balance,
    })
  } catch (error) {
    console.error("Credit referral error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
