import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  profileImage: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  referralCode: {
    type: String,
    unique: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  pendingReferralBalance: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: 0,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Method to check if password matches
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") && this.referralCode) {
    return next()
  }

  // Hash password
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }

  // Generate referral code if not exists
  if (!this.referralCode) {
    // Generate a unique 8-character code
    this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  next()
})

const User = mongoose.model("User", userSchema)

export default User
