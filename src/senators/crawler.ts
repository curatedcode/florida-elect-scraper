import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchOptions } from "camoufox-js";
import { Configuration, PlaywrightCrawler } from "crawlee";
import { firefox } from "playwright";
import sanitize from "sanitize-filename";
import { z } from "zod";
import { ensureDirExists } from "../ensureDirExists.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "../../", "storage/senators");

export const senator = z.object({
	name: z.string(),
	districtId: z.number(),
	party: z.string(),
	picture: z.string(),
	link: z.string(),
});

export type Senator = z.infer<typeof senator>;

export const crawler = new PlaywrightCrawler(
	{
		maxRequestsPerCrawl: 1,
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

			const baseUrl = "https://flsenate.gov";

			const rows = page
				.locator("table#Senators")
				.locator("tbody")
				.locator("tr:not(#NoMatch)");
			const count = await rows.count();

			const senators: Senator[] = [];

			for (let i = 0; i < count - 1; i++) {
				const row = rows.nth(i);

				const name = await row.locator("a.senatorLink").textContent();

				const districtId = await row.locator("td").nth(0).textContent();

				if (!name || !districtId) {
					throw new Error(`No data for Senator row #${i + 1}`);
				}

				if (name === "Vacant") {
					senators.push({
						name: "Vacant",
						districtId: Number(districtId),
						party: "",
						picture: "",
						link: "",
					});
					continue;
				}

				const firstName = name?.split(",")[0].replace(",", "");
				const restName = name?.split(",")[1].trim();
				const party = await row.locator("td").nth(1).textContent();
				const link = await row.locator("a.senatorLink").getAttribute("href");

				if (!firstName || !restName) {
					throw new Error(
						`Invalid data for Senator "${name}": ${firstName}, ${restName}`,
					);
				}

				if (!party || !link) {
					throw new Error(
						`Invalid data for Senator "${name}": ${districtId}, ${party}, ${link}`,
					);
				}

				const pictureSrc = await row
					.locator("img.senatorThumb")
					.getAttribute("src");
				const pictureLargeSrc = pictureSrc?.replace("_Thumbnail", "");

				if (!pictureLargeSrc) {
					throw new Error(`Picture for Senator "${name}" not found.`);
				}

				const pictureResponse = await page.request.get(
					`${baseUrl}${pictureLargeSrc}`,
				);
				const pictureBuffer = await pictureResponse.body();
				const nameSanitized = sanitize(`${firstName} ${restName}`);
				const pictureFilename = `${nameSanitized}.jpg`;

				const downloadsFolder = path.join(storagePath, "datasets/downloads");
				await ensureDirExists(downloadsFolder);

				const picturePath = path.join(downloadsFolder, pictureFilename);

				await fs.writeFile(picturePath, pictureBuffer);

				senators.push({
					name: `${firstName} ${restName}`,
					party,
					districtId: Number(districtId),
					link: `${baseUrl}${link}`,
					picture: picturePath,
				});
			}

			await pushData({
				senators,
			});
		},
	},
	new Configuration({
		storageClientOptions: {
			localDataDirectory: storagePath,
		},
	}),
);
