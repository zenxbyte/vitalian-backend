import Joi from "joi";

export const createDeliveryOrderSchema = Joi.object({
  listOfIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[a-fA-F0-9]{24}$/, "ObjectId") // Optional: Validate as MongoDB ObjectId
        .required()
    )
    .required()
    .messages({
      "array.base": "List of IDs must be an array.",
      "array.includesRequiredUnknowns":
        "All IDs in the list must be valid strings.",
      "any.required": "List of IDs is required.",
    }),
});
