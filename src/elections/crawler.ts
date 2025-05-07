import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchOptions } from "camoufox-js";
import {
	Configuration,
	PlaywrightCrawler,
	type Request,
	type RequestOptions,
} from "crawlee";
import { firefox } from "playwright";
import sanitize from "sanitize-filename";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "../../", "storage/elections");

export const crawler = async (
	requests: (string | Request | RequestOptions)[],
	maxRequestsPerCrawl: number,
) =>
	new PlaywrightCrawler(
		{
			maxRequestsPerCrawl,
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
	).run(requests);
