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

    // Variations in color, images, and sizes
    itemVariants: [
      {
        itemColor: { type: String, required: true },
        itemImages: [
          {
            imgUrl: { type: String, default: null },
            imgKey: { type: String, default: null },
            _id: false,
          },
        ],
        itemSizes: [
          {
            size: { type: String, required: true },
            availability: { type: Boolean, default: true },
            quantity: { type: Number, default: 0, min: 0 },
            _id: false,
          },
        ],
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

// Create a model for the item
const ItemModel = mongoose.model("Item", ItemSchema);

export default ItemModel;
