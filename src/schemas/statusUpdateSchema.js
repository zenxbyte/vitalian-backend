import Joi from "joi";
import {
  ORDER_STATUS_PENDING,
  ORDER_STATUS_PROCESSING,
} from "../constants/orderStatus.js";

export const statusUpdateSchema = Joi.object({
  currentStatus: Joi.string()
    .valid(ORDER_STATUS_PENDING, ORDER_STATUS_PROCESSING)
    .required()
    .messages({
      "string.base": "Current status must be a string.",
      "string.empty": "Current status is required.",
      "any.required": "Current status is required.",
    }),
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
