# Resume Builder

Node + React + Handlebars production-ready resume builder.

## Quickstart

1. `npm install`
2. `cd frontend && npm install`
3. `npm run dev` (server + frontend concurrently) or run backend and frontend separately:
   - `npm run start` (backend only)
   - `cd frontend && npm run dev`

## Endpoints

- `POST /api/preview` `{ template, data }`
- `POST /api/export/docx` `{ template, data }`
- `GET /api/templates`

## Template files

- `templates/classicTemplate.hbs`
- `templates/easyTemplate.hbs`
- `templates/modern.hbs`

## Data model

- `data/sample.json`

## Notes

- PDF generation uses html2pdf.js on the client side.
- DOCX generation uses docx.

A tool to generate beautiful resumes in HTML, PDF, and DOCX formats from a structured JSON schema.

## Architecture

1. **Data**: Resumes are defined in `data/sample.json`.
2. **Templates**: Handlebars templates are stored in `templates/` (e.g., `modern.html`).
3. **Engine**: Scripts in `src/` combine the data and templates, then export to the target formats.

## Usage

Run `npm start` to generate the outputs.
