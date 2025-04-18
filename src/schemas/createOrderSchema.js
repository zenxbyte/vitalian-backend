import Joi from "joi";
import {
  PAY_CREDIT_CARD,
  PAY_ON_DELIVER,
} from "../constants/paymentMethods.js";
import {
  PAY_STATUS_FAILED,
  PAY_STATUS_PAID,
  PAY_STATUS_PENDING,
  PAY_STATUS_REFUNDED,
} from "../constants/paymentStatus.js";
import { ORDER_STATUS_PENDING } from "../constants/orderStatus.js";
// Joi schema for OrderItem
const orderItemSchema = Joi.object({
  variant: Joi.string().required(),
  code: Joi.string().required(),
  size: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  discount: Joi.number().integer().min(0).required(),
  totalPrice: Joi.number().min(0).required(),
});

// Joi schema for the main Order
export const orderCreateSchema = Joi.object({
  customer: Joi.object({
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(7).max(13).required(),
    secondaryPhone: Joi.string().min(7).max(13).allow(null, ""),  
  }).required(),

  deliveryInfo: Joi.object({
    address: Joi.string().required(),
    company: Joi.string().allow(null, ""), // Allow null or empty string for optional fields
    city: Joi.object({
      city_id: Joi.string().required(),
      city_name: Joi.string().required(),
    }),

    district: Joi.object({
      district_id: Joi.string().required(),
      district_name: Joi.string().required(),
    }),
    postalCode: Joi.string().allow(null, ""), // Allow null or empty string for optional fields
    country: Joi.string().required(),
  }).required(),

  paymentDetails: Joi.object({
    method: Joi.string()
      .valid(PAY_CREDIT_CARD, PAY_ON_DELIVER)
      .default(PAY_CREDIT_CARD),
    paymentStatus: Joi.string()
      .valid(
        PAY_STATUS_PENDING,
        PAY_STATUS_PAID,
        PAY_STATUS_FAILED,
        PAY_STATUS_REFUNDED
      )
      .default(PAY_STATUS_PENDING),
  }).required(),

  items: Joi.array().items(orderItemSchema).min(1).required(), // At least one item required
  orderDeliveryCharges: Joi.number().min(0).required(),
  orderTotal: Joi.number().min(0).required(), // Total must be at least 0

  orderStatus: Joi.string()
    .valid(ORDER_STATUS_PENDING)
    .default(ORDER_STATUS_PENDING),
});
