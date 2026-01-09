// server/src/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");
const bcrypt = require("bcryptjs");

const connectDB = require("./db");
const Review = require("./models/Review");
const User = require("./models/User");
const generateToken = require("./utils/generateToken");
const auth = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
connectDB();

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ OpenRouter AI Backend with MongoDB is running");
});

// =======================
// 🔐 AUTH ROUTES
// =======================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// =======================
// 🤖 AI CODE REVIEW
// =======================
app.post("/api/review", auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "No code received" });

    const prompt = `
Return ONLY valid JSON:

{
  "issues": [{ "line": 1, "type": "bug | warning | suggestion", "message": "Short explanation" }],
  "summary": "Overall summary",
  "improvedCode": "Full improved code"
}

Code:
${code}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiText = response.data.choices[0].message.content;

    let parsedResult;
    try {
      parsedResult = JSON.parse(aiText);
    } catch {
      parsedResult = { issues: [], summary: aiText, improvedCode: "" };
    }

    const savedReview = await Review.create({
      code,
      review: JSON.stringify(parsedResult),
      user: req.userId,
    });

    res.json({ success: true, result: parsedResult, savedId: savedReview._id });
  } catch (error) {
    console.error("❌ AI Error:", error.message);
    res.status(500).json({ error: "AI review failed" });
  }
});

// server/src/index.js  (add below your /api/review route)
app.post("/api/refactor", auth, async (req, res) => {
  try {
    const { code, language = "javascript", goals = [] } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    // Example goals: ["reduce complexity", "improve readability", "optimize memory"]
    const goalsText = (goals.length > 0) ? goals.join(", ") : "refactor and optimize";

    const prompt = `
You are an expert senior software engineer.

Perform a SMART REFACTORING of the following code.
Goals: ${JSON.stringify(goals)}

Return ONLY valid JSON:

{
  "explanation": "High-level explanation of what you improved",
  "improvedCode": "The fully refactored code",
  "complexity": {
    "before": { "time": "?", "space": "?" },
    "after": { "time": "?", "space": "?" },
    "estimatedSpeedup": "%"
  },
  "methodSuggestions": [
    { "name": "functionName", "reason": "why extraction helps" }
  ]
}

Code:
${code}
`;


    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiText = response.data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch (err) {
      // Fallback if model didn't return perfect JSON
      parsed = {
        improvedCode: aiText,
        changes: [],
        complexity: { before: {}, after: {}, estimatedSpeedup: "" },
        explanation: aiText.slice(0, 1000),
      };
    }

    // Save to DB (mark type 'refactor')
    const saved = await Review.create({
      code,
      review: JSON.stringify(parsed),
      type: "refactor",
      user: req.userId,
    });

    res.json({ success: true, result: parsed, savedId: saved._id });
  } catch (err) {
    console.error("❌ Refactor Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Refactor failed" });
  }
});



// =======================
// 🌐 GITHUB REPOSITORY AUTO-REVIEW (NO TOKEN REQUIRED)
// =======================
app.post("/api/github-review", auth, async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl || !repoUrl.includes("github.com")) {
      return res.status(400).json({ error: "Invalid GitHub URL" });
    }

    // 🔹 Extract owner & repo from URL
    // Example: https://github.com/mahek-jabeen/calculator
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ error: "Could not parse GitHub URL" });
    }

    const owner = match[1];
    const repo = match[2];

    // 🔹 Get full file tree (HEAD branch) recursively
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
    const treeRes = await axios.get(treeUrl);
    const tree = treeRes.data.tree || [];

    // 🔹 File types we care about
    const allowedExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".java",
      ".py",
      ".html",
      ".css",
    ];

    // 🔹 Pick only code files
    const codeFiles = tree.filter(
      (item) =>
        item.type === "blob" &&
        allowedExtensions.some((ext) => item.path.endsWith(ext))
    );

    if (!codeFiles.length) {
      return res.json({
        summary: "No analyzable source code found in this repo.",
      });
    }

    // 🔹 Download file contents (limit to 20 files to stay safe)
    let combinedCode = "";
    const filesToRead = codeFiles.slice(0, 20);

    for (const file of filesToRead) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`;
      const fileRes = await axios.get(rawUrl);

      combinedCode += `\n\n// FILE: ${file.path}\n${fileRes.data}`;
    }

    // 🔹 Build AI prompt
    const prompt = `
You are a senior software engineer.

Given the following repository code (multiple files), provide a structured review:
- Overall architecture & structure
- Bugs / potential runtime issues
- Security risks
- Performance issues
- Code quality suggestions
- Suggestions specific to frontend (if HTML/CSS/JS present)

Return a clear, readable text summary.

CODE:
${combinedCode}
`;

    // 🔹 Call OpenRouter
    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = aiResponse.data.choices[0].message.content;

    return res.json({ summary });
  } catch (error) {
    console.error("❌ GitHub Review Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "GitHub review failed" });
  }
});



// =======================
// 📜 HISTORY (PER USER)
// =======================

app.get("/api/history", auth, async (req, res) => {
  const reviews = await Review.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(reviews);
});

app.delete("/api/history/:id", auth, async (req, res) => {
  await Review.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true });
});

app.delete("/api/history", auth, async (req, res) => {
  await Review.deleteMany({ user: req.userId });
  res.json({ success: true });
});

// =======================
// 👤 USER PROFILE ROUTE
// =======================
app.get("/api/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    const totalReviews = await Review.countDocuments({ user: req.userId });

    res.json({
      user,
      totalReviews,
    });
  } catch (err) {
    console.error("❌ Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});


// ✅ Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
