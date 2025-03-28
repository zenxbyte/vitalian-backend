import BwipJs from "bwip-js";
import { PAY_ON_DELIVER } from "../constants/paymentMethods.js";

export const generateDeliveryInfoPDF = async(doc, data) => {
  doc.image("src/assets/VITALIAN-LOGO.png", 50, 50, {
    width: 100,
    height: 100,
  });

  doc.fontSize(20).text("Vitalian Fashion", 180, 65);
  doc
    .fontSize(10)
    .text("21/3, Galle Rd, Pinwatta, Panadura, Sri Lanka", 180, 90);
  doc.fontSize(10).text("Phone: +94 75 330 4215", 180, 110);
  doc.fontSize(10).text("Email: vitalian.inc@gmail.com", 180, 130);

  doc.moveTo(50, 180).lineTo(385, 180).stroke();

  doc.fontSize(16).text("Receiver Information", 50, 200, { underline: true });

  const receiverInfo = [
    {
      label: "Receiver Name:",
      value: `${data.customer.firstName} ${data.customer.lastName}`,
      incrementBy: 25,
    },
    { label: "Address:", value: data.deliveryInfo.address, incrementBy: 50 },
    { label: "Mobile Number:", value: data.customer.phone, incrementBy: 25 },
    {
      label: "District:",
      value: data.deliveryInfo.district.district_name,
      incrementBy: 25,
    },
    {
      label: "Nearest City:",
      value: data.deliveryInfo.city.city_name,
      incrementBy: 25,
    },
    { label: "Weight (Approximately):", value: "", incrementBy: 25 },
    {
      label: "Description:",
      value: "Clothing (T-Shirt / Shirt / etc)",
      incrementBy: 25,
    },
  ];

  let yPosition = 230;
  receiverInfo.forEach((info) => {
    doc.font("Helvetica-Bold").fontSize(12).text(info.label, 50, yPosition);
    doc.font("Helvetica").text(info.value, 200, yPosition);
    yPosition += info.incrementBy;
  });

  doc
    .moveTo(50, yPosition + 10)
    .lineTo(385, yPosition + 10)
    .stroke();

  yPosition += 30;

  if (data.orderWayBillId) {
    await BwipJs.toBuffer({
      bcid: "code128",
      text: data.orderWayBillId,
      scale: 3,
      height: 15,
      includetext: true,
      textxalign: "center",
    })
      .then((pngBuffer) => {
        doc.image(pngBuffer, 50, yPosition, { width: 120, height: 70 });
      })
      .catch((err) => {
        doc.font("Helvetica-Bold").fontSize(12).text("-", 50, yPosition);
      });
  }

  const codAmount =
    data.paymentDetails.method === PAY_ON_DELIVER ? data.orderTotal : "Paid";
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("COD Amount:", 250, yPosition + 25);
  doc.font("Helvetica").text(codAmount, 350, yPosition + 25);

  doc
    .moveTo(50, yPosition + 80)
    .lineTo(385, yPosition + 80)
    .stroke();

  return doc;
};

// Usage example:
// const doc = generateDeliveryInfoPDF(data);
// doc.pipe(res); // Where res is the HTTP response
// doc.end();
