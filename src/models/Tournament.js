import mongoose from "mongoose"

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Solo Time"
  device: { type: String, required: true }, // e.g., "Mobile"
  mood: { type: String, required: true }, // e.g., "Classic"
  tournamentCode: { type: String, required: true }, // e.g., "37538"
  logo: { type: String, required: true }, // e.g., "https://example.com/logo.png"
  coverImage: { type: String, required: true }, // e.g., "https://example.com/cover.png"
  game: { type: String, required: true }, // e.g., "Free Fire"
  description: { type: String, required: true }, // e.g., "Join our exciting solo tournament!"
  type: { type: String, required: true }, // e.g., "Solo"
  version: { type: String, required: true }, // e.g., "TPP"
  map: { type: String, required: true }, // e.g., "Bermuda"
  matchType: { type: String, required: true }, // e.g., "Paid"
  entryFee: { type: Number, required: true }, // e.g., 20
  matchSchedule: { type: Date, required: true }, // e.g., "27/03/2025 at 04:30 PM"
  winningPrize: { type: Number, required: true }, // e.g., 800
  perKillPrize: { type: Number, required: true }, // e.g., 10
  rules: { type: String, required: true }, // Match instructions and rules
  maxPlayers: { type: Number, required: true }, // e.g., 100
  playersRegistered: { type: Number, default: 0 }, // e.g., 0
  isActive: { type: Boolean, default: true }, // e.g., true
  isCompleted: { type: Boolean, default: false }, // e.g., false
  roomId: { type: String, default: "" }, // Room ID for participants
  roomPassword: { type: String, default: "" }, // Room password for participants
  createdAt: { type: Date, default: Date.now },
})

// Generate a unique tournament code before saving
tournamentSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next()
  }

  // Generate a random 5-digit code if not provided
  if (!this.tournamentCode) {
    this.tournamentCode = Math.floor(10000 + Math.random() * 90000).toString()
  }

  next()
})

const Tournament = mongoose.model("Tournament", tournamentSchema)

export default Tournament
