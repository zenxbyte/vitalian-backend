import mongoose from "mongoose";

const Schema = mongoose.Schema;

const deliveryLogSchema = new Schema({
  vehicleType: { type: String, required: true },
  pickup_remark: { type: String, default: null },
  pickup_address: { type: String, required: true },
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
  phone: { type: String, required: true },
  qty: { type: String, required: true },
  createdAt: {
    type: String,
    default: () => {
      const date = new Date();
      // Format date as "DD-MM-YYYY"
      return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    },
  },
});

// Create a model for the pick up logs
const DeliveryLogModel = mongoose.model("delivery_log", deliveryLogSchema);

export default DeliveryLogModel;
