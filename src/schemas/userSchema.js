import Joi from "joi";

export const userSchema = Joi.object({
  userFirstName: Joi.string().required().messages({
    "string.base": "First name should be a type of text.",
    "any.required": "First name is required.",
  }),
  userLastName: Joi.string().required().messages({
    "string.base": "Last name should be a type of text.",
    "any.required": "Last name is required.",
  }),
  userEmail: Joi.string().required().messages({
    "string.base": "Email should be a type of text.",
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
  userPassword: Joi.string().required().messages({
    "any.required": "Password is required.",
  }),
});
