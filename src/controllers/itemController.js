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
import { isValidString } from "../services/commonServices.js";

// Get all items - Public - Filter
export const getItemsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const skip = page * limit;

    const filterByCollection = req.query.collection;
    const filterByAvilability = req.query.availability;
    const filterbyColor = req.query.color;
    const filterBySize = req.query.size;
    const filterByPriceMin = parseInt(req.query.priceMin);
    const filterByPriceMax = parseInt(req.query.priceMax);
    const sortBy = req.query.sort;

    let query = {};

    if (isValidString(filterByAvilability)) {
      switch (filterByAvilability) {
        case "inStock":
          query["itemSizes"] = {
            $gt: [{ $sum: "$itemSizes.quantity" }, 0],
          };
          break;
        case "outOfStock":
          query["itemSizes"] = {
            $eq: [{ $sum: "$itemSizes.quantity" }, 0],
          };
          break;
        default:
          break;
      }
    }

    if (isValidString(filterbyColor)) {
      query["itemColor"] = filterbyColor;
    }

    if (isValidString(filterBySize)) {
      query["itemSizes.size"] = filterBySize;
    }

    if (filterByPriceMin && filterByPriceMax) {
      query["itemPrice"] = {
        $gte: filterByPriceMin,
        $lte: filterByPriceMax,
      };
    }

    const sort = {};
    switch (sortBy) {
      case "new":
        sort.createdAt = 1;
        break;
      case "old":
        sort.createdAt = -1;
        break;
      case "low":
        sort.itemPrice = 1;
        break;
      case "high":
        sort.itemPrice = -1;
        break;
      case "a":
        sort.itemTitle = 1;
        break;
      case "z":
        sort.itemTitle = -1;
        break;
      default:
        sort.createdAt = 1;
        break;
    }

    //const result = await ItemModel.find().skip(skip).limit(limit);
    const result = await ItemModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories", // Customer collection
          as: "category",
          let: { categoryId: "$itemCategoryId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$categoryId"] }, // Match unit ID
                ...(isValidString(filterByCollection) && {
                  catName: filterByCollection,
                }),
              },
            },
          ],
        },
      },
      {
        $unwind: "$category",
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);

    const countResult = await ItemModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories", // Customer collection
          as: "category",
          let: { categoryId: "$itemCategoryId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$categoryId"] }, // Match unit ID
                ...(isValidString(filterByCollection) && {
                  catName: filterByCollection,
                }),
              },
            },
          ],
        },
      },
      {
        $unwind: "$category",
      },
      {
        $count: "totalCount",
      },
    ]);

    const count = countResult.length > 0 ? countResult[0].totalCount : 0;

    return res.status(httpStatus.OK).json(
      ApiResponse.response(success_code, success_message, {
        data: result,
        count,
      })
    );
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

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

// Get low stock products - admin
export const getLowStockItemsController = async (req, res) => {
  try {
    const data = await ItemModel.find({
      itemSizes: {
        $lte: [{ $sum: "$itemSizes.quantity" }, 10],
      },
    });

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, data));
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
