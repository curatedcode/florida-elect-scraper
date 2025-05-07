import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Senator } from "./crawler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "../../", "storage");

export async function formatForContributionsScrape() {
	const datasetDir = path.join(storagePath, "senators/datasets/default");
	const files = await fs.readdir(datasetDir);

	const formattedData: { first: string; last: string }[] = [];

	for (const filename of files) {
		const filePath = path.join(datasetDir, filename);
		const fileContents = await fs.readFile(filePath, "utf-8");
		const jsonData = JSON.parse(fileContents) as { senators: Senator[] };

		for (const senator of jsonData.senators) {
			const firstName = senator.name.split(" ")[1];
			const lastName = senator.name.split(" ")[0];

			formattedData.push({
				first: firstName,
				last: lastName,
			});
		}
	}

	return formattedData;
}
