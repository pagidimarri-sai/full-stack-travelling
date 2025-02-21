const express = require("express");
const axios = require("axios");
const Review = require("../models/review.model");

const router = express.Router();
const GOOGLE_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// GET /api/reviews?place=Paris
router.get("/", async (req, res) => {
  const { place } = req.query;
  if (!place) {
    return res.status(400).json({ error: "Place is required." });
  }

  try {
    // Check if reviews exist in the database
    const existingReview = await Review.findOne({ place });

    if (existingReview) {
      return res.json(existingReview.reviews);
    }

    // If not found, fetch from Gemini
    const prompt = `Give me 10 reviews for ${place}. Provide title, description, and rating (1-5). Format as JSON:
    [
      { "title": "Review Title", "description": "Review text", "rating": 4.5 },
    ]`;

    const response = await axios.post(
      `${GOOGLE_GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    let generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Remove markdown formatting if present
    generatedText = generatedText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let reviews;
    try {
      reviews = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "Error parsing AI response." });
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.json({ message: "No reviews found." });
    }

    // Store the fetched reviews in MongoDB
    await Review.create({ place, reviews });

    return res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    return res.status(500).json({ error: "Error fetching reviews." });
  }
});

module.exports = router;
