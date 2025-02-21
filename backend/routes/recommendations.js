const express = require("express");
const router = express.Router();
const axios = require("axios");

const GOOGLE_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // Ensure this is set in your .env file

// Helper function to fetch image from Unsplash
const fetchImageFromUnsplash = async (query) => {
  try {
    const response = await axios.get(UNSPLASH_API_URL, {
      params: { query, per_page: 1, orientation: "landscape" },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    return response.data.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error(`Error fetching image for ${query}:`, error.response?.data || error.message);
    return null;
  }
};

// GET /api/recommendations?place=Paris&companion=friends
router.get("/", async (req, res) => {
  const { place, companion } = req.query;
  if (!place || !companion) {
    return res.status(400).json({ error: "Place and companion type are required." });
  }

  try {
    // Construct prompt for Gemini API
    const prompt = `Suggest 10 tourist attractions in ${place} for someone traveling with ${companion}. 
Provide the name and a short description. Format the response as JSON:
[
  { "title": "Place Name", "description": "Short Description" },
]`;

    // Request recommendations from Gemini API
    const response = await axios.post(
      `${GOOGLE_GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    // Extract and clean AI-generated JSON response
    let generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    generatedText = generatedText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Parse recommendations
    let recommendations;
    try {
      recommendations = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "Error parsing AI response." });
    }

    // Ensure we have valid recommendations
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return res.json({ message: "No recommendations found." });
    }

    // Fetch images for each place from Unsplash
    for (const place of recommendations) {
      place.image = await fetchImageFromUnsplash(`${place.title}`);
    }

    return res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error.message);
    return res.status(500).json({ error: "Error fetching recommendations." });
  }
});

module.exports = router;
