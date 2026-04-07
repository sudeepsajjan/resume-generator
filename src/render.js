const fs = require("fs/promises");
const path = require("path");
const Handlebars = require("handlebars");

// Register Global Helpers for extensibility

// Formats a date range, defaulting "to" date to "Present" if missing
Handlebars.registerHelper("formatDate", (from, to) => {
  if (!from) return "Present";
  if (!to) return `${from} - Present`;
  return `${from} - ${to}`;
});

// Joins an array of strings with a specified separator
Handlebars.registerHelper("join", (array, separator) => {
  if (!Array.isArray(array)) return array || "";
  return array.join(typeof separator === "string" ? separator : ", ");
});

// Checks if two values are strictly equal
Handlebars.registerHelper("eq", (a, b) => a === b);

// Converts a string to lowercase
Handlebars.registerHelper("lowercase", (str) =>
  typeof str === "string" ? str.toLowerCase() : str,
);

/**
 * Core template rendering engine.
 * @param {string} templateString - The raw Handlebars/HTML template.
 * @param {object} data - The JSON data payload.
 * @returns {string} The rendered HTML string.
 */
function renderTemplate(templateString, data) {
  const template = Handlebars.compile(templateString);
  return template(data);
}

/**
 * Loads a Handlebars template from the filesystem and renders it with the provided data.
 *
 * @param {object} data - The resume data payload.
 * @param {string} [templateName="classicTemplate"] - The name of the template file (without extension).
 * @returns {Promise<string>} A promise that resolves to the rendered HTML string.
 */
async function renderResume(data, templateName = "classicTemplate") {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    `${templateName}.hbs`,
  );
  const templateSource = await fs.readFile(templatePath, "utf-8");
  return renderTemplate(templateSource, data);
}

module.exports = { renderTemplate, renderResume };
