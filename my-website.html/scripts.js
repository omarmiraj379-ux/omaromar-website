import { db } from "./omaromar.html";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// OMAROMAR settings
const WHATSAPP_NUMBER = "254707076782";

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyGRb-7kVtS09h3NzjjsGqVclu3Zf4zHEiGn5wei-LhPUqjfnzgympP-mgN2uwQ/exec";

// Display current year
document.getElementById("year").textContent =
  new Date().getFullYear();

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}

// Open WhatsApp with a message
function openWhatsApp(message) {
  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

// Send data to Google Sheets
async function sendToGoogleSheets(data) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(data)
    });
  } catch (error) {
    console.warn("Google Sheets submission failed:", error);
  }
}

// Main service enquiry form
const enquiryForm = document.getElementById("enquiry");
const enquiryStatus = document.getElementById("status");
const enquirySubmit = document.getElementById("enquirySubmit");

if (enquiryForm) {
  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(enquiryForm);

    const name = formData.get("name");
    const contact = formData.get("contact");
    const service = formData.get("service");
    const details = formData.get("details");

    const message =
      `Service: ${service}\nDetails: ${details}`;

    const whatsappMessage =
      `Service enquiry — OMAROMAR\n\n` +
      `Name: ${name}\n` +
      `Contact: ${contact}\n` +
      `Service: ${service}\n` +
      `Details: ${details}`;

    if (enquirySubmit) enquirySubmit.disabled = true;

    if (enquiryStatus) {
      enquiryStatus.textContent = "Sending your enquiry...";
    }

    try {
      await addDoc(collection(db, "requests"), {
        name: name,
        phone: contact,
        email: contact,
        message: message,
        createdAt: serverTimestamp()
      });

      await sendToGoogleSheets({
        name,
        contact,
        service,
        details
      });

      if (enquiryStatus) {
        enquiryStatus.textContent =
          "Enquiry saved. Review and send your WhatsApp message.";
      }

      openWhatsApp(whatsappMessage);
      enquiryForm.reset();

    } catch (error) {
      console.error("Enquiry error:", error);

      if (enquiryStatus) {
        enquiryStatus.textContent =
          "Sorry, the enquiry could not be saved. Please try again.";
      }

    } finally {
      if (enquirySubmit) enquirySubmit.disabled = false;
    }
  });
}

// WhatsApp button for the service enquiry
const whatsappEnquiryButton =
  document.getElementById("whatsappEnquiryButton");

if (whatsappEnquiryButton && enquiryForm) {
  whatsappEnquiryButton.addEventListener("click", () => {
    if (!enquiryForm.reportValidity()) return;

    const data = new FormData(enquiryForm);

    openWhatsApp(
      `Service enquiry — OMAROMAR\n\n` +
      `Name: ${data.get("name")}\n` +
      `Contact: ${data.get("contact")}\n` +
      `Service: ${data.get("service")}\n` +
      `Details: ${data.get("details")}`
    );
  });
}

// Customer message form
const customerForm = document.getElementById("customerForm");
const formStatus = document.getElementById("formStatus");

if (customerForm) {
  customerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(customerForm);

    const name = data.get("customerName");
    const phone = data.get("customerPhone");
    const email = data.get("customerEmail");
    const message = data.get("customerMessage");

    const whatsappMessage =
      `Customer message — OMAROMAR\n\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Email: ${email}\n` +
      `Message: ${message}`;

    const submitButton = customerForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    if (formStatus) {
      formStatus.textContent = "Sending your message...";
    }

    try {
      await addDoc(collection(db, "requests"), {
        name,
        phone,
        email,
        message,
        status: "New",
        createdAt: serverTimestamp()
      });

      await sendToGoogleSheets({
        name,
        contact: phone,
        email,
        details: message
      });

      if (formStatus) {
        formStatus.textContent =
          "Message saved. Review and send your WhatsApp message.";
      }

      openWhatsApp(whatsappMessage);
      customerForm.reset();

    } catch (error) {
      console.error("Customer message error:", error);

      if (formStatus) {
        formStatus.textContent =
          "Sorry, your message could not be saved. Please try again.";
      }

    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

// WhatsApp button for customer messages
const whatsappCustomerButton =
  document.getElementById("whatsappCustomerButton");

if (whatsappCustomerButton && customerForm) {
  whatsappCustomerButton.addEventListener("click", () => {
    if (!customerForm.reportValidity()) return;

    const data = new FormData(customerForm);

    openWhatsApp(
      `Customer message — OMAROMAR\n\n` +
      `Name: ${data.get("customerName")}\n` +
      `Phone: ${data.get("customerPhone")}\n` +
      `Email: ${data.get("customerEmail")}\n` +
      `Message: ${data.get("customerMessage")}`
    );
  });
}
