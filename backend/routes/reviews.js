const express = require("express");
const router = express.Router();
const axios = require("axios");

const GOOGLE_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// GET /api/reviews?place=Paris
router.get("/", async (req, res) => {
  const { place } = req.query;
  if (!place) {
    return res.status(400).json({ error: "Place is required." });
  }

  try {
    // Construct a prompt to get 3 reviews for the place
    const prompt = `Generate 10 reviews for a tourist attraction in ${place}. 
Provide a username, rating (out of 5), and review text for each review. 
Format the response as JSON:
[
  { "username": "User1", "rating": 4, "review": "Review text here" },
]`;

    // Send request to the Gemini API
    const response = await axios.post(
      `${GOOGLE_GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    // Extract AI-generated text from the response
    let generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    generatedText = generatedText.trim();

    // Remove markdown code block markers (e.g., ```json ... ```)
    generatedText = generatedText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Parse the JSON output from Gemini
    let reviews;
    try {
      reviews = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "Error parsing AI response." });
    }

    // Ensure we return an array of reviews
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.json({ message: "No reviews found." });
    }

    return res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    return res.status(500).json({ error: "Error fetching reviews." });
  }
});

module.exports = router;
