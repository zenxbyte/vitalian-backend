import Joi from "joi";

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
  variantColor: Joi.string().required().messages({
    "string.empty": "Color is required",
  }),
  variantSizes: Joi.array().items(sizeSchema).min(1).required().messages({
    "array.min": "At least one size is required for each color",
  }),
});

// Main item validation schema
export const itemValidationSchema = Joi.object({
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
