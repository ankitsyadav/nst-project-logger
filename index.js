import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Group from "./models/Group.js";
import Member from "./models/Member.js";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 4000;

// __dirname replacement (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"))

// MongoDB connect
async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://ankitsinghyadavofficial:lWH9Ke7vzasBSVtf@finxpe.dyzdgki.mongodb.net/studentGroups?retryWrites=true&w=majority&appName=finxpe",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// Routes

// 🚀 Get list of projects
app.get("/api/projects", (_, res) => {
  res.json(["AI Chatbot", "E-Commerce Website", "Library Management", "Custom Project"]);
});

// 🚀 Get all groups with members
app.get("/api/groups", async (_, res) => {
  try {
    const groups = await Group.find().populate("members");
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups", details: err.message });
  }
});

// 🚀 Create group with members (prevent duplicate group)
// 🚀 Create group with members (prevent duplicate group)
app.post("/api/groups", async (req, res) => {
  try {
    const { group, members } = req.body;

    if (!group?.groupName) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // ✅ Check duplicate group
    const existingGroup = await Group.findOne({ groupName: group.groupName.trim() });
    if (existingGroup) {
      return res.status(400).json({ error: "Group with this name already exists" });
    }

    const newGroup = new Group({ ...group, groupName: group.groupName.trim() });
    await newGroup.save();

    if (members && members.length > 0) {
      const uniqueMembers = [];

      for (const m of members) {
        if (!m.email && !m.studentID) continue;

        const duplicate = await Member.findOne({
          group: newGroup._id,
          $or: [{ email: m.email }, { studentID: m.studentID }],
        });

        if (!duplicate) {
          uniqueMembers.push({ ...m, group: newGroup._id });
        }
      }

      if (uniqueMembers.length > 0) {
        const memberDocs = await Member.insertMany(uniqueMembers);
        newGroup.members = memberDocs.map((m) => m._id);
        await newGroup.save();
      }
    }

    res.status(201).json({ success: true, group: newGroup });
  } catch (err) {
    res.status(400).json({ error: "Failed to create group", details: err.message });
  }
});


// 🚀 Add member to existing group (prevent duplicate student) also not more than 4 in each group
app.post("/api/groups/:id/members", async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id).populate("members");
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // ✅ Check if group already has 4 members
        if (group.members.length >= 4) {
            return res.status(400).json({ error: "Group already has maximum 4 members" });
        }

        const { email, studentID } = req.body;

        if (!email && !studentID) {
            return res.status(400).json({ error: "Student must have email or studentID" });
        }

        // ✅ Prevent duplicate student by email OR studentID in this group
        const duplicate = await Member.findOne({
            group: id,
            $or: [{ email }, { studentID }],
        });

        if (duplicate) {
            return res.status(400).json({ error: "Student already exists in this group" });
        }

        const member = new Member({ ...req.body, group: id });
        await member.save();

        group.members.push(member._id);
        await group.save();

        res.status(201).json({ success: true, member });
    } catch (err) {
        res.status(400).json({ error: "Failed to add member", details: err.message });
    }
});


// DELETE a member by email
app.delete("/api/groups/:groupId/members/:email", async (req, res) => {
  try {
    const { groupId, email } = req.params;

    // Find the member by group and email
    const member = await Member.findOne({ group: groupId, email });
    if (!member) return res.status(404).json({ error: "Member not found" });

    // Remove member reference from group
    await Group.findByIdAndUpdate(groupId, { $pull: { members: member._id } });

    // Delete member document
    await Member.findByIdAndDelete(member._id);

    res.json({ success: true, message: "Member deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});





// 🚀 Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
});
