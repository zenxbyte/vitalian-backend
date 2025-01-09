import Joi from "joi";

import {
  PAY_STATUS_FAILED,
  PAY_STATUS_PAID,
  PAY_STATUS_PENDING,
  PAY_STATUS_REFUNDED,
} from "../constants/paymentStatus.js";

export const paymentStatusUpdateSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.base": "New status must be a string.",
    "string.empty": "New status is required.",
  }),
  newStatus: Joi.string()
    .valid(
      PAY_STATUS_REFUNDED,
      PAY_STATUS_FAILED,
      PAY_STATUS_PAID,
      PAY_STATUS_PENDING
    )
    .required()
    .messages({
      "string.base": "New status must be a string.",
      "string.empty": "New status is required.",
      "any.required": "New status is required.",
    }),
});
