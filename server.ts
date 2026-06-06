import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily for production stability
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY env variable is absent. Using beautiful local fallback engine.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// POST endpoint for user's personalized mental meditation mapping
app.post("/api/meditate", async (req, res) => {
  try {
    const { moodScore, stressLevel, heartRate, hrv, primaryStressors, timeOfDay } = req.body;
    
    const client = getGemini();

    if (!client) {
      // Local highly-adaptive system fallback if API key is not resolved yet
      const fallbackBreathingIn = stressLevel > 7 ? 5 : 4;
      const fallbackHold = stressLevel > 7 ? 5 : 4;
      const fallbackExhale = stressLevel > 7 ? 7 : 4;
      const stressName = primaryStressors && primaryStressors.length > 0 ? primaryStressors.join(", ") : "daily routine";

      return res.json({
        title: "Calm Mind Horizon (Standby Mode)",
        quote: "Quiet physical signals, check sensory sights, and let passing stressors roll away like tides.",
        techniques: [
          `Calming Box Breath cycle: Inhale for ${fallbackBreathingIn}s, hold for ${fallbackHold}s, then exhale steadily for ${fallbackExhale}s.`,
          `Sensory Grounding: Trace 3 beautiful colors on your current visual interface to lower somatic physical alerts.`,
          `Stress release: Soften your shoulders and release muscle tension linked to: ${stressName}.`
        ],
        sensoryFocus: "Gaze at a relaxing deep-teal visual pulse. Observe the smooth breathing rhythms designed to reset your active autonomic balance.",
        durationMinutes: 5,
        targetBPMReduction: stressLevel > 7 ? 12 : 5,
        isFallback: true
      });
    }

    // Contact Gemini flash for a responsive medical/mindful routine
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
        Generate a personalized mental health meditation routine, physical breathing loops, and visual-focus cues based on these metrics:
        - Self-Assessed Mood: ${moodScore}/10 (Where 1 is distressed, 10 is wonderful)
        - Self-Assessed Stress: ${stressLevel}/10 (Where 1 is pure peace, 10 is hyper-alert stress)
        - Wearable Physiology: Heart Rate of ${heartRate} BPM (Avg: 60-100) and HRV of ${hrv} ms (Lower hrv denotes stress state)
        - Main Stress Factors: ${primaryStressors && primaryStressors.length > 0 ? primaryStressors.join(", ") : "General wellness maintenance"}
        - Current context: ${timeOfDay || "Quiet Hour"}

        Please return a strictly formatted JSON response. Do not include markdown tags, preamble, or footer. Just return the valid parsed JSON representing the following structure:
        {
          "title": "A short, poetic title for their routine (e.g. 'Ocean Rhythm Transition', 'Alleviating Workspace Strain')",
          "quote": "A helpful quotation or thought placeholder for mindful centering",
          "techniques": [
            "Tailored breathing instructions based on their HRV/heart rates",
            "A specific visual targeting cue",
            "A targeted relaxation release addressing their key stressors"
          ],
          "sensoryFocus": "A brief sensory recommendation highlighting soft color themes or background tones used for visual rhythm tracking",
          "durationMinutes": 5,
          "targetBPMReduction": 8
        }
      `,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ ...parsedData, isFallback: false });

  } catch (error) {
    console.error("Express Gemini API Error handler triggered:", error);
    res.status(500).json({
      error: "Unable to generate personalized routine",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Start Express Application with Vite/Static handlers
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node Express Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
