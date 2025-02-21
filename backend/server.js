const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();

app.use(express.json());


// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://admin:P!cRpG6Hc6RqTyL@cluster0.cahhmz0.mongodb.net/reviews");
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // Stop the server if DB connection fails
  }
};

// Ensure DB connection before starting the server
connectDB().then(() => {
  const reviewsRoute = require("./routes/reviews");
  app.use("/api/reviews", reviewsRoute);

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});


// Import routes
const recommendationsRoute = require("./routes/recommendations");
const reviewsRoute = require("./routes/reviews");
const seasonalRoute = require("./routes/seasonal");

// Mount routes
app.use("/api/recommendations", recommendationsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/seasonal", seasonalRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
