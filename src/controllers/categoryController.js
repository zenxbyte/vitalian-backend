import httpStatus from "http-status";
import { ObjectId } from "mongodb";

import ApiResponse from "../services/ApiResponse.js";
import { error_code, success_code } from "../constants/statusCodes.js";
import { createCategorySchema } from "../schemas/createCategorySchema.js";
import categoryModel from "../models/categoryModel.js";
import {
  category_not_found,
  success_message,
} from "../constants/messageConstants.js";

// Get Clothing Categories Controller
export const getCategoriesController = async (req, res) => {
  try {
    const categories = await categoryModel.find().sort({ createdAt: 1 });
    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, categories));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Create Clothing Category Controller
export const createCategoryController = async (req, res) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const { catName, catDescription } = value;
    // const catImage = {
    //   imgUrl: req.file.path,
    //   imgPrivateUrl: req.file.path,
    // };
    const newCat = new categoryModel({
      catName,
      catDescription,
    });
    await newCat.save();

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

export const updateCategoryController = async (req, res) => {
  const { error, value } = createCategorySchema.validate(req.body);

  if (error) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json(ApiResponse.error(error_code, error.message));
  }
  try {
    const { id } = req.params;

    const category = await categoryModel.findById(new ObjectId(id));

    if (!category) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, category_not_found));
    }

    const { catName, catDescription, catIsActive } = value;

    // Add image update methods
    category.catName = catName;
    category.catDescription = catDescription;
    category.catIsActive = catIsActive;

    await category.save();

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
