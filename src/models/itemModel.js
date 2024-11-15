import mongoose from "mongoose";
import { COLORS } from "../constants/colors.js";

const Schema = mongoose.Schema;

// Define the item schema
const ItemSchema = new Schema(
  {
    itemCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    itemTitle: { type: String, required: true },
    itemDescription: { type: String, default: "" },
    itemPrice: { type: Number, required: true, min: 0 },
    itemDiscount: { type: Number, default: 0 },
    itemColor: { type: String, required: true, enum: COLORS },
    itemImages: [
      {
        imgUrl: { type: String, default: null },
        imgKey: { type: String, default: null },
      },
    ],

    // Size availability and quantity
    itemSizes: [
      {
        size: { type: String, required: true },
        availability: { type: Boolean, default: true },
        quantity: { type: Number, default: 0, min: 0 },
      },
    ],

    // Item other information
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
const ItemModel = mongoose.model("Item", ItemSchema);

export default ItemModel;
