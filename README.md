# Florida-Elect-Scraper

A web scraping tool to extract and compile Florida election financial contribution data, automatically combining duplicate contributors to show total donation amounts.

## Overview

Florida-Elect-Scraper automates the process of gathering campaign finance data from the Florida Division of Elections website. It identifies all contributions for specified names, consolidates multiple donations from the same contributor, and provides comprehensive reports of financial contributions.

## Features

- Scrapes Florida election contribution data based on specified names
- Automatically combines duplicate contributor entries
- Calculates total donation amounts per contributor
- Exports results in structured format for further analysis

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/curatedcode/florida-elect-scraper.git
   cd florida-elect-scrape
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

## Configuration

### Names to Scrape

Create a JSON file named `NAMES_TO_SCRAPE.json` in the `src` directory with the names you want to search for. The file should contain an array of name strings:

```json
[
  { "first": "John", "last": "Smith" },
  { "first": "Gary", "last": "Johnson" },
	{ "first": "Bob", "last": "Brown" }
]
```

An example file is provided in the repository to help you get started.

## Usage

1. Ensure your `NAMES_TO_SCRAPE.json` file is properly configured with the names you want to search.

2. Run the scraper:
   ```
   pnpm start
   ```

3. The script will:
   - Launch a headless browser
   - Visit the Florida Division of Elections campaign finance website
   - Search for each name in your configuration file
   - Extract contribution data
   - Combine duplicate contributors
   - Generate a report with total contribution amounts

## Technical Details

### Dependencies

- [Crawlee](https://crawlee.dev/) - Web scraping and crawling framework
- [Playwright](https://playwright.dev/) - Browser automation library
- [Camoufox-js](https://github.com/example/camoufox-js) - Browser fingerprint camouflaging

### How it Works

1. **Initialization**: The application reads the names to scrape from the `NAMES_TO_SCRAPE.json` file.

2. **Web Scraping**: Using Playwright, the application navigates to the Florida Division of Elections website and searches for each name.

3. **Data Extraction**: For each search result, the application extracts contribution data including contributor names, amounts, dates, and recipient information.

4. **Data Processing**: After extraction, the application identifies duplicate contributors and combines their contribution amounts.

5. **Results**: The application outputs a comprehensive list of all contributors with their total contribution amounts.

## Troubleshooting

### Common Issues

- **Rate Limiting**: If you experience rate limiting, try increasing the delay between requests in the configuration.
- **Website Structure Changes**: If the Florida elections website structure changes, updates to the scraper may be needed.

## Legal Considerations

This tool is designed for research and analysis purposes only. Please ensure your use complies with:
- The Florida Division of Elections website terms of service
- Applicable laws regarding web scraping
- Data privacy regulations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License