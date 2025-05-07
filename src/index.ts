import { run as contributionsCrawler } from "./elections/index.js";
import { run as electionCrawler } from "./elections/index.js";
import { run as senatorCrawler } from "./senators/index.js";

// biome-ignore lint/correctness/noUnusedImports: Leave in for fast switching
import { formatForContributionsScrape } from "./senators/formatForContributionsScrape.js";

(async () => {
	/**
	 * DEFAULT: contributionCrawler will use the NAMES_TO_SCRAPE.json file
	 */
	await Promise.all([senatorCrawler, contributionsCrawler, electionCrawler]);

	/**
	 * Crawler will use the data from senatorCrawler
	 */
	// await Promise.all([senatorCrawler, contributionsCrawler(await formatForContributionsScrape()), electionCrawler])
})();
