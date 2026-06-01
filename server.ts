import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for getting macro information of a meal using Gemini
  app.post("/api/meal-macros", async (req, res) => {
    try {
      const { mealName } = req.body;
      if (!mealName) {
        return res.status(400).json({ error: "mealName is required" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `What are the typical macronutrients and calories for a standard portion of "${mealName}"? Please provide the estimated values in grams for protein, carbs, fat, and total calories as integers.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.INTEGER, description: "Total calories in kcal" },
              protein: { type: Type.INTEGER, description: "Total protein in grams" },
              carbs: { type: Type.INTEGER, description: "Total carbohydrates in grams" },
              fat: { type: Type.INTEGER, description: "Total fat in grams" },
            },
            required: ["calories", "protein", "carbs", "fat"],
          },
        },
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        res.json(data);
      } else {
        res.status(500).json({ error: "Failed to generate macros" });
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to fetch from Gemini API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Standard static serving for production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
