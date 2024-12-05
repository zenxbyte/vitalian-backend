import httpStatus from "http-status";
import { ObjectId } from "mongodb";

import { error_code, success_code } from "../constants/statusCodes.js";
import ApiResponse from "../services/ApiResponse.js";
import { orderCreateSchema } from "../schemas/createOrderSchema.js";
import {
  item_quantity_not_enough,
  order_not_found,
  success_message,
} from "../constants/messageConstants.js";
import OrderModel from "../models/orderModel.js";
import { generateOrderId, isValidString } from "../services/commonServices.js";
import { ORDER_STATUS } from "../constants/orderStatus.js";
import { PAY_STATUS_PAID, PAYMENT_STATUS } from "../constants/paymentStatus.js";
import { SORT_BY } from "../constants/sort-constants.js";
import VariantModel from "../models/variantModel.js";

// Create Order Public
export const createOrderController = async (req, res) => {
  try {
    const { error, value } = orderCreateSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const { items } = value;

    items.map(async (item) => {
      const variantInfo = await VariantModel.findById(
        new ObjectId(item._id)
      ).populate("variantProduct");
      variantInfo.variantSizes.map((size) => {
        if (item.size === size.size) {
          if (item.quantity > size.quantity) {
            return res
              .status(httpStatus.NOT_ACCEPTABLE)
              .json(
                ApiResponse.error(
                  error_code,
                  item_quantity_not_enough + item.code
                )
              );
          } else {
            size.quantity = size.quantity - item.quantity;
            return;
          }
        }
      });
      await variantInfo.save();
    });

    const newOrder = new OrderModel({
      orderId: generateOrderId(),
      ...value,
    });

    const savedOrder = await newOrder.save();

    return res
      .status(httpStatus.CREATED)
      .json(ApiResponse.response(success_code, success_message, savedOrder));
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Update Order - Admin
export const updateOrderController = async (req, res) => {};

// Get Orders - Filtered by order status - admin
export const getOrdersController = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const skip = page * limit;

    const orderStatus = req.query.orderStatus;
    const paymentStatus = req.query.paymentStatus;
    const filterOrderId = req.query.orderId;
    const sortBy = req.query.sort;

    const query = {};

    if (isValidString(orderStatus) && ORDER_STATUS.includes(orderStatus)) {
      query.orderStatus = orderStatus;
    }

    if (
      isValidString(paymentStatus) &&
      PAYMENT_STATUS.includes(paymentStatus)
    ) {
      query["paymentDetails.paymentStatus"] = paymentStatus;
    }

    if (isValidString(filterOrderId)) {
      query.orderId = {
        $regex: `${filterOrderId}`,
        $options: "i",
      };
    }

    const sort = {};

    switch (sortBy) {
      case SORT_BY[0].value:
        sort.createdAt = 1;
        break;
      case SORT_BY[1].value:
        sort.createdAt = -1;
        break;
      default:
        sort.createdAt = 1;
        break;
    }

    const data = await OrderModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort);
    const count = await OrderModel.countDocuments(query);

    return res
      .status(httpStatus.OK)
      .json(
        ApiResponse.response(success_code, success_message, { data, count })
      );
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Get order count - statistics - admin
export const getOrderCountController = async (req, res) => {
  try {
    const orderStatus = req.query.orderStatus;
    const paymentStatus = req.query.paymentStatus;

    const query = {};

    if (isValidString(orderStatus) && ORDER_STATUS.includes(orderStatus)) {
      query.orderStatus = orderStatus;
    }

    if (
      isValidString(paymentStatus) &&
      PAYMENT_STATUS.includes(paymentStatus)
    ) {
      query.paymentDetails.paymentStatus = paymentStatus;
    }

    const count = await OrderModel.countDocuments(query);

    return res
      .status(httpStatus.OK)
      .json(
        ApiResponse.response(success_code, success_message, { data, count })
      );
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

export const onPaymentSuccessController = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await OrderModel.findById(new ObjectId(id));

    if (!order) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, order_not_found));
    }

    order.paymentDetails.paymentStatus = PAY_STATUS_PAID;

    await order.save();

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

export const onPaymentErrorController = async (req, res) => {
  try {
    const { id } = req.params;

    await OrderModel.findByIdAndDelete(new ObjectId(id));

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
