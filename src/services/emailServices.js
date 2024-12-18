import nodemailer from "nodemailer";
import { orderConfirmedHtml } from "../html/orderConfirmedHtml.js";

export const sendOrderConfirmedEmail = async (to, data) => {
  try {
    // Create a transporter object using SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER, // Replace with your SMTP server
      port: process.env.SMTP_PORT, // Replace with your SMTP port (587 for TLS)
      secure: process.env.SMTP_SECURE === "true", // Use true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USR_NAME, // Replace with your email
        pass: process.env.SMTP_PWD, // Replace with your email password or app-specific password
      },
    });

    // Define the email options
    const mailOptions = {
      from: '"Vitalian Fashion" <no-reply@vitalian.com>', // Sender's email address and name
      to, // Recipient's email address
      subject: "Order Confirmed", // Subject line
      html: orderConfirmedHtml(data), // HTML body
      attachments: [
        {
          filename: "VITALIAN-LOGO.png", // Image filename
          path: process.env.RELATIVE_PATH + "/assets/VITALIAN-LOGO.png", // Local path to the image file
          cid: "logoImage", // Unique Content ID
        },
      ],
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
