const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();

app.use(express.json());

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
