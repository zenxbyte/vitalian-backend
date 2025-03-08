import Joi from "joi";

// Define the Joi schema for itemImages
const itemImageSchema = Joi.object({
  imgUrl: Joi.string().uri().required(), // imgUrl should be a valid URI
  imgKey: Joi.string().required(), // imgKey should be a string
  type: Joi.string().required(),
});

// Validation schema for each size object within an item variant
const sizeSchema = Joi.object({
  size: Joi.string().required().messages({
    "string.empty": "Size is required",
  }),
  availability: Joi.boolean().default(true),
  quantity: Joi.number().min(0).default(0).messages({
    "number.min": "Quantity cannot be negative",
  }),
});

// Validation schema for each color variant of an item
const variantSchema = Joi.object({
  _id: Joi.string().allow(null, ""),
  variantProduct: Joi.string().allow(null, ""),
  variantColor: Joi.string().required().messages({
    "string.empty": "Color is required",
  }),
  variantSizes: Joi.array().items(sizeSchema).min(1).required().messages({
    "array.min": "At least one size is required for each color",
  }),
  variantImages: Joi.array().items(itemImageSchema),
});

// Main item update validation schema
export const itemUpdateSchema = Joi.object({
  itemTitle: Joi.string().required().messages({
    "string.empty": "Item title is required",
  }),
  itemDescription: Joi.string().allow(""), // Optional description
  itemIsActive: Joi.boolean().default(true),
  itemBasePrice: Joi.number().min(0).required().messages({
    "number.min": "Item base price cannot be negative",
    "number.base": "Item base price must be a number",
    "any.required": "Item base price is required",
  }),
  itemPrice: Joi.number().min(0).required().messages({
    "number.min": "Item price cannot be negative",
    "number.base": "Item price must be a number",
    "any.required": "Item price is required",
  }),
  itemDiscount: Joi.number().min(0).default(0).messages({
    "number.min": "Item discount cannot be negative",
  }),
  itemSizeChart: Joi.object({
    imgUrl: Joi.string().allow(null),
    imgKey: Joi.string().allow(null),
  }),
  itemVideoClip: Joi.object({
    videoUrl: Joi.string().allow(null),
    VideoKey: Joi.string().allow(null),
    type: Joi.string().required(),
  }),
  itemVariants: Joi.array().items(variantSchema).min(1).required().messages({
    "array.min": "At least one item variant is required",
  }),
  itemInformation: Joi.object({
    material: Joi.string().allow(null, ""),
    color: Joi.string().allow(null, ""),
    fitType: Joi.string().allow(null, ""),
    stretch: Joi.string().allow(null, ""),
    style: Joi.string().allow(null, ""),
    accessories: Joi.string().allow(null, ""),
    modelSize: Joi.string().allow(null, ""),
    washAndCare: Joi.string().allow(null, ""),
  }).default({}),
});
