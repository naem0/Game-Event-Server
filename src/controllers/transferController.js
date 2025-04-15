import User from "../models/User.js"
import Transaction from "../models/Transaction.js"
import Transfer from "../models/Transfer.js"

// @desc    Transfer money to another user
// @route   POST /api/transfer
// @access  Private
export const transferMoney = async (req, res) => {
  try {
    const { amount, recipientNumber } = req.body

    if (!amount || !recipientNumber) {
      return res.status(400).json({ message: "Please provide amount and recipient number" })
    }

    // Check if user has enough balance
    const sender = await User.findById(req.user._id)
    if (!sender) {
      return res.status(404).json({ message: "User not found" })
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" })
    }

    // Find recipient by phone number
    const recipient = await User.findOne({ phone: recipientNumber })
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" })
    }

    // Prevent self-transfer
    if (sender._id.toString() === recipient._id.toString()) {
      return res.status(400).json({ message: "You cannot transfer money to yourself" })
    }

    // Create transfer record
    const transfer = await Transfer.create({
      sender: sender._id,
      recipient: recipient._id,
      amount: Number.parseFloat(amount),
    })

    // Update balances
    sender.balance -= amount
    recipient.balance += amount

    await sender.save()
    await recipient.save()

    // Create transaction records
    await Transaction.create({
      user: sender._id,
      amount: -amount,
      type: "transfer",
      description: `Transfer of ${amount} taka to ${recipient.name}`,
      reference: transfer._id,
      referenceModel: "Transfer",
    })

    await Transaction.create({
      user: recipient._id,
      amount: amount,
      type: "transfer",
      description: `Received ${amount} taka from ${sender.name}`,
      reference: transfer._id,
      referenceModel: "Transfer",
    })

    res.status(201).json({
      message: "Money transferred successfully",
      transfer: {
        id: transfer._id,
        amount: transfer.amount,
        recipient: recipient.name,
        createdAt: transfer.createdAt,
      },
    })
  } catch (error) {
    console.error("Transfer money error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @desc    Get user's transfers
// @route   GET /api/transfer
// @access  Private
export const getUserTransfers = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10

    // Find transfers where user is either sender or recipient
    const query = {
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    }

    const total = await Transfer.countDocuments(query)
    const transfers = await Transfer.find(query)
      .populate("sender", "name")
      .populate("recipient", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(200).json({
      transfers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    })
  } catch (error) {
    console.error("Get user transfers error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
