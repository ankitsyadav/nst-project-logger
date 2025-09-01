import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true , unique: true},
  selectedProject: { type: String, required: true },
  customTitle: { type: String },
  customFeatures: { type: String },
  customVision: { type: String },
  createdAt: { type: Date, default: Date.now },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }]
});

const Group = mongoose.model("Group", groupSchema);

export default Group;
