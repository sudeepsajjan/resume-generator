# Architecture

## Flow

User Input → JSON → Handlebars → HTML → PDF/DOCX

## Components

- Editor UI
- Template Engine
- Export Engine

## Key Idea

Separation of data and design.

## Project Structure

resume-builder/
│
├── templates/
│ └── modern.html
│
├── data/
│ └── sample.json
│
├── src/
│ ├── render.js
│ └── exportDocx.js
│
├── index.js
├── package.json
└── README.md
