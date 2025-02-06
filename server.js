const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// File Upload Handling (Store in Memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Registration Route
app.post("/register", upload.array("files", 15), async (req, res) => {
  const { organizationName, legalEntityName, firstName, lastName, role, email, mobileNumber, city } = req.body;
  const files = req.files || [];

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Nodemailer Setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password
    },
  });

  // Admin Email
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "New Partner Registration",
    text: `
      Organization Name: ${organizationName}
      Legal Entity Name: ${legalEntityName}
      First Name: ${firstName}
      Last Name: ${lastName}
      Role: ${role}
      Email: ${email}
      Mobile Number: ${mobileNumber}
      City: ${city}
    `,
    attachments: files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    })),
  };

  // User Confirmation Email
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Thank You for Registering",
    text: `Dear ${firstName},\n\nThank you for registering with Abroad Mentors.\n\nBest Regards,\nAbroad Mentors Team`,
  };

  try {
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);
    res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ message: "Error sending email", error: error.message });
  }
});

// Serve React Frontend (Only for Production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../graphic/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../graphic/build/index.html"));
  });
}

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
