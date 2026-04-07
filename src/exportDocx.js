const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = require("docx");

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  // A more robust HTML stripper to handle rich text content
  return html
    .replace(/<p>/gi, "\n") // Replace paragraph starts with a newline
    .replace(/<\/p>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n") // Handle line breaks
    .replace(/&nbsp;/gi, " ") // Handle non-breaking spaces
    .replace(/<[^>]+>/g, "") // Strip all other tags
    .trim();
}

/**
 * Generates a native DOCX file buffer based on the structured resume data.
 *
 * @param {object} data - The JSON resume data state.
 * @returns {Promise<Buffer>} A promise that resolves to the DOCX file buffer.
 */
async function generateDocx(data) {
  const children = [];

  // --- Basics Section ---
  const name = data.basics?.name || "Resume";
  children.push(
    new Paragraph({ 
      text: name, 
      heading: HeadingLevel.TITLE, 
      alignment: AlignmentType.CENTER 
    })
  );

  const contactInfo = [
    data.basics?.email,
    data.basics?.phone,
    data.basics?.location,
    data.basics?.url,
  ]
    .filter(Boolean)
    .join(" | ");
  if (contactInfo) {
    children.push(
      new Paragraph({ 
        text: contactInfo, 
        alignment: AlignmentType.CENTER 
      })
    );
  }

  if (data.basics?.summary) {
    children.push(
      new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
    );
    children.push(new Paragraph({ text: stripHtml(data.basics.summary) }));
  }

  // --- Work Experience Section ---
  if (data.workExperience && data.workExperience.length > 0) {
    children.push(
      new Paragraph({
        text: "Work Experience",
        heading: HeadingLevel.HEADING_2,
      }),
    );
    data.workExperience.forEach((item) => {
      children.push(
        new Paragraph({
          text: `${item.position || ""} at ${item.company || ""}`,
          heading: HeadingLevel.HEADING_3,
        }),
      );
      const meta =
        [item.startDate, item.endDate].filter(Boolean).join(" - ") +
        (item.location ? ` | ${item.location}` : "");
      if (meta) children.push(new Paragraph({ text: meta }));
      if (item.description)
        children.push(new Paragraph({ text: stripHtml(item.description) }));
      children.push(new Paragraph({ text: "" })); // Spacing
    });
  }

  // --- Education Section ---
  if (data.education && data.education.length > 0) {
    children.push(
      new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }),
    );
    data.education.forEach((item) => {
      children.push(
        new Paragraph({
          text: `${item.institution || ""} - ${item.area || ""}`,
          heading: HeadingLevel.HEADING_3,
        }),
      );
      const meta =
        [item.startDate, item.endDate].filter(Boolean).join(" - ") +
        (item.location ? ` | ${item.location}` : "") +
        (item.gpa ? ` | GPA: ${item.gpa}` : "");
      if (meta) children.push(new Paragraph({ text: meta }));
      children.push(new Paragraph({ text: "" })); // Spacing
    });
  }

  // --- Projects Section ---
  if (data.projects && data.projects.length > 0) {
    children.push(
      new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_2 }),
    );
    data.projects.forEach((item) => {
      children.push(
        new Paragraph({
          text: item.name || "Project",
          heading: HeadingLevel.HEADING_3,
        }),
      );
      const meta = [item.startDate, item.endDate].filter(Boolean).join(" - ");
      if (meta) children.push(new Paragraph({ text: meta }));
      if (item.description)
        children.push(new Paragraph({ text: stripHtml(item.description) }));
      children.push(new Paragraph({ text: "" })); // Spacing
    });
  }

  // --- Skills Section ---
  if (data.skills && data.skills.length > 0) {
    children.push(
      new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }),
    );
    data.skills.forEach((skill) => {
      if (skill)
        children.push(new Paragraph({ text: skill, bullet: { level: 0 } }));
    });
  }

  // --- Custom Sections ---
  if (data.customSections && data.customSections.length > 0) {
    data.customSections.forEach((section) => {
      children.push(
        new Paragraph({
          text: section.title || "Custom Section",
          heading: HeadingLevel.HEADING_2,
        }),
      );
      section.items?.forEach((item) => {
        children.push(
          new Paragraph({
            text: item.name || "Item",
            heading: HeadingLevel.HEADING_3,
          }),
        );
        const meta = [
          item.subtitle,
          item.startDate && item.endDate
            ? `${item.startDate} - ${item.endDate}`
            : item.startDate || item.endDate,
          item.location,
        ]
          .filter(Boolean)
          .join(" | ");
        if (meta) children.push(new Paragraph({ text: meta }));
        if (item.description)
          children.push(new Paragraph({ text: stripHtml(item.description) }));
        children.push(new Paragraph({ text: "" })); // Spacing
      });
    });
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
