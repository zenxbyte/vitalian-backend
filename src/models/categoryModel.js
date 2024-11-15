import mongoose from "mongoose";

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  catName: { type: String, required: true },
  catDescription: { type: String, default: null },
  catIsActive: { type: Boolean, default: true },
  // catImage: {
  //   imgUrl: { type: String, required: true },
  //   imgPrivateUrl: { type: String, required: true },
  // },
  createdAt: { type: Date, default: Date.now },
});

const categoryModel = mongoose.model("category", CategorySchema);

export default categoryModel;
