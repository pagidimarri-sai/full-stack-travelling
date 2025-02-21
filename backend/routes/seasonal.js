const express = require("express");
const router = express.Router();
const axios = require("axios");

const GOOGLE_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // Store your Unsplash API key in .env

// Function to fetch an image from Unsplash
const fetchImageFromUnsplash = async (query) => {
  try {
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: { query, per_page: 1, orientation: "landscape" },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    return response.data.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error(`Error fetching image for ${query}:`, error.message);
    return null;
  }
};

// GET /api/seasonal
router.get("/", async (req, res) => {
  try {
    // Construct prompt for seasonal recommendations
    const prompt = `Suggest 6 seasonal places to visit currently. Provide only a JSON list like:
[
  { "place": "Place Name", "description": "Short Description" },
  
]`;

    // Call Gemini API
    const response = await axios.post(
      `${GOOGLE_GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    // Extract AI-generated text and parse JSON
    let generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    generatedText = generatedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let seasonalPlaces;
    try {
      seasonalPlaces = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "Error parsing AI response." });
    }

    if (!Array.isArray(seasonalPlaces) || seasonalPlaces.length === 0) {
      return res.json({ message: "No seasonal recommendations found." });
    }

    // Fetch images for each place from Unsplash
    for (const place of seasonalPlaces) {
      place.image = await fetchImageFromUnsplash(place.place);
    }

    return res.json(seasonalPlaces);
  } catch (error) {
    console.error("Error fetching seasonal recommendations:", error.message);
    return res.status(500).json({ error: "Error fetching seasonal recommendations." });
  }
});

module.exports = router;
