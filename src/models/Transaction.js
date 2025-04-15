import mongoose from "mongoose"

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["top-up", "referral", "withdrawal", "other"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "referenceModel",
  },
  referenceModel: {
    type: String,
    enum: ["TopUp", "User", "Withdraw", "Tournament"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Transaction = mongoose.model("Transaction", transactionSchema)

export default Transaction
