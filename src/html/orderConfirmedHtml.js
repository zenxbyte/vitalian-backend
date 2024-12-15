import { formatCurrency } from "../services/commonServices.js";

export const orderConfirmedHtml = (data) => {
  // Generate the HTML content for items
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.variant.variantProduct.itemTitle}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.variant.variantColor}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.size}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.quantity}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.8; text-align: center; background-color: #f9f9f9; padding: 20px;">
      <!-- Logo -->
      <div style="margin-bottom: 20px;">
        <img src="cid:logoImage" alt="Vitalian Logo" style="max-width: 350px;" />
      </div>

      <!-- Heading -->
      <h2 style="color: #333; margin-bottom: 20px;">Order Confirmation</h2>
      <p style="color: #555;">Thank you for your order! Here are the details:</p>

      <!-- Order Details -->
      <div style="margin: 20px 0; text-align: center;">
        <p style="font-size: 16px; color: #333;"><strong>Order Number:</strong> ${
          data.orderId
        }</p>
        <p style="font-size: 16px; color: #333;"><strong>Total Price:</strong> ${formatCurrency(
          data.orderTotal
        )}</p>
      </div>

      <!-- Items Table -->
      <div style="overflow-x: auto; margin-top: 20px;">
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff;">
          <thead>
            <tr style="background-color: #f1f1f1;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #333;">Title</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #333;">Color</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #333;">Size</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #333;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <p style="margin-top: 30px; color: #555;">If you have any questions, feel free to contact us.</p>
      <p style="color: #555;">Thank you for shopping with us!</p>
    </div>
  `;
};
