import httpStatus from "http-status";
import { ObjectId } from "mongodb";
import ExcelJS from "exceljs";
import axios from "axios";
import PDFDocument from "pdfkit";

import {
  error_code,
  info_code,
  success_code,
} from "../constants/statusCodes.js";
import ApiResponse from "../services/ApiResponse.js";
import { orderCreateSchema } from "../schemas/createOrderSchema.js";
import {
  delivery_orders_created,
  item_not_found,
  item_quantity_not_enough,
  item_size_not_found,
  order_already_paid,
  order_cancelled_successfuly,
  order_cannot_cancel,
  order_not_found,
  order_pickup_rqst_failed,
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
} from "../constants/orderStatus.js";
import { PAY_STATUS_PAID, PAYMENT_STATUS } from "../constants/paymentStatus.js";
import { SORT_BY } from "../constants/sort-constants.js";
import VariantModel from "../models/variantModel.js";
import {
  sendOrderConfirmedEmail,
  sendTestEmail,
} from "../services/emailServices.js";
import { statusUpdateSchema } from "../schemas/statusUpdateSchema.js";
import DeliveryLogModel from "../models/deliveryLogModel.js";
import { createPickupSchema } from "../schemas/createPickUpSchema.js";
import { paymentStatusUpdateSchema } from "../schemas/paymentStatusSchema.js";
import {
  PAY_CREDIT_CARD,
  PAY_ON_DELIVER,
} from "../constants/paymentMethods.js";
import { orderItemStockCheckSchema } from "../schemas/orderItemStockCheckSchema.js";
import { generateDeliveryInfoPDF } from "../services/pdfServices.js";

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

    for (const item of items) {
      const variantInfo = await VariantModel.findById(
        new ObjectId(item.variant)
      ).populate("variantProduct");
      if (!variantInfo.variantProduct.itemIsActive) {
        return res
          .status(httpStatus.NOT_ACCEPTABLE)
          .json(
            ApiResponse.error(
              error_code,
              "Item " +
                variantInfo.variantProduct.itemTitle +
                " is not available."
            )
          );
      }
      variantInfo.variantSizes.map((size) => {
        if (item.size === size.size) {
          if (item.quantity > size.quantity) {
            return res
              .status(httpStatus.NOT_ACCEPTABLE)
              .json(
                ApiResponse.error(
                  error_code,
                  item_quantity_not_enough +
                    variantInfo.variantProduct.itemTitle
                )
              );
          } else {
            size.quantity = size.quantity - item.quantity;
            return;
          }
        }
      });
      await variantInfo.save();
    };

    const newOrder = new OrderModel({
      orderId: generateOrderId(),
      ...value,
    });

    const savedOrder = await newOrder.save();

    if (savedOrder.paymentDetails.method === PAY_ON_DELIVER) {
      const order = await OrderModel.findById(savedOrder._id).populate({
        path: "items.variant",
        select: "variantColor variantSizes variantImages variantProduct",
        populate: {
          path: "variantProduct",
          select: "itemTitle itemDescription",
        },
      });
      await sendOrderConfirmedEmail(order.customer.email, order);
    }

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
    const customerName = req.query.name;
    const customerMobile = req.query.mobile;
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

    if (isValidString(customerName)) {
      query["customer.firstName"] = {
        $regex: `${customerName}`,
        $options: "i",
      };
    }

    if (isValidString(customerMobile)) {
      query["customer.phone"] = {
        $regex: `${customerMobile}`,
        $options: "i",
      };
    }

    const sort = {};

    switch (sortBy) {
      case SORT_BY[0].value:
        sort.createdAt = -1;
        break;
      case SORT_BY[1].value:
        sort.createdAt = 1;
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
      select: "variantColor variantImages variantProduct",
      populate: {
        path: "variantProduct",
        select: "itemTitle itemPrice",
      },
    });

    if (!order) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, order_not_found));
    }

    if (order.paymentDetails.method === PAY_CREDIT_CARD) {
      order.paymentDetails.paymentStatus = PAY_STATUS_PAID;
    }

    const savedOrder = await order.save();

    if (order.paymentDetails.method === PAY_CREDIT_CARD) {
      await sendOrderConfirmedEmail(savedOrder.customer.email, savedOrder);
    }

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.response(success_code, success_message, savedOrder));
  } catch (error) {
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
        newStatus = ORDER_STATUS_PACKED;
        break;
      case ORDER_STATUS_OUT_DELIVERY:
        newStatus = ORDER_STATUS_DELIVERED;
        break;
      default:
        newStatus = ORDER_STATUS_PENDING;
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

    let wayBillIdList = [];

    if (process.env.NODE_ENV === "prod") {
      const params = new URLSearchParams();
      params.append("apikey", process.env.KOOM_API_KEY);
      params.append("limit", list.length);

      const response = await axios.post(
        "https://application.koombiyodelivery.lk/api/Waybils/users",
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.status !== 200 || response.data === "Invalid API Key") {
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json(ApiResponse.error(error_code, server_error));
      }

      wayBillIdList = response.data.waybills;
    }

    // Add waybill and complete flow
    list.forEach(async (order, index) => {
      if (
        process.env.NODE_ENV === "prod" &&
        wayBillIdList.length === list.length &&
        order.orderStatus === ORDER_STATUS_PACKED
      ) {
        const params = new URLSearchParams();
        params.append("apikey", process.env.KOOM_API_KEY);
        params.append("orderWaybillid", wayBillIdList[index].waybill_id);
        params.append("orderNo", order.orderId);
        params.append(
          "receiverName",
          `${order.customer.firstName} ${order.customer.lastName}`
        );
        params.append("receiverStreet", order.deliveryInfo.address);
        params.append(
          "receiverDistrict",
          order.deliveryInfo.district.district_id
        );
        params.append("receiverCity", order.deliveryInfo.city.city_id);
        params.append("receiverPhone", order.customer.phone);
        params.append("description", "Clothing Items");
        params.append("spclNote", "");
        params.append(
          "getCod",
          order.paymentDetails.method === PAY_ON_DELIVER ? order.orderTotal : ""
        );

        const response = await axios.post(
          "https://application.koombiyodelivery.lk/api/Addorders/users",
          params,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (response.data.status === "success") {
          order.orderWayBillId = wayBillIdList[index].waybill_id;
          order.orderStatus = ORDER_DELIVERY_CREATED;
          await order.save();
        }
      }
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

    const {
      vehicleType,
      pickup_remark,
      pickup_address,
      latitude,
      longitude,
      phone,
    } = value;

    const pickUpItems = await OrderModel.find({
      orderStatus: ORDER_DELIVERY_CREATED,
    });

    if (pickUpItems.length === 0) {
      return res
        .status(httpStatus.OK)
        .json(ApiResponse.response(info_code, pickup_items_not_found));
    }

    if (process.env.NODE_ENV === "prod") {
      const params = new URLSearchParams();
      params.append("apikey", process.env.KOOM_API_KEY);
      params.append("vehicleType", vehicleType);
      params.append("pickup_remark", pickup_remark);
      params.append("pickup_address", pickup_address);
      params.append("latitude", latitude);
      params.append("longitude", longitude);
      params.append("phone", phone);
      params.append("qty", pickUpItems.length);

      const response = await axios.post(
        "https://application.koombiyodelivery.lk/api/Pickups/users",
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.data.status === "success") {
        const newLog = new DeliveryLogModel({
          ...value,
          qty: pickUpItems.length,
        });

        await newLog.save();

        for (const item of pickUpItems) {
          item.orderStatus = ORDER_STATUS_OUT_DELIVERY;
          await item.save();
        }
      } else {
        return res
          .status(httpStatus.CONFLICT)
          .json(ApiResponse.error(error_code, order_pickup_rqst_failed));
      }
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

    if (
      [ORDER_STATUS_DELIVERED, ORDER_STATUS_OUT_DELIVERY].includes(
        result.orderStatus
      )
    ) {
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

// COnfirm Order Item Stocks Availability Controller
export const confirmOrderItemStocksController = async (req, res) => {
  try {
    const { error, value } = orderItemStockCheckSchema.validate(req.body);

    if (error) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(ApiResponse.error(error_code, error.message));
    }

    const { id, size, quantity } = value;

    const item = await VariantModel.findById(id).populate("variantProduct");

    if (!item) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, item_not_found));
    }

    if (!item.variantProduct.itemIsActive) {
      return res
        .status(httpStatus.NOT_ACCEPTABLE)
        .json(
          ApiResponse.error(
            error_code,
            "Item " + item.variantProduct.itemTitle + " is not available."
          )
        );
    }

    const sizeInfo = item.variantSizes.find((s) => s.size === size);

    if (!sizeInfo) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, item_size_not_found));
    }

    if (quantity > sizeInfo.quantity) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(
          ApiResponse.error(error_code, `Only ${quantity} items are available`)
        );
    }

    return res
      .status(httpStatus.OK)
      .json(ApiResponse.error(success_code, success_message));
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Download Orders in excel - filtered by status
export const downloadOrdersExcelController = async (req, res) => {
  const orderStatus = req.query.orderStatus;

  const query = {};

  if (isValidString(orderStatus) && ORDER_STATUS.includes(orderStatus)) {
    query.orderStatus = orderStatus;
  }
  try {
    const data = await OrderModel.find(query);

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    // Define columns
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "City", key: "city", width: 20 },
      { header: "Country", key: "country", width: 20 },
      { header: "Total Price", key: "orderTotal", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 20 },
      { header: "Payment Status", key: "paymentStatus", width: 20 },
      { header: "Order Status", key: "orderStatus", width: 20 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];

    // Populate rows with order data
    data.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        email: order.customer.email,
        phone: order.customer.phone,
        city: order.deliveryInfo.city.city_name,
        country: order.deliveryInfo.country,
        orderTotal: order.orderTotal,
        paymentMethod: order.paymentDetails.method,
        paymentStatus: order.paymentDetails.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt.toISOString(),
      });
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

    // Send the workbook as a stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

// Download Delivery Info PDF
export const downloadDeliveryInfoPdfController = async (req, res) => {
  try {
    const _id = req.query.id;

    const order = await OrderModel.findById(new ObjectId(_id));

    if (!order) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(ApiResponse.error(error_code, order_not_found));
    }

    // Create a new PDF document
    const doc = new PDFDocument({
      size: [420, 595],
      margins: { top: 20, left: 20, right: 20, bottom: 20 },
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=${order.orderId}.pdf`
    );

    // Stream the PDF buffer to the response
    doc.pipe(res);

    await generateDeliveryInfoPDF(doc, order);

    doc.end();
  } catch (error) {
    console.log(error);

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(ApiResponse.error(error_code, error.message));
  }
};

export const testEmailConfirmationController = async () => {
  const order = await OrderModel.find().populate({
    path: "items.variant",
    select: "variantColor variantSizes variantImages variantProduct",
    populate: {
      path: "variantProduct",
      select: "itemTitle itemDescription",
    },
  });
  const data = order[0];
  await sendTestEmail("mojij24623@buides.com", data);

  console.log("Email sent");
};
