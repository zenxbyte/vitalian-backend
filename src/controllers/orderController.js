import httpStatus from "http-status";
import { ObjectId } from "mongodb";

import {
  error_code,
  info_code,
  success_code,
} from "../constants/statusCodes.js";
import ApiResponse from "../services/ApiResponse.js";
import { orderCreateSchema } from "../schemas/createOrderSchema.js";
import {
  delivery_orders_created,
  item_quantity_not_enough,
  order_already_paid,
  order_cancelled_successfuly,
  order_cannot_cancel,
  order_not_found,
  packed_orders_not_found,
  pick_request_created_already,
  pickup_items_not_found,
  success_message,
} from "../constants/messageConstants.js";
import OrderModel from "../models/orderModel.js";
import { generateOrderId, isValidString } from "../services/commonServices.js";
import {
  ORDER_DELIVERY_CREATED,
  ORDER_STATUS,
  ORDER_STATUS_CANCELED,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_OUT_DELIVERY,
  ORDER_STATUS_PACKED,
  ORDER_STATUS_PENDING,
  ORDER_STATUS_PROCESSING,
  ORDER_STATUS_WAITING,
} from "../constants/orderStatus.js";
import { PAY_STATUS_PAID, PAYMENT_STATUS } from "../constants/paymentStatus.js";
import { SORT_BY } from "../constants/sort-constants.js";
import VariantModel from "../models/variantModel.js";
import { sendOrderConfirmedEmail } from "../services/emailServices.js";
import { statusUpdateSchema } from "../schemas/statusUpdateSchema.js";
import DeliveryLogModel from "../models/deliveryLogModel.js";
import { createPickupSchema } from "../schemas/createPickUpSchema.js";
import { paymentStatusUpdateSchema } from "../schemas/paymentStatusSchema.js";

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
        new ObjectId(item.variant)
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

// Get Order Details
export const getOrderController = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await OrderModel.findById(new ObjectId(id)).populate({
      path: "items.variant",
      select: "variantColor variantSizes variantImages variantProduct",
      populate: {
        path: "variantProduct",
        select: "itemTitle itemDescription",
      },
    });

    if (!order) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, order_not_found));
    }

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, order));
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

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
      .json(ApiResponse.response(success_code, success_message, count));
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Payment Gateway Success Endpoint
export const onPaymentSuccessController = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await OrderModel.findById(new ObjectId(id)).populate({
      path: "items.variant",
      select: "variantColor variantSizes variantImages variantProduct",
      populate: {
        path: "variantProduct",
        select: "itemTitle itemDescription",
      },
    });

    if (!order) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, order_not_found));
    }

    order.paymentDetails.paymentStatus = PAY_STATUS_PAID;

    await order.save();

    await sendOrderConfirmedEmail(order.customer.email, order);

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

// Payment Gateway Error Endpoint
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

