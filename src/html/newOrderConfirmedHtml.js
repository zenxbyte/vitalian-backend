import { PAY_CREDIT_CARD } from "../constants/paymentMethods.js";
import { formatCurrency } from "../services/commonServices.js";

export const newOrderConfirmedHtml = (data) => {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f8f8f9; padding: 20px;">
        <!-- Main container with white background -->
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          
          <!-- Top section -->
          <div style="padding: 30px; text-align: center">
            <div>
              <img src="cid:logoImage" alt="Vitalian Logo" style="max-width: 200px;" />
            </div>
            <h2 style="color: #333; margin: 20px 0 10px 0; font-weight: bold;">Thank you for the order</h2>
            <p style="color: #666; margin: 0; font-size: 15px;">
              Just to let you know — we've received your order, and it is now being processed. 
              You will receive it so soon..!
            </p>
          </div>

          <!-- Divider -->
          <div style="height: 1px; background-color: #eee; margin: 10px 30px 10px 30px"></div>
          
          <!-- Order number section -->
          <div style="padding: 25px 30px;">
            <p style="color: #999; margin: 0 0 1px 0; font-weight: bold; font-size: 13px; word-break: break-word">ORDER NUMBER</p>
            <p style="color: #333; margin: 0; font-size: 16px"><strong>#${data.orderId}<strong></p>
          </div>
          
            <!-- Items section -->
            <div style="overflow-x: auto; padding: 15px 30px">
                <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff;">
                    <tbody>
                        ${data.items.map(item => `
                            <tr style="margin-bottom: 8px;">
                                <td style="color: #333; border: none; text-align: left; font-weight: bold; font-size: 16px">${item.variant.variantProduct.itemTitle}</td>
                                <td style="color: #666; border: none; text-align: right;">Quantity ${item.quantity}</td>
                            </tr>
                            <tr style="margin-bottom: 8px;">
                                <td style="color: #333; border: none; text-align: left; font-weight: bold; font-size: 16px">${formatCurrency(item.totalPrice)}</td>
                                <td style="color: #666; border: none; text-align: right;">Color ${item.variant.variantColor}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
          
          
          <!-- Order details section -->
          <div style="padding: 25px 30px;">
            <h3 style="color: #333; font-size: 16px;">ORDER DETAILS</h3>

            <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff;">
                <tbody>
                        <tr style="margin-bottom: 8px;">
                            <td style="border: none; text-align: left; color: #666; margin: 0;">Payment Method</td>
                            <td style="border: none; text-align: right; color: #333; margin: 0; font-weight: bold;">${data.paymentDetails.method === PAY_CREDIT_CARD ? 'Visa/Master' : 'Cash On delivery'}</td>
                        </tr>
                        <tr style="margin-bottom: 8px;">
                            <td style="border: none; text-align: left; color: #666; margin: 0;">Shipping</td>
                            <td style="border: none; text-align: right; color: #333; margin: 0;">${formatCurrency(data.orderDeliveryCharges)}</td>
                        </tr>
                        <tr style="margin-bottom: 8px;">
                            <td style="border: none; text-align: left; color: #333; margin: 0; font-weight: bold; font-size: 16px">Total</td>
                            <td style="border: none; text-align: right; color: #333; margin: 0; font-weight: bold; font-size: 16px">${formatCurrency(data.orderTotal)}</td>
                        </tr>
                </tbody>
            </table>
          </div>
          
          <!-- Divider -->
          <div style="height: 1px; background-color: #eee; margin: 10px 30px 10px 30px"></div>
          
          <!-- Shipping address -->
          <div style="padding: 25px 30px;">
            <h3 style="color: #333; font-size: 16px;">SHIPPING ADDRESS</h3>
            <p style="color: #666; margin: 0; line-height: 1.6;">
              ${data.deliveryInfo.address}<br>
              ${data.deliveryInfo.city.city_name}, ${data.deliveryInfo.district.district_name} ${data.deliveryInfo.postalCode}
            </p>
          </div>
          
          <!-- Divider -->
          <div style="height: 1px; background-color: #eee; margin: 10px 30px 10px 30px"></div>
          
          <!-- Footer -->
          <div style="padding: 25px 30px; text-align: center;">
            <p style="color: #666; margin: 0;">Thank you for using <strong>vitalianfashion.com</strong></p>
          </div>
        </div>
      </div>
    `;
  };