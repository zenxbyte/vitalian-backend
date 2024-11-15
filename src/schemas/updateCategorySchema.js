import Joi from "joi";

export const updateCategorySchema = Joi.object({
  catName: Joi.string().required(),
  catDescription: Joi.string().allow(null),
  catIsActive: Joi.boolean().required(),
});
