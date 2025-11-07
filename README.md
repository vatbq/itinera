# Itinera

A smart travel itinerary processor that converts your travel PDFs (flights, hotels, car rentals) into a consolidated, day-by-day Markdown itinerary with automated validation.

## Demo

Watch a quick demo of Itinera in action: [View Demo on Loom](https://www.loom.com/share/1243895291704088a6cf8ee6e176ea83)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS
- **AI**: Vercel AI SDK with OpenAI and Mistral AI
- **Form Handling**: React Hook Form + Zod validation
- **Testing**: Jest with code coverage
- **Orchestration**: Next.js Workflow directive for durable, retryable steps

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20 or higher
- **npm**: v8 or higher (comes with Node.js)

You'll also need API keys for:

- **Mistral AI**: For OCR processing ([Get API key](https://console.mistral.ai/))
- **OpenAI**: For classification and extraction ([Get API key](https://platform.openai.com/))

## Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd itinera
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory and add your API keys:

```bash
# Mistral AI (for OCR)
MISTRAL_API_KEY=your_mistral_api_key_here

# OpenAI (for classification and extraction)
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note**: Never commit your `.env.local` file. It's already included in `.gitignore`.

## Running the Project

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Other Commands

```bash
# Run linter
npm run lint

# Format code with Prettier
npm run format
```

## Testing

### Run All Tests

```bash
npm test
```

### Watch Mode

Run tests in watch mode for active development:

```bash
npm run test:watch
```

### Test Coverage

Generate and view test coverage report:

```bash
npm run test:coverage
```

This will:
- Display coverage summary in the terminal
- Generate an HTML coverage report in `coverage/lcov-report/index.html`
- Create coverage files for CI/CD integration

**Current Test Coverage Areas:**
- Document classification logic
- Data extraction and normalization
- Itinerary building and day-by-day scheduling
- Markdown generation
- Validation (lodging gaps, double bookings)

## How It Works

### Processing Pipeline

1. **OCR** - Mistral AI extracts text from PDFs
2. **Classification** - AI determines document type (hotel/flight/car)
3. **Extraction** - AI extracts structured data with Zod validation
4. **Normalization** - Standardizes dates, times, and location codes
5. **Merging** - Combines all bookings into a unified trip model
6. **Itinerary Building** - Creates day-by-day schedule
7. **Validation** - Checks for lodging gaps and conflicts
8. **Rendering** - Generates final Markdown itinerary

### Architecture Highlights

- **Deterministic Core**: Business logic is pure TypeScript for reliability and testability
- **AI at the Edges**: LLM used only for classification and extraction where vendor formats vary
- **Durable Workflows**: Uses Next.js workflow directive for retryable, fault-tolerant processing
- **Real-time Updates**: SSE streams progress to the frontend

> For detailed architecture decisions and trade-offs, see [adr.md](./adr.md)

## Project Structure

```
itinera/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/           # Server actions (file upload)
│   │   ├── api/               # API routes (workflow status)
│   │   └── workflow/          # Workflow status pages
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   └── pdf-*.tsx         # PDF upload components
│   ├── lib/
│   │   ├── ai/               # AI provider abstraction & classification
│   │   └── mistral/          # Mistral OCR integration
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # Core business logic
│   │   ├── data-processing.ts    # Normalization & merging
│   │   ├── itinerary.ts          # Day-by-day builder
│   │   └── markdown-generator.ts # Markdown output
│   ├── types/                # TypeScript type definitions
│   └── workflows/            # Workflow definitions
└── coverage/                 # Test coverage reports
```


