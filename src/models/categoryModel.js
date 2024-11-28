import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  catName: { type: String, required: true },
  catDescription: { type: String, default: null },
  catIsActive: { type: Boolean, default: true },
  catType: { type: String, required: true, default: "Men" },
  createdAt: { type: Date, default: Date.now },
});

const categoryModel = mongoose.model("category", CategorySchema);

export default categoryModel;
