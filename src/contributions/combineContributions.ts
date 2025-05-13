import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDirExists } from "../ensureDirExists.js";
import type { Contribution } from "./processFiles.js";

export type CombineContributionsArgs = {
	/**
	 * The path to the folder containing the contributions .json data files.
	 *
	 * Defaults to "storage/contributions/datasets/processed".
	 *
	 * Base starts at the level of `src` folder.
	 */
	inputDir?: string;
	/**
	 * The path to the folder where combined file will be saved.
	 *
	 * Defaults to "storage/contributions/datasets/combined".
	 *
	 * Base starts at the level of `src` folder.
	 */
	outputDir?: string;
};

export async function combineContributions({
	inputDir = "storage/contributions/datasets/processed",
	outputDir = "storage/contributions/datasets/combined",
}: CombineContributionsArgs = {}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	console.log(`Processing files in: ${inputDir}`);
	const files = await fs.readdir(inputDir);

	const combined: { [key: string]: Contribution } = {};

	for (const file of files) {
		const fullPath = path.join(inputDir, file);

		console.log(`Processing file: ${file}`);
		const textData = await fs.readFile(fullPath, "utf8");
		const json = JSON.parse(textData);

		const fileName = file.split(".")[0];

		combined[fileName] = json;
	}

	const outputFolder = path.join(__dirname, "../../", outputDir);
	await ensureDirExists(outputFolder);

	await fs.writeFile(
		path.join(outputFolder, "combined.json"),
		JSON.stringify(combined),
	);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await combineContributions();
}
