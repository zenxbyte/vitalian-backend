import mongoose from "mongoose";
import {
  PAY_CREDIT_CARD,
  PAY_ON_DELIVER,
} from "../constants/paymentMethods.js";
import {
  PAY_STATUS_FAILED,
  PAY_STATUS_PAID,
  PAY_STATUS_PENDING,
  PAY_STATUS_REFUNDED,
} from "../constants/paymentStatus.js";
import {
  ORDER_STATUS,
  ORDER_STATUS_PENDING,
} from "../constants/orderStatus.js";

const Schema = mongoose.Schema;

// Schema for individual order items
const OrderItemSchema = new Schema({
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "variant",
    required: true,
  },
  code: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  discount: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true },
  _id: false,
});

// Main Order Schema
const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true },
    orderWayBillId: { type: String, default: null },
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    deliveryInfo: {
      address: { type: String, required: true },
      company: { type: String, default: null },
      city: {
        city_id: { type: String, required: true },
        city_name: { type: String, required: true },
      },
      district: {
        district_id: { type: String, required: true },
        district_name: { type: String, required: true },
      },
      postalCode: { type: String, default: '' },
      country: { type: String, required: true },
    },
    paymentDetails: {
      method: {
        type: String,
        enum: [PAY_CREDIT_CARD, PAY_ON_DELIVER],
        default: PAY_CREDIT_CARD,
        required: true,
      },
      transactionId: { type: String, default: null }, // Optional: If using payment gateways
      paymentStatus: {
        type: String,
        enum: [
          PAY_STATUS_PENDING,
          PAY_STATUS_PAID,
          PAY_STATUS_FAILED,
          PAY_STATUS_REFUNDED,
        ],
        default: PAY_STATUS_PENDING,
      },
    },
    items: [OrderItemSchema], // Array of order items
    orderDeliveryCharges: { type: Number, required: true, default: 0 },
    orderTotal: { type: Number, required: true }, // Total amount for the order
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      default: ORDER_STATUS_PENDING,
    },
    orderDeliveryId: { type: String, default: null },
    deliveryDate: { type: Date, default: null }, // Optional: Expected delivery date
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Add a pre-save middleware to update the 'updatedAt' field
OrderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const OrderModel = mongoose.model("Order", OrderSchema);
export default OrderModel;
