import Transaction from "../models/Transaction.js"

// @desc    Get user's transaction history
// @route   GET /api/transactions
// @access  Private
export const getUserTransactions = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const type = req.query.type || null
    const search = req.query.search || ""

    const query = { user: req.user._id }

    // Add type filter if provided
    if (type && ["top-up", "referral", "withdrawal", "other"].includes(type)) {
      query.type = type
    }

    // Add search filter if provided
    if (search) {
      query.description = { $regex: search, $options: "i" }
    }

    const total = await Transaction.countDocuments(query)
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get user transactions error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get all transactions (admin)
// @route   GET /api/transactions/admin
// @access  Admin
export const getAllTransactions = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const type = req.query.type || null
    const search = req.query.search || ""
    const userId = req.query.userId || null

    const query = {}

    // Add type filter if provided
    if (type && ["top-up", "referral", "withdrawal", "other"].includes(type)) {
      query.type = type
    }

    // Add user filter if provided
    if (userId) {
      query.user = userId
    }

    // Add search filter if provided
    if (search) {
      query.description = { $regex: search, $options: "i" }
    }

    const total = await Transaction.countDocuments(query)
    const transactions = await Transaction.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get all transactions error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
