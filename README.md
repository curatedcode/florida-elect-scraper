# Florida Elections Data Scraper

A powerful web scraping tool built with Crawlee/Playwright, specifically designed to gather and process data about Florida elections, candidates, senators, and campaign contributions.

## 🔍 Overview

This tool allows you to scrape comprehensive data from Florida's election resources, including:

- **Election Results**: Detailed vote counts by candidate, party, district, and county
- **Campaign Contributions**: Financial contributions data with dates, amounts, and contributor information
- **Senator Information**: Current Florida senators' profiles including district, party affiliation, and contact details

## 🚀 Features

- **Highly Configurable**: Customizable input and output options
- **Robust Data Collection**: Comprehensive data gathering for election analysis
- **Multi-format Output**: Export data in JSON and/or CSV formats
- **Organized Storage**: Structured data storage with configurable paths

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/curatedcode/florida-elect-scraper.git

# Navigate to the project directory
cd florida-elect-scraper

# Install dependencies
pnpm install
```

## 📊 Usage Examples

### Scrape and Process Election Data

```typescript
import { run } from './src/elections';

// Using default configuration (scrapes 11/5/2024 election data)
await run();

// Custom configuration
await run({
	crawlerOptions: {
    dates: ['11/8/2022', '8/23/2022'],
    outputDir: 'custom/output/path'
  },
  processOptions: {
  	inputDir: 'custom/input/path',
    outputDir: 'custom/output/path'
	}
})
```

### Scraping Election Data

```typescript
import { crawler } from './src/elections/crawler';

// Using default configuration (scrapes 11/5/2024 election data)
await crawler();

// Custom configuration
await crawler({
  dates: ['11/8/2022', '8/23/2022'],
  outputDir: 'custom/output/path'
})
```

### Processing Election Files

```typescript
import { processFiles } from './src/elections/processFiles';

// Using default configuration
await processFiles();

// Custom configuration
await processFiles({
  inputDir: 'custom/input/path',
  outputDir: 'custom/output/path'
});
```

### Scrape and Process Contribution Data

```typescript
import { run } from './src/contributions';

// Using names from default NAMES_TO_SCRAPE.json file
await run();

// Custom configuration
await run({
	crawlerOptions: {
    names: ['John Smith', 'Jane Doe'],
    outputDir: 'custom/output/path'
  },
  processOptions: {
  	inputDir: 'custom/input/path',
    outputDir: 'custom/output/path'
	}
})
```

### Scraping Contributions Data

```typescript
import { crawler } from './src/contributions/crawler';

// Using names from default NAMES_TO_SCRAPE.json file
await crawler();

// Custom names list
await crawler({
  names: ['John Smith', 'Jane Doe'],
  outputDir: 'custom/output/path'
})
```

### Processing Contributions Files

```typescript
import { processFiles } from './src/contributions/processFiles';

// Using default configuration
await processFiles();

// Custom configuration
await processFiles({
  inputDir: 'custom/input/path',
  outputDir: 'custom/output/path'
});
```

### Scraping Senator Data

```typescript
import { run } from './src/senators';

// Default storage location
await run();

// Custom storage location
await run({
  crawlerOptions: {
		outputDir: 'custom/output/path'
	}
});
```

## 📝 License

[MIT](LICENSE)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

For questions or support, please open an issue.