import mongoose from "mongoose";

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  custName: { type: String, required: true },
  custEmail: { type: String, required: true },
  custMobile: { type: String, required: true },
  custMessage: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const MessageModel = mongoose.model("message", messageSchema);

export default MessageModel;
