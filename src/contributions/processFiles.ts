import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import _ from "lodash";
import Papa from "papaparse";

interface ContributionData {
	"Candidate/Committee": string;
	Date: string;
	Amount: string;
	Typ: string;
	"Contributor Name": string;
	"Address City State Zip": string;
	Occupation: string;
	Inkind: string;
	Desc: string;
}

export type ProcessFilesArgs = {
	/**
	 * The path to the folder containing the elections .txt data files.
	 *
	 * Defaults to "storage/elections/downloads".
	 *
	 * Base starts at the level of `src` folder.
	 */
	inputDir?: string;
	/**
	 * The path to the folder where processed files will be saved.
	 *
	 * Defaults to "storage/elections/processed".
	 *
	 * Base starts at the level of `src` folder.
	 */
	outputDir?: string;
	/**
	 * The output type for the processed data.
	 *
	 * Defaults to `["json"]`.
	 */
	outputType?: ("csv" | "json")[];
};

export async function processFiles({
	inputDir = "storage/contributions/downloads",
	outputDir = "storage/contributions/processed",
	outputType = ["json"],
}: ProcessFilesArgs = {}) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	console.log(`Processing files in: ${inputDir}`);
	const files = await fs.readdir(inputDir);

	for (const file of files) {
		const fullPath = path.join(inputDir, file);

		const fileStat = await fs.stat(fullPath);
		if (fileStat.isFile() && path.extname(file) === ".txt") {
			console.log(`Processing file: ${file}`);
			const textData = await fs.readFile(fullPath, "utf8");

			const result = Papa.parse<ContributionData>(textData, {
				header: true,
				delimiter: "\t",
				skipEmptyLines: true,
				dynamicTyping: false,
				transformHeader: (header) => header.trim(),
			});

			if (result.errors && result.errors.length > 0) {
				console.warn(`Parsing warnings for ${file}:`, result.errors);
			}

			const grouped = _.chain(result.data)
				.filter(
					(item) =>
						!!item["Contributor Name"] && item["Contributor Name"] !== "",
				)
				.groupBy((item) => item["Contributor Name"])
				.map((items, contributor) => {
					const totalContribution = _.sumBy(items, (item) => {
						const amount = item.Amount;

						if (!amount) {
							console.warn("Missing amount for entry:", item);
							return 0;
						}

						const cleanAmount = amount.replace(/[$,]/g, "").trim();
						const numAmount = Number.parseFloat(cleanAmount);

						if (Number.isNaN(numAmount)) {
							console.warn(
								`Invalid amount value: "${amount}" for contributor ${contributor}`,
							);
							return 0;
						}

						return numAmount;
					});

					return {
						contributor,
						totalContribution,
						contributionCount: items.length,
					};
				})
				.value();

			const jsonOutputFileName = file.replace(".txt", ".json");
			const csvOutputFileName = file.replace(".txt", ".csv");

			const outputFolder = path.join(__dirname, "../../", outputDir);

			const outputPathJson = path.join(outputFolder, jsonOutputFileName);
			const outputPathCsv = path.join(outputFolder, csvOutputFileName);

			for (const type of new Set(outputType)) {
				if (type === "json") {
					await fs.writeFile(outputPathJson, JSON.stringify(grouped, null, 2));
				} else {
					await fs.writeFile(outputPathCsv, Papa.unparse(grouped));
				}
			}

			console.log(
				`Processed ${file}: Found ${grouped.length} separate contributions`,
			);
		}
	}
}
