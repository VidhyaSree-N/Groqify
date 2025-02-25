require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

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
    console.error("❌ Error fetching chat history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Fetch chat history for ALL NPCs
app.get("/chat/all", async (req, res) => {
  try {
    console.log("🔎 Fetching chat history for all NPCs");

    let allChats = await Chat.find({});
    let chatHistory = {};

    allChats.forEach(chat => {
      chatHistory[chat.npcName] = chat.messages;
    });

    res.json(chatHistory);
  } catch (error) {
    console.error("❌ Error fetching all chat history:", error);
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

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
