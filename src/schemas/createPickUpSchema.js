import Joi from "joi";

// Joi schema for vehicle type and other details
export const createPickupSchema = Joi.object({
  vehicleType: Joi.string()
    .valid("Bike", "Three wheel", "Lorry")
    .required()
    .messages({
      "any.required": "Vehicle type is required.",
      "any.only": "Vehicle type must be one of: Bike, Three wheel, Lorry.",
    }),

  pickup_remark: Joi.string()
    .max(255) // Restrict remarks to 255 characters
    .required()
    .messages({
      "string.max": "Remarks cannot exceed 255 characters.",
      "any.required": "Pickup remark is required.",
    }),

  pickup_address: Joi.string()
    .max(500) // Restrict address to 500 characters
    .required()
    .messages({
      "string.max": "Pickup address cannot exceed 500 characters.",
      "any.required": "Pickup address is required.",
    }),

  latitude: Joi.string().required().messages({
    "any.required": "Latitude is required.",
  }),

  longitude: Joi.string().required().messages({
    "any.required": "Longitude is required.",
  }),

  phone: Joi.string().required().messages({
    "any.required": "Phone number is required.",
  }),
});
