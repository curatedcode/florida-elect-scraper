import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchOptions } from "camoufox-js";
import { Configuration, PlaywrightCrawler } from "crawlee";
import { firefox } from "playwright";
import sanitize from "sanitize-filename";

export type CrawlerArgs = {
	/**
	 * Dates to crawl.
	 *
	 * Need to be formatted "M/D/YYYY" no leading 0's in Month or Day.
	 *
	 * Defaults to ["11/5/2024"].
	 */
	dates?: string[];
	/**
	 * Storage path. Defaults to "storage/elections".
	 *
	 * Base starts at the level of `src` folder.
	 */
	outputDir?: string;
};

export async function crawler({
	dates = ["11/5/2024"],
	outputDir = "storage/elections",
}: CrawlerArgs = {}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const storagePath = path.join(__dirname, "../../", outputDir);

	for (const date of dates) {
		const month = date.split("/")[0];
		const day = date.split("/")[1];

		if (month[0] === "0" || day[0] === "0") {
			throw new Error(
				"Invalid date format. Month/Day should not have leading 0",
			);
		}
	}

	return new PlaywrightCrawler(
		{
			maxRequestsPerCrawl: dates.length + 1,
			browserPoolOptions: {
				useFingerprints: false,
			},
			launchContext: {
				launcher: firefox,
				launchOptions: await launchOptions({
					headless: true,
				}),
			},

			async requestHandler({ request, page, log, pushData }) {
				const title = await page.title();
				log.info(`${title}`, { url: request.loadedUrl });

				if (!request.userData.electionDate) {
					throw new Error("Election date is missing in userData");
				}

				const downloadPromise = page.waitForEvent("download");

				await page.getByRole("button", { name: "Download" }).click();

				const sanitizedElectionDate = sanitize(request.userData.electionDate);

				const filePath = path.join(
					storagePath,
					"datasets/downloads",
					`election-results-${sanitizedElectionDate}.txt`,
				);

				const download = await downloadPromise;
				await download.saveAs(filePath);

				await pushData({
					electionDate: request.userData.electionDate,
					rawFile: filePath,
				});
			},
		},
		new Configuration({
			storageClientOptions: {
				localDataDirectory: storagePath,
			},
		}),
	).run(
		dates.map((date) => ({
			url: `https://results.elections.myflorida.com/downloadresults.asp?ElectionDate=${date}&DATAMODE=`,
			userData: {
				electionDate: date,
			},
		})),
	);
}
