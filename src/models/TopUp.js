import mongoose from "mongoose"

const topUpSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    min: 1,
  },
  transactionId: {
    type: String,
    trim: true,
  },
  slipImage: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  notes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field on save
topUpSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

const TopUp = mongoose.model("TopUp", topUpSchema)

export default TopUp
