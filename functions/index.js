const { initializeApp } = require("firebase-admin/app");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

initializeApp();

const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const SMTP_FROM = defineSecret("SMTP_FROM");
const ADMIN_EMAIL = defineSecret("ADMIN_EMAIL");

const secrets = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ADMIN_EMAIL];

function sendMail(to, subject, text) {
  const port = Number(SMTP_PORT.value());
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port: port,
    secure: port === 465,
    auth: {
      user: SMTP_USER.value(),
      pass: SMTP_PASS.value(),
    },
  });

  return transporter.sendMail({
    from: SMTP_FROM.value(),
    to: to,
    subject: subject,
    text: text,
  });
}

exports.onCustomerCreated = onDocumentCreated(
  {
    document: "customers/{customerId}",
    secrets: secrets,
  },
  async (event) => {
    const data = event.data.data();
    const customerEmail = data.email;
    const customerName = data.name || "Customer";

    // 1. Email to Admin
    await sendMail(
      ADMIN_EMAIL.value(),
      "New Customer Registered",
      `New customer: ${customerName} - ${customerEmail}`
    );

    // 2. Email to Customer
    if (customerEmail) {
      await sendMail(
        customerEmail,
        "Welcome!",
        `Hi ${customerName}, thank you for registering.`
      );
    }
  }
);