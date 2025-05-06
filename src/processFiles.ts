import fs from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
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
	 * The path to the folder containing the input .txt files
	 */
	inputFolder: string;
	/**
	 * The output type for the processed data. Can be "csv", "json", or both
	 *
	 * Defaults to [ "json" ].
	 */
	outputType?: Array<"csv" | "json">;
};

export async function processFiles({
	inputFolder,
	outputType = ["json"],
}: ProcessFilesArgs) {
	try {
		console.log(`Processing files in: ${inputFolder}`);
		const files = await readdir(inputFolder);

		for (const file of files) {
			const fullPath = join(inputFolder, file);

			const fileStat = await stat(fullPath);
			if (fileStat.isFile() && extname(file) === ".txt") {
				console.log(`Processing file: ${file}`);
				const textData = await readFile(fullPath, "utf8");

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

				const outputFolder = `${process.cwd()}/storage/datasets/downloads`;

				if (!fs.existsSync(outputFolder)) {
					throw new Error(
						"Output folder does not exist. It should have been created when the crawler ran.",
					);
				}

				const outputPathJson = join(outputFolder, jsonOutputFileName);
				const outputPathCsv = join(outputFolder, csvOutputFileName);

				for (const type of new Set(outputType)) {
					if (type === "json") {
						fs.writeFileSync(outputPathJson, JSON.stringify(grouped, null, 2));
						console.log(`Created JSON file: ${jsonOutputFileName}`);
					} else {
						fs.writeFileSync(outputPathCsv, Papa.unparse(grouped));
						console.log(`Created CSV file: ${csvOutputFileName}`);
					}
				}

				console.log(
					`Processed ${file}: Found ${grouped.length} separate contributions`,
				);
			}
		}
	} catch (err) {
		console.error("Error while processing files:", err);
		console.error(err instanceof Error ? err.stack : String(err));
	}
}
