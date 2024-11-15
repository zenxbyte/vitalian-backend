import Joi from "joi";

export const createCategorySchema = Joi.object({
  catName: Joi.string().required(),
  catDescription: Joi.string().allow(null, ""),
});
