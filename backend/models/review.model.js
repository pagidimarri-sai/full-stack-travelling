const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  place: { type: String, required: true, unique: true },
  reviews: [
    {
      title: String,
      description: String,
      rating: Number, // If ratings are available
    },
  ],
  lastFetched: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);
