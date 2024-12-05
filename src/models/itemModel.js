import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Define the item schema
const ItemSchema = new Schema(
  {
    // Common information shared by all color variants
    itemCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    itemTitle: { type: String, required: true },
    itemDescription: { type: String, default: "" },
    itemIsActive: { type: Boolean, default: true },
    itemBasePrice: { type: Number, required: true, min: 0, default: 0 },
    itemPrice: { type: Number, required: true, min: 0 },
    itemDiscount: { type: Number, default: 0 },

    // Item other information (common to all variants)
    itemInformation: {
      material: { type: String, default: null },
      color: { type: String, default: null },
      fitType: { type: String, default: null },
      stretch: { type: String, default: null },
      style: { type: String, default: null },
      accessories: { type: String, default: null },
      modelSize: { type: String, default: null },
      washAndCare: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Create a model for the item
const ItemModel = mongoose.model("item", ItemSchema);

export default ItemModel;