// Recent Transactions - limit 6
export const recentTransactionsController = async (req, res) => {
  try {
    const orders = await OrderModel.find({
      "paymentDetails.paymentStatus": PAY_STATUS_PAID,
    })
      .sort({ updatedAt: -1 })
      .limit(6);

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, orders));
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Recent pending Orders limit 5 and total pending count
export const PendingOrdersController = async (req, res) => {
  try {
    const orders = await OrderModel.find({ orderStatus: ORDER_STATUS_PENDING })
      .sort({ updatedAt: -1 })
      .limit(5);
    const count = await OrderModel.countDocuments({
      orderStatus: ORDER_STATUS_PENDING,
    });
    return res
      .status(httpStatus.OK)
      .json(
        ApiResponse.response(success_code, success_message, { orders, count })
      );
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Update order status - Multiple
export const updateOrderStatusController = async (req, res) => {
  try {
    const { error, value } = statusUpdateSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const { currentStatus, listOfIds } = value;

    let newStatus;

    switch (currentStatus) {
      case ORDER_STATUS_PENDING:
        newStatus = ORDER_STATUS_PROCESSING;
        break;
      case ORDER_STATUS_PROCESSING:
        newStatus = ORDER_STATUS_PACKED;
        break;
      case ORDER_STATUS_WAITING:
        newStatus = ORDER_STATUS_OUT_DELIVERY;
        break;
      case ORDER_STATUS_OUT_DELIVERY:
        newStatus = ORDER_STATUS_DELIVERED;
        break;
      default:
        newStatus = ORDER_STATUS_PROCESSING;
        break;
    }

    const result = await OrderModel.updateMany(
      {
        _id: { $in: listOfIds.map((id) => new ObjectId(id)) }, // Convert IDs to ObjectId
        orderStatus: currentStatus, // Match current status
      },
      { $set: { orderStatus: newStatus } } // Update to the new status
    );

    return res
      .status(httpStatus.OK)
      .json(
        ApiResponse.response(
          success_code,
          `${result.modifiedCount} items updated successfully.`
        )
      );
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Create delivery orders - Multiple - Koombiyo
export const createDeliveryOrdersController = async (req, res) => {
  try {
    const list = await OrderModel.find({
      orderStatus: ORDER_STATUS_PACKED,
    });

    if (list.length === 0) {
      return res
        .status(httpStatus.OK)
        .json(ApiResponse.response(info_code, packed_orders_not_found));
    }

    // Add waybill and complete flow
    list.forEach(async (order) => {
      const deliveryOrder = {
        apikey: process.env.KOOM_API_KEY,
        orderWaybillid: "",
        orderNo: order.orderId,
        receiverName: `${order.customer.firstName} ${order.customer.lastName}`,
        receiverStreet: order.deliveryInfo.address,
        receiverDistrict: order.deliveryInfo.district.district_id,
        receiverCity: order.deliveryInfo.city.city_id,
        receiverPhone: order.customer.phone,
        description: "",
        spclNote: "",
        getCod: "",
      };

      //order.orderWayBillId = ''
      order.orderStatus = ORDER_DELIVERY_CREATED;
      await order.save();
    });

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, delivery_orders_created));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Create pick up packages - Awaiting Status - Koombiyo
export const createPickUpOrdersController = async (req, res) => {
  try {
    const { error, value } = createPickupSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const date = new Date();
    const isLogged = await DeliveryLogModel.findOne({
      createdAt: `${date.getDate()}-${
        date.getMonth() + 1
      }-${date.getFullYear()}`,
    });

    if (isLogged) {
      return res
        .status(httpStatus.OK)
        .json(ApiResponse.response(info_code, pick_request_created_already));
    }

    const pickUpItems = await OrderModel.find({
      orderStatus: ORDER_DELIVERY_CREATED,
    });

    if (pickUpItems.length === 0) {
      return res
        .status(httpStatus.OK)
        .json(ApiResponse.response(info_code, pickup_items_not_found));
    }

    const newLog = new DeliveryLogModel({
      ...value,
      qty: pickUpItems.length,
    });

    await newLog.save();

    for (const item of pickUpItems) {
      item.orderStatus = ORDER_STATUS_WAITING;
      await item.save();
    }

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Recent Logs of pick deliveries
export const recentPickupOrdersController = async (req, res) => {
  try {
    const result = await DeliveryLogModel.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, result));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Cancel Order Controller
export const cancelOrderController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await OrderModel.findOne(new ObjectId(id));

    if (!result) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, order_not_found));
    }

    if (result.orderStatus === ORDER_STATUS_DELIVERED) {
      return res
        .status(httpStatus.PRECONDITION_FAILED)
        .json(ApiResponse.error(error_code, order_cannot_cancel));
    }

    result.orderStatus = ORDER_STATUS_CANCELED;
    await result.save();

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, order_cancelled_successfuly));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Update payment status controller
export const updatePaymentStatus = async (req, res) => {
  try {
    const { error, value } = paymentStatusUpdateSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const { id, newStatus } = value;

    const order = await OrderModel.findOne(new ObjectId(id));

    if (!order) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, order_not_found));
    }

    if (order.paymentDetails.paymentStatus === PAY_STATUS_PAID) {
      return res
        .status(httpStatus.PRECONDITION_FAILED)
        .json(ApiResponse.error(error_code, order_already_paid));
    }

    order.paymentDetails.paymentStatus = newStatus;
    await order.save();

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};
