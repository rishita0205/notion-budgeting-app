# Receipt → Notion Expense Uploader

A web application that processes receipt images using OCR and automatically uploads expenses to a Notion database.

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
# Optional:
OPENAI_API_KEY=your_openai_api_key
```

### Getting Notion Credentials

1. Create a new integration at https://www.notion.so/my-integrations
2. Copy the integration token
3. Create a new database in Notion with these properties:
   - Expense (Title)
   - #amount (Number)
   - category (Select with options: entertainment, groceries, food&drink, housing, transport)
   - date (Date)
4. Share your database with the integration
5. Copy the database ID from the URL (the part after the workspace name and before the ?)

## Development

```bash
npm run dev
```

Visit http://localhost:3000

## Features

- Drag & drop interface for receipt images
- OCR text extraction with Tesseract.js
- Smart parsing of common receipt fields
- Batch processing support
- Real-time editing before upload
- Direct sync with Notion database

## Swapping OCR Provider

The OCR implementation is pluggable. To use a different provider:

1. Create a new implementation in `src/lib/ocr/`
2. Implement the `extractTextFromImage` interface
3. Update the import in `src/api/extract/route.ts`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
