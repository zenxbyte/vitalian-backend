import { formatCurrency } from "../services/commonServices.js";

export const orderConfirmedHtml = (data) => {
  // Generate the HTML content
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.variant.variantProduct.itemTitle}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.variant.variantColor}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.size}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
        </tr>
      `
    )
    .join("");

  return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order! Here are the details:</p>
        <p><strong>Order Number:</strong> ${data.orderId}</p>
        <p><strong>Total Price:</strong> $${formatCurrency(data.orderTotal)}</p>
        <h3>Items:</h3>
        <table style="border-collapse: collapse; width: 100%; text-align: left;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px;">Title</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Color</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Size</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Thank you for shopping with us!</p>
      </div>
    `;
};
