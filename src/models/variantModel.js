import mongoose from "mongoose";

const Schema = mongoose.Schema;

const variantSchema = new Schema({
  variantProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "item",
    required: true,
  },
  variantColor: { type: String, required: true },
  variantImages: [
    {
      imgUrl: { type: String, default: null },
      imgKey: { type: String, default: null },
      type: { type: String, default: "image" },
      _id: false,
    },
  ],
  variantSizes: [
    {
      size: { type: String, required: true },
      availability: { type: Boolean, default: true },
      quantity: { type: Number, default: 0, min: 0 },
      _id: false,
    },
  ],
});

// Create a model for the variant
const VariantModel = mongoose.model("variant", variantSchema);

export default VariantModel;
