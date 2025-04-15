import mongoose from "mongoose"

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["bkash", "nagad"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "rejected"],
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
withdrawalSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema)

export default Withdrawal
