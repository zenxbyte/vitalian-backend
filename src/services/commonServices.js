import { customAlphabet } from "nanoid";

export const isValidString = (str) => {
  return typeof str === "string" && str.trim() !== "";
};

export const calculateTotalValue = (item) => {
  const discount = (item.itemDiscount * item.itemPrice) / 100;
  const total = (item.itemPrice - discount) * item.quantity;
  return total;
};

export const generateOrderId = () => {
  const randomId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 5);
  const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
  return `ORD-${datePart}-${randomId()}`;
};

export const formatCurrency = (amount) => {
  const formattedAmount = amount
    .toLocaleString("en-IN", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    })
    .replace("LKR", "Rs.");
  return formattedAmount;
};
