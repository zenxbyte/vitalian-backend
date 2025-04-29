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
import {
  deleteImageFromS3,
  deleteImagesFromS3,
  uploadFileToS3,
} from "../middlewares/upload.js";
import categoryModel from "../models/categoryModel.js";
import { itemUpdateSchema } from "../schemas/itemUpdateSchema.js";
import { isValidString } from "../services/commonServices.js";
import VariantModel from "../models/variantModel.js";

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

    let query = { itemIsActive: true };

    if (
      filterByPriceMin != null &&
      filterByPriceMax != null &&
      filterByPriceMax > 0
    ) {
      query.itemPrice = {
        $gte: filterByPriceMin ?? 0,
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
          from: "categories",
          as: "category",
          let: { categoryId: "$itemCategoryId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$categoryId"] },
                ...(isValidString(filterByCollection) && {
                  catName: filterByCollection,
                }),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "variants",
          as: "itemVariants",
          let: { variantId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$variantProduct", "$$variantId"] },

                ...(isValidString(filterbyColor) && {
                  variantColor: filterbyColor,
                }),
                ...(isValidString(filterBySize) && {
                  "variantSizes.size": filterBySize,
                }),
                ...(isValidString(filterByAvilability) &&
                  filterByAvilability === "inStock" && {
                    variantSizes: {
                      $gt: [{ $sum: "$variantSizes.quantity" }, 0],
                    },
                  }),
                ...(isValidString(filterByAvilability) &&
                  filterByAvilability === "outOfStock" && {
                    variantSizes: {
                      $eq: [{ $sum: "$variantSizes.outOfStock" }, 0],
                    },
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
        $match: {
          itemVariants: { $ne: [] }, // Filters out documents where `itemVariants` is an empty array
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);

    const countResult = await ItemModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          as: "category",
          let: { categoryId: "$itemCategoryId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$categoryId"] },
                ...(isValidString(filterByCollection) && {
                  catName: filterByCollection,
                }),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "variants",
          as: "itemVariants",
          let: { variantId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$variantProduct", "$$variantId"] },

                ...(isValidString(filterbyColor) && {
                  variantColor: filterbyColor,
                }),
                ...(isValidString(filterBySize) && {
                  "variantSizes.size": filterBySize,
                }),
                ...(isValidString(filterByAvilability) &&
                  filterByAvilability === "inStock" && {
                    variantSizes: {
                      $gt: [{ $sum: "$variantSizes.quantity" }, 0],
                    },
                  }),
                ...(isValidString(filterByAvilability) &&
                  filterByAvilability === "outOfStock" && {
                    variantSizes: {
                      $eq: [{ $sum: "$variantSizes.outOfStock" }, 0],
                    },
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
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Get product items by category Id
export const getItemsByCategoryController = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const id = req.query.id;

    const skip = page * limit;

    const result = await ItemModel.aggregate([
      ...(id ? [{ $match: { itemCategoryId: new ObjectId(id) } }] : []),
      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "variantProduct",
          as: "itemVariants",
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const count = await ItemModel.countDocuments(
      id
        ? {
            itemCategoryId: new ObjectId(id),
          }
        : {}
    );

    return res
      .status(httpStatus.OK)
      .json(
        ApiResponse.response(success_code, success_message, { result, count })
      );
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

export const getItemController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ItemModel.aggregate([
      {
        $match: { _id: new ObjectId(id) }, // Match the specific product by ID
      },
      {
        $lookup: {
          from: "categories",
          localField: "itemCategoryId",
          foreignField: "_id",
          as: "itemCategoryId",
        },
      },
      {
        $unwind: "$itemCategoryId",
      },
      {
        $lookup: {
          from: "variants",
          let: { productId: "$_id" }, // Define variables for use in the pipeline
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$variantProduct", "$$productId"], // Match variants with the current product
                },
              },
            },
            {
              $project: {
                _id: 1,
                variantProduct: 1,
                variantColor: 1,
                variantImages: 1,
                variantSizes: 1, // Select specific fields from the variants
              },
            },
          ],
          as: "itemVariants",
        },
      },
    ]);

    if (!result) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.response(error_code, item_not_found));
    }

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, result[0]));
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
    if (!req.files["file"] || req.files["file"].length === 0) {
      return res
        .status(httpStatus.PRECONDITION_FAILED)
        .json(ApiResponse.response(error_code, images_not_found));
    }
    const files = req.files["file"];
    const chartFile = req.files["chart"];
    const videoFile = req.files["video"];
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

    const newItem = new ItemModel({
      itemCategoryId: new ObjectId(category._id),
      itemTitle: value.itemTitle,
      itemDescription: value.itemDescription,
      itemBasePrice: value.itemBasePrice,
      itemPrice: value.itemPrice,
      itemDiscount: value.itemDiscount,
      itemInformation: value.itemInformation,
    });

    const savedItem = await newItem.save();

    let itemSizeChart = {
      imgUrl: null,
      imgKey: null,
    };

    if (chartFile) {
      const uploadedSizeChart = await uploadFileToS3(
        chartFile[0],
        `${category._id.toString()}/${savedItem._id.toString()}/${
          chartFile[0].originalname
        }`
      );

      itemSizeChart.imgKey = uploadedSizeChart.imgKey;
      itemSizeChart.imgUrl = uploadedSizeChart.imgUrl;
    }

    if (videoFile) {
      const uploadedVideoClip = await uploadFileToS3(
        videoFile[0],
        `${category._id.toString()}/${savedItem._id.toString()}/${
          videoFile[0].originalname
        }`
      );

      savedItem.itemVideoClip.videoUrl = uploadedVideoClip.imgKey;
      savedItem.itemVideoClip.videoKey = uploadedVideoClip.imgKey;
    }

    value.itemVariants.map(async (variant) => {
      const { variantColor, variantSizes } = variant;

      // Filter files based on the color property (e.g., file names include color)
      const colorFiles = files.filter((file) =>
        file.originalname
          .toLowerCase()
          .includes(variantColor.toLowerCase().replace(/\s+/g, ""))
      );

      // Use Promise.all to wait for all image uploads for this color
      const uploadedImages = await Promise.all(
        colorFiles.map(async (img) => {
          const uploadedImg = await uploadFileToS3(
            img,
            `${category._id.toString()}/${savedItem._id.toString()}/${variantColor
              .toLowerCase()
              .replace(/\s+/g, "")}`
          );
          return uploadedImg; // Return the uploaded image information
        })
      );

      const newVariant = new VariantModel({
        variantProduct: new ObjectId(savedItem._id),
        variantColor: variantColor,
        variantSizes: variantSizes,
        variantImages: uploadedImages,
      });

      await newVariant.save();
    });

    savedItem.itemSizeChart = itemSizeChart;

    await savedItem.save();

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

    const files = req.files["file"];
    const chartFile = req.files["chart"];
    const videoFile = req.files["video"];
    const formdata = JSON.parse(req.body.data);

    const { error, value } = itemUpdateSchema.validate(formdata);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const existingItem = await ItemModel.findById(new ObjectId());

    const existingVariants = await VariantModel.find({
      variantProduct: result._id,
    });

    const updatedVariants = value.itemVariants;

    const deletedImages = [];

    // Identify deleted, existing, and new variants
    const newAddedVariants = updatedVariants.filter(
      (updatedItem) =>
        !existingVariants.some(
          (existingItem) =>
            existingItem.variantColor === updatedItem.variantColor
        )
    );

    const existingUpdatedVariants = updatedVariants.filter((updatedItem) =>
      existingVariants.some(
        (existingItem) => existingItem.variantColor === updatedItem.variantColor
      )
    );

    // Existing Updated Variants
    if (existingUpdatedVariants.length > 0) {
      await Promise.all(
        existingUpdatedVariants.map(async (item) => {
          const variant = await VariantModel.findById(new ObjectId(item._id));

          // Get existing images for this color variant
          const existingImages = variant.variantImages || [];

          const updatedImageKeys = item.variantImages.map((img) => img.imgKey);

          // Determine images to delete (not in the updated variant)
          const variantDeletedImages = existingImages
            .filter((img) => !updatedImageKeys.includes(img.imgKey))
            .map((img) => img.imgKey);

          if (variantDeletedImages.length > 0) {
            deletedImages.push(...variantDeletedImages);
          }

          if (files) {
            const colorFiles = files.filter((file) =>
              file.originalname
                .toLowerCase()
                .includes(item.variantColor.toLowerCase().replace(/\s+/g, ""))
            );

            // Upload new images for this variant, if any
            const newImages = await Promise.all(
              colorFiles.map(async (img) => {
                const uploadedImg = await uploadFileToS3(
                  img,
                  `${result.itemCategoryId.toString()}/${result._id.toString()}/${item.variantColor
                    .toLowerCase()
                    .replace(/\s+/g, "")}`
                );
                return uploadedImg; // Return the uploaded image information
              })
            );

            const updatedImageList = [...item.variantImages, ...newImages];

            variant.variantImages = updatedImageList;
          }

          variant.variantSizes = item.variantSizes;

          await variant.save();
        })
      );
    }

    // Newly added variants
    if (newAddedVariants.length > 0) {
      await Promise.all(
        newAddedVariants.map(async (item) => {
          // Filter files based on the color property (e.g., file names include color)
          const colorFiles = files.filter((file) =>
            file.originalname
              .toLowerCase()
              .includes(item.variantColor.toLowerCase().replace(/\s+/g, ""))
          );

          // Upload new images for this variant, if any
          const newImages = await Promise.all(
            colorFiles.map(async (img) => {
              const uploadedImg = await uploadFileToS3(
                img,
                `${result.itemCategoryId.toString()}/${result._id.toString()}/${item.variantColor
                  .toLowerCase()
                  .replace(/\s+/g, "")}`
              );
              return uploadedImg; // Return the uploaded image information
            })
          );

          const newVariant = new VariantModel({
            variantSizes: item.variantSizes,
            variantColor: item.variantColor,
            variantProduct: result._id,
            variantImages: newImages,
          });

          await newVariant.save();
        })
      );
    }

    // Delete images from S3 that were removed
    if (deletedImages.length > 0) {
      await deleteImagesFromS3(deletedImages);
    }

    let itemSizeChart = {
      imgUrl: null,
      imgKey: null,
    };

    if (!value.itemSizeChart?.imgKey && result.itemSizeChart?.imgKey) {
      await deleteImageFromS3(result.itemSizeChart.imgKey);
    }

    if (chartFile) {
      const uploadedSizeChart = await uploadFileToS3(
        chartFile[0],
        `${result.itemCategoryId.toString()}/${result._id.toString()}/${
          chartFile[0].originalname
        }`
      );

      itemSizeChart.imgKey = uploadedSizeChart.imgKey;
      itemSizeChart.imgUrl = uploadedSizeChart.imgUrl;
    }

    value.itemSizeChart = itemSizeChart;

    if (videoFile) {
      if (result.itemVideoClip.videoKey) {
        await deleteImageFromS3(result.itemVideoClip.videoKey);
      }

      const uploadedVideoClip = await uploadFileToS3(
        videoFile[0],
        `${result.itemCategoryId.toString()}/${result._id.toString()}/${
          videoFile[0].originalname
        }`
      );

      const videoData = {
        videoUrl: uploadedVideoClip.imgUrl,
        videoKey: uploadedVideoClip.imgKey,
        type: "video",
      };

      value.itemVideoClip = videoData;
    }

    // Prepare the updated data with merged itemVariants
    delete value.itemVariants;

    await ItemModel.findByIdAndUpdate(
      result._id,
      { $set: value },
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
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
