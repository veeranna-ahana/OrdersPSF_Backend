const PDFRouter = require("express").Router();
const {
  misQuery,
  setupQuery,
  setupQueryMod,
  misQueryMod,
} = require("../../helpers/dbconn");
const { logger } = require("../../helpers/logger");

const express = require("express");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env file

const app = express();
// app.use(express.json({ limit: "50mb" })); // To handle large payloads

PDFRouter.post("/getPDFData", async (req, res, next) => {
  try {
    setupQueryMod(
      `SELECT * FROM magod_setup.magodlaser_units`,
      (err, pdfData) => {
        if (err) {
          console.log("err", err);
        } else {
          //   console.log("pdfData", pdfData);

          res.send(pdfData);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

// Define the API endpoint
PDFRouter.post("/upload-pdf", async (req, res) => {
  try {
    const { pdfData, fileName } = req.body;

    if (!pdfData || !fileName) {
      return res.status(400).send({ error: "Missing pdfData or fileName" });
    }

    // Decode the base64 string
    const buffer = Buffer.from(pdfData, "base64");

    // Get the path to save the file
    const folderPath = process.env.FILE_SERVER_PDF_PATH;
    const filePath = path.join(folderPath, fileName);

    // Save the file
    fs.writeFileSync(filePath, buffer);

    res.status(200).send({ message: "PDF saved successfully", filePath });
  } catch (error) {
    console.error("Error saving PDF:", error);
    res.status(500).send({ error: "Failed to save PDF" });
  }
});

module.exports = PDFRouter;
