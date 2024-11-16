import httpStatus from "http-status";
import { ObjectId } from "mongodb";

import { error_code, success_code } from "../constants/statusCodes.js";
import ApiResponse from "../services/ApiResponse.js";
import {
  category_not_found,
  images_not_found,
  item_not_found,
  success_message,
} from "../constants/messageConstants.js";
import { itemValidationSchema } from "../schemas/ItemValidatoinSchema.js";
import ItemModel from "../models/itemModel.js";
import { deleteImagesFromS3, uploadFileToS3 } from "../middlewares/upload.js";
import categoryModel from "../models/categoryModel.js";
import { itemUpdateSchema } from "../schemas/itemUpdateSchema.js";

// Get product items by category Id
export const getItemsByCategoryController = async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const skip = page * limit;

    const result = await ItemModel.find({ itemCategoryId: new ObjectId(id) })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    const count = await ItemModel.countDocuments({
      itemCategoryId: new ObjectId(id),
    });

    return res
      .status(httpStatus.OK)
      .json(
        ApiResponse.response(success_code, success_message, { result, count })
      );
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

export const getItemController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ItemModel.findById(new ObjectId(id));

    if (!result) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.response(error_code, item_not_found));
    }

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, result));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Create Product Item
export const createItemController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res
        .status(httpStatus.PRECONDITION_FAILED)
        .json(ApiResponse.response(error_code, images_not_found));
    }
    const files = req.files;
    const formdata = JSON.parse(req.body.data);
    const { error, value } = itemValidationSchema.validate(formdata);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const category = await categoryModel.findById(new ObjectId(id));

    if (!category) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, category_not_found));
    }

    const item = new ItemModel({
      itemCategoryId: new ObjectId(category._id),
      ...value,
    });

    const newItem = await item.save();

    // Use Promise.all to wait for all image uploads
    const images = await Promise.all(
      files.map(async (img) => {
        const uploadedImg = await uploadFileToS3(
          img,
          `${category._id.toString()}/${newItem._id.toString()}`
        );
        return uploadedImg; // Return the uploaded image information
      })
    );

    // Update the item with the images
    await ItemModel.findOneAndUpdate(
      { _id: newItem._id },
      { $set: { itemImages: images } },
      { new: true }
    );

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

export const updateItemController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ItemModel.findById(new ObjectId(id));

    if (!result) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.response(error_code, item_not_found));
    }

    const existingImgs = result.itemImages;
    const files = req.files;
    const formdata = JSON.parse(req.body.data);

    const { error, value } = itemUpdateSchema.validate(formdata);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const updatedImgs = value.itemImages.map((img) => img.imgKey);

    const deletedImgs = existingImgs
      .filter((img) => !updatedImgs.includes(img.imgKey))
      .map((img) => img.imgKey);

    const newImages =
      files.length > 0
        ? await Promise.all(
            files.map(async (img) => {
              return await uploadFileToS3(
                img,
                `${result.itemCategoryId.toString()}/${result._id.toString()}`
              );
            })
          )
        : [];

    if (deletedImgs.length > 0) {
      await deleteImagesFromS3(deletedImgs);
    }

    const updatedImglist = [...value.itemImages, ...newImages];

    // Update the document with new values
    const updatedData = {
      ...value,
      itemImages: updatedImglist,
    };

    await ItemModel.findByIdAndUpdate(
      result._id,
      { $set: updatedData },
      { new: true }
    );

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
