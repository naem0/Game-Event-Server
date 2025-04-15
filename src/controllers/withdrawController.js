import User from "../models/User.js"
import Transaction from "../models/Transaction.js"
import Withdrawal from "../models/Withdrawal.js"

// @desc    Create a new withdrawal request
// @route   POST /api/withdraw
// @access  Private
export const createWithdrawal = async (req, res) => {
  try {
    const { amount, accountNumber, paymentMethod } = req.body

    if (!amount || !accountNumber || !paymentMethod) {
      return res.status(400).json({ message: "Please provide amount, account number, and payment method" })
    }

    // Check if user has enough balance
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" })
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount: Number.parseFloat(amount),
      accountNumber,
      paymentMethod,
      status: "pending",
    })

    // Deduct amount from user balance
    user.balance -= amount
    await user.save()

    // Create transaction record
    await Transaction.create({
      user: user._id,
      amount: -amount,
      type: "withdrawal",
      description: `Withdrawal of ${amount} taka to ${paymentMethod} account ${accountNumber}`,
      reference: withdrawal._id,
      referenceModel: "Withdrawal",
    })

    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        accountNumber: withdrawal.accountNumber,
        paymentMethod: withdrawal.paymentMethod,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    })
  } catch (error) {
    console.error("Create withdrawal error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get user's withdrawal requests
// @route   GET /api/withdraw
// @access  Private
export const getUserWithdrawals = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status || null

    const query = { user: req.user._id }

    // Add status filter if provided
    if (status && ["pending", "completed", "rejected"].includes(status)) {
      query.status = status
    }

    const total = await Withdrawal.countDocuments(query)
    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      withdrawals,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get user withdrawals error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get all withdrawal requests (admin)
// @route   GET /api/withdraw/admin
// @access  Admin
export const getAllWithdrawals = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const status = req.query.status || null
    const userId = req.query.userId || null

    const query = {}

    // Add status filter if provided
    if (status && ["pending", "completed", "rejected"].includes(status)) {
      query.status = status
    }

    // Add user filter if provided
    if (userId) {
      query.user = userId
    }

    const total = await Withdrawal.countDocuments(query)
    const withdrawals = await Withdrawal.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      withdrawals,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get all withdrawals error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Process a withdrawal request (admin)
// @route   PUT /api/withdraw/:id/process
// @access  Admin
export const processWithdrawal = async (req, res) => {
  try {
    const { status, notes } = req.body

    if (!status || !["completed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" })
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: `Withdrawal request is already ${withdrawal.status}` })
    }

    // Update withdrawal status
    withdrawal.status = status
    withdrawal.notes = notes || ""
    await withdrawal.save()

    // If rejected, refund the amount to user's balance
    if (status === "rejected") {
      const user = await User.findById(withdrawal.user)
      if (user) {
        user.balance += withdrawal.amount
        await user.save()

        // Create transaction record for refund
        await Transaction.create({
          user: user._id,
          amount: withdrawal.amount,
          type: "other",
          description: `Refund for rejected withdrawal request`,
          reference: withdrawal._id,
          referenceModel: "Withdrawal",
        })
      }
    }

    res.status(200).json({
      message: `Withdrawal request ${status} successfully`,
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        updatedAt: withdrawal.updatedAt,
      },
    })
  } catch (error) {
    console.error("Process withdrawal error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
