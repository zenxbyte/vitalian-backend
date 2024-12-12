import Joi from "joi";

export const messageSchema = Joi.object({
  custName: Joi.string().required().messages({
    "string.base": "Name should be a type of text.",
    "any.required": "Name is required.",
  }),
  custEmail: Joi.string().required().messages({
    "string.base": "Email should be a type of text.",
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
  custMobile: Joi.string().required().messages({
    "any.required": "Mobile is required.",
  }),
  custMessage: Joi.string().max(500).required().messages({
    "string.max": "Message should not exceed 500 characters.",
    "any.required": "Message is required.",
  }),
});
