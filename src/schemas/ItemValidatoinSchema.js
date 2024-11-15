import Joi from "joi";

// Define the Joi schema for item sizes
const itemSizeSchema = Joi.object({
  size: Joi.string().required(),
  availability: Joi.boolean().default(true),
  quantity: Joi.number().min(0).default(0),
});

const itemInformationSchema = Joi.object({
  material: Joi.string().allow(""),
  color: Joi.string().allow(""),
  fitType: Joi.string().allow(""),
  stretch: Joi.string().allow(""),
  style: Joi.string().allow(""),
  accessories: Joi.string().allow(""),
  modelSize: Joi.string().allow(""),
  washAndCare: Joi.string().allow(""),
});

// Joi validation schema for item creation
export const itemValidationSchema = Joi.object({
  itemTitle: Joi.string().required(),
  itemDescription: Joi.string().allow(""), // Allow empty string as default
  itemPrice: Joi.number().min(0).required(),
  itemDiscount: Joi.number().min(0).default(0),
  itemColor: Joi.string()
    .valid(
      "Red",
      "Pink",
      "Purple",
      "Blue",
      "Green",
      "Orange",
      "White",
      "Grey",
      "Black",
      "Brown",
      "Beige",
      "Yellow"
    )
    .required(),
  itemSizes: Joi.array().items(itemSizeSchema).optional(),
  itemInformation: itemInformationSchema,
});
