require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:8000", // Allow frontend to connect
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};
app.use(cors(corsOptions));


// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gameDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => console.log("✅ MongoDB Connected"));


const chatSchema = new mongoose.Schema({
  npcName: String,
  messages: [
    {
      sender: String, // "Detective" or "NPC"
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Chat = mongoose.model("Chat", chatSchema);

// ✅ **CLEAR CHATS WHEN SERVER STARTS**
async function clearChatHistory() {
  try {
    await Chat.deleteMany({});
    console.log("🗑️ All chat history cleared on server restart.");
  } catch (error) {
    console.error("❌ Error clearing chat history:", error);
  }
}

clearChatHistory();

// ✅ SAVE CHAT MESSAGE
app.post("/chat", async (req, res) => {
  const { npcName, sender, text } = req.body;
  console.log(`📨 Received chat: NPC: ${npcName}, Sender: ${sender}, Text: ${text}`);

  if (!npcName || !sender || !text) {
    return res.status(400).json({ error: "Missing chat details" });
  }

  try {
    let chat = await Chat.findOne({ npcName });
    if (!chat) {
      chat = new Chat({ npcName, messages: [] });
    }

    chat.messages.push({ sender, text, timestamp: new Date() });
    await chat.save();

    console.log("✅ Chat saved successfully");
    res.status(200).json({ message: "Chat saved" });
  } catch (error) {
    console.error("❌ Error saving chat:", error);
    res.status(500).json({ error: "Failed to save chat" });
  }
});

// ✅ Endpoint to fetch chat history for a specific NPC
app.get("/chat/:npcName", async (req, res) => {
  try {
    const { npcName } = req.params;
    console.log(`🔎 Fetching chat history for: ${npcName}`);

    const messages = await Chat.find({ npcName }).sort({ timestamp: 1 });
    res.json({ messages });
  } catch (error) {
    console.error(" Error fetching chat history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Fetch chat history for ALL NPCs
app.get("/chat/all", async (req, res) => {
  try {
    console.log(" Fetching chat history for all NPCs");

    let allChats = await Chat.find({});
    let chatHistory = {};

    allChats.forEach(chat => {
      chatHistory[chat.npcName] = chat.messages;
    });

    res.json(chatHistory);
  } catch (error) {
    console.error(" Error fetching all chat history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/chat/history', async (req, res) => {
  try {
    let chatMessages = await Chat.find(); // ✅ Fetch all stored chat messages from MongoDB
    res.json({ messages: chatMessages });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve chat history." });
  }
});

// ✅ OpenAI API Route
app.post("/api/get-ai-response", async (req, res) => {
  const { npcName, playerMessage, collectedEvidence } = req.body;

  let prompt = `
  You are ${npcName}, an NPC in a detective game investigating workplace harassment.

  <strong>Case Overview:</strong>
  - <strong>Amy</strong> is the victim and recently had a dispute with bill regarding promotion.
  - <strong>Emily</strong> is the suspect.
  - Bill’s laptop sent an <strong>anonymous email</strong> while he was gone.
  - Alex’s laptop has a <strong>draft</strong> of a threatening email.
  - Emily’s laptop has <strong>suspicious browser history</strong> but clean emails.

  <strong>Your Role:</strong>
  ${npcName === "Amy" ? "<strong>You are the victim who received email at 8:30PM.</strong> You are scared and confused." : ""}
  ${npcName === "Emily" ? "<strong>You are the prime suspect who did it.</strong> You might deny involvement." : ""}
  ${npcName === "Alex" ? "<strong>You are a neutral witness.</strong> You were not at office at the time of incident but recently you had dispute with amy regarding promotion. Provide useful but non-accusatory information." : ""}
  ${npcName === "Bill" ? "<strong>You are a witness.</strong> You just found out an email was sent from your laptop while you were away and saw shadowy figure while returning." : ""}

  The detective just asked: "<strong>${playerMessage}</strong>".

  <strong>Collected Evidence:</strong> ${collectedEvidence.length > 0 ? collectedEvidence.join(", ") : "No evidence presented"}

  Respond realistically based on your knowledge.
  `;

  try {
    let response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    let data = await response.json();
    res.json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ message: "Error processing AI request" });
  }
});

// ✅ OpenAI Report Route
app.post("/api/get-ai-report", async (req, res) => {
  const { reportData } = req.body;
  let isCorrectSuspect = reportData.suspect.toLowerCase() === "emily";

  let prompt = `
  You are an AI investigator reviewing a detective’s case. The detective selected <strong>"${reportData.suspect}"</strong> as the culprit.

  <strong>Case Overview:</strong>
  - <strong>Amy</strong> is the victim.
  - <strong>Emily</strong> is the actual culprit.
  - Bill left at <strong>8:30 PM</strong>; a shadowy figure appeared between <strong>8:30-8:50 PM</strong>.
  - Bill’s laptop sent an <strong>anonymous email</strong> while he was absent.
  - Alex’s laptop contains a <strong>draft</strong> of a threatening email.
  - Emily’s laptop has <strong>suspicious browser history</strong> but clean emails.
  - Login records show both <strong>Emily and Bill</strong> were logged in at the time of the incident.

  <strong>Detective's Reasoning:</strong>
  "<strong>${reportData.detectiveReason}</strong>"

  <strong>Collected Evidence:</strong>
  ${reportData.evidence.length > 0 ? reportData.evidence.join(", ") : "No key evidence was collected."}

  <strong>Chat History with NPCs:</strong>
  ${reportData.chatHistory}

  <strong>Evaluate the detective’s conclusion:</strong>
  - Did they correctly identify Emily? ${isCorrectSuspect ? "<strong>✅ Yes, they correctly identified the culprit.</strong>" : "<strong>❌ No, the selected suspect is incorrect.</strong>"}
  - Was the reasoning strong? Analyze if the detective used logical deduction based on the evidence.
  - Was any critical evidence missing?
  - Provide a <strong>final verdict</strong>: If they were correct, confirm their accuracy. If incorrect, suggest the right suspect with reasoning.
  `;

  try {
    let response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 300,
      }),
    });

    let data = await response.json();
    res.json({ message: data.choices?.[0]?.message?.content || "Could not generate report." });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ message: "Error generating report." });
  }
});


// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
