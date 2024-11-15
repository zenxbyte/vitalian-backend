import Joi from "joi";

// Define the Joi schema for itemImages
const itemImageSchema = Joi.object({
  imgUrl: Joi.string().uri().required(), // imgUrl should be a valid URI
  imgKey: Joi.string().required(), // imgKey should be a string
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

// Joi validation schema for item update
export const itemUpdateSchema = Joi.object({
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
  itemImages: Joi.array().items(itemImageSchema).optional(),

  itemInformation: itemInformationSchema,
});
