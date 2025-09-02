import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  email: { type: String, required: true },
  studentID: { type: String },
  mobile: { type: String },
  gitHub: { type: String },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }
});

const Member = mongoose.model("Member", memberSchema);

export default Member;
