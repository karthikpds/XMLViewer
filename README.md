# XML Viewer

A browser-based XML viewer and data extraction tool built with React and TypeScript. Upload XML files or ZIP archives, search across all files, and extract structured data into tables with a right-click.

## Features

### File Management
- Upload individual `.xml` files or `.zip` archives containing XML/CSV/HTML files
- XML files are automatically pretty-printed with 2-space indentation
- Manage multiple files in the sidebar with easy selection and removal

### Cross-File Search
- Search across all loaded XML files from the right sidebar
- Results display parent context (tag hierarchy) for each match
- Click any result to navigate directly to the matching location in the file, with the match highlighted

### Data Extraction

#### Extract All
Right-click any XML tag and select **Extract All** to extract every instance of that tag into a table. The table displays all child elements as columns, with one row per occurrence.

#### Extract Fields
Right-click any XML tag and select **Extract Fields...** to open a field selector that lists all descendant tags. Pick the specific fields you need, and the tool builds a table with only those columns.

- Supports fields at mixed nesting depths (e.g., `LINE/LINE_NUMBER` alongside `LINE/TAX/VENDOR_TAX/AMOUNT`)
- Automatically detects repeating elements and creates one row per instance
- Includes `LINE_ID` and `AUTHORITY_NAME` context columns when available

#### Presets
Save frequently used field selections as named presets. Presets are stored in the browser (localStorage) and persist across sessions.

### Copy to Excel
Extraction results can be copied to the clipboard in a tab-separated format, ready to paste into Excel or any spreadsheet application.

## Getting Started

### Prerequisites
- Node.js 18+

### Install and Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 19** with TypeScript
- **Vite** for bundling and dev server
- **JSZip** for ZIP archive extraction
- **Lucide React** for icons
- **Tailwind CSS** for styling
