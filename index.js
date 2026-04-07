const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const morgan = require("morgan");
const { renderResume } = require("./src/render");
const { generateDocx } = require("./src/exportDocx");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.post("/api/preview", async (req, res) => {
  try {
    const { template, data } = req.body;
    if (!template || !data)
      return res.status(400).json({ error: "template and data are required" });
    let html;
    try {
      html = await renderResume(data, template);
    } catch (renderErr) {
      console.warn(
        `Template engine failed for '${template}'. Using fallback UI.`,
      );
      html = `
        <div style="padding: 2rem; font-family: sans-serif; color: #333;">
          <h2>Preview Unavailable</h2>
          <p>The template <strong>${template}</strong> could not be rendered. The template files may be missing.</p>
          <p>Your data is still saved safely. Try selecting another template from the Home screen or check your backend logs.</p>
        </div>
      `;
    }
    res.json({ html });
  } catch (error) {
    console.error("Preview generation failed", error);
    res.status(500).json({ error: "Preview generation failed" });
  }
});

app.post("/api/export/docx", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res
        .status(400)
        .json({ error: "data is required for DOCX export" });
    }

    const filename = `resume-${uuidv4()}.docx`;
    // Word doesn't translate HTML natively well, we use the structured data to construct a native Word document directly.
    const docxBuffer = await generateDocx(data);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(Buffer.from(docxBuffer)); // Use res.end for raw binary delivery
  } catch (error) {
    console.error("DOCX export failed", error);
    res.status(500).json({ error: "DOCX export failed" });
  }
});

app.get("/api/templates", async (req, res) => {
  try {
    let files = [];
    try {
      files = await fs.readdir(path.join(__dirname, "templates"));
    } catch (err) {
      console.warn(
        "Templates directory not found, returning default templates.",
      );
      return res.json({
        templates: ["classicTemplate", "easyTemplate", "modern"],
      });
    }

    const hbs = [
      ...new Set(
        files
          .filter((file) => file.endsWith(".hbs") || file.endsWith(".html"))
          .map((f) => f.replace(/\.(hbs|html)$/, "")),
      ),
    ];
    res.json({
      templates: hbs.length
        ? hbs
        : ["classicTemplate", "easyTemplate", "modern"],
    });
  } catch (error) {
    console.error("Unable to list templates", error);
    res.status(500).json({ error: "Unable to list templates" });
  }
});

// Serve the static files from the Vite build directory
app.use(express.static(path.join(__dirname, "frontend", "dist")));

// For any other request, serve the index.html file for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Resume Builder API listening on http://localhost:${PORT}`);
});
