import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchOptions } from "camoufox-js";
import { Configuration, PlaywrightCrawler } from "crawlee";
import { firefox } from "playwright";
import sanitize from "sanitize-filename";
import { z } from "zod";
import { ensureDirExists } from "../ensureDirExists.js";

export type CrawlerArgs = {
	/**
	 * The names to scrape.
	 *
	 * Defaults to the `NAMES_TO_SCRAPE.json` file.
	 */
	names?: string[];
	/**
	 * Storage path. Defaults to "storage/contributions".
	 *
	 * Base starts at the level of `src` folder.
	 */
	outputDir?: string;
};

export async function crawler({
	names,
	outputDir = "storage/contributions",
}: CrawlerArgs = {}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const storagePath = path.join(__dirname, "../../", outputDir);

	let namesToScrape: string[] = [];

	if (names) {
		namesToScrape = names;
	} else {
		const namesFile = await fs.readFile(
			path.join(__dirname, "NAMES_TO_SCRAPE.json"),
			"utf-8",
		);
		const parsed = JSON.parse(namesFile);

		const zodParsed = z.array(z.string()).safeParse(parsed);

		if (!zodParsed.success) {
			throw new Error(
				`${__dirname}/NAMES_TO_SCRAPE.json is formatted incorrectly. Error: "${zodParsed.error.issues[0].message}"`,
			);
		}

		namesToScrape = zodParsed.data;
	}

	return new PlaywrightCrawler(
		{
			maxRequestsPerCrawl: namesToScrape.length,
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

				await page.locator("select[name='election']").selectOption("All");

				await page
					.locator("input[name='CanFName']")
					.fill(request.userData.name.split(" ")[0].trim());
				await page
					.locator("input[name='CanLName']")
					.fill(request.userData.name.split(" ")[1].trim());

				await page
					.locator("input[name='search_on'][type='radio'][value='2']")
					.click();

				await page.locator("input[name='rowlimit']").clear();

				await page.locator("input[name='queryformat'][value='2']").click();

				const downloadPromise = page.waitForEvent("download");

				await page.getByRole("button", { name: "Submit" }).click();

				const fileSafeName = sanitize(request.userData.name);
				const folder = path.join(storagePath, "datasets/downloads");
				await ensureDirExists(folder);

				const filePath = path.join(folder, `${fileSafeName}.txt`);

				const download = await downloadPromise;
				await download.saveAs(filePath);

				await pushData({
					name: request.userData.name,
				});
			},
		},
		new Configuration({
			storageClientOptions: {
				localDataDirectory: storagePath,
			},
		}),
	).run(
		namesToScrape.map((name) => ({
			url: "https://dos.elections.myflorida.com/campaign-finance/contributions/#both",
			userData: { name },
			uniqueKey: name,
		})),
	);
}
