import Joi from "joi";

export const orderItemStockCheckSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.base": "Item id must be a string.",
    "string.empty": "Item id is required.",
  }),
  size: Joi.string().required().messages({
    "string.base": "Size must be a string.",
    "string.empty": "Size is required.",
  }),
  quantity: Joi.number().required().min(1).messages({
    "number.base": "Quantity must be a number.",
    "number.empty": "Quantity is required.",
  })
});