import mongoose from "mongoose"

const tournamentRegistrationSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  playerID: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
})

// Ensure a user can only register once for a tournament
tournamentRegistrationSchema.index({ tournament: 1, user: 1 }, { unique: true })

const TournamentRegistration = mongoose.model("TournamentRegistration", tournamentRegistrationSchema)

export default TournamentRegistration
