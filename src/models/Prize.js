import mongoose from "mongoose"

const prizeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
  },
  tournamentCode: {
    type: String,
    required: true,
  },
  prizeType: {
    type: String,
    enum: ["kill_prize", "winner_prize", "both", "other"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  kills: {
    type: Number,
    default: 0,
  },
  position: {
    type: Number,
    default: 0,
  },
  playerName: {
    type: String,
    required: true,
  },
  playerID: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ["bkash", "nagad"]
  },
  proofImage: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
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
prizeSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

const Prize = mongoose.model("Prize", prizeSchema)

export default Prize
