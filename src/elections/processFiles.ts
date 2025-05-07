import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import _ from "lodash";
import Papa from "papaparse";

interface ElectionData {
	/**
	 * Date of the election.
	 * @example "11/5/2024"
	 */
	ElectionDate: string;
	/**
	 * Party code.
	 * @example "DEM"
	 */
	PartyCode: string;
	/**
	 * Name of the party.
	 * @example "Democrat"
	 */
	PartyName: string;
	/**
	 * Race code.
	 * @example "PRE"
	 */
	RaceCode: string;
	/**
	 * Race name.
	 * @example "President of the United States"
	 */
	OfficeDesc: string;
	/**
	 * County code.
	 * @example "ALA"
	 */
	CountyCode: string;
	/**
	 * County name.
	 * @example "Alachua"
	 */
	CountyName: string;
	/**
	 * Jurisdiction code 1.
	 * @example 6
	 */
	Juris1num: number;
	/**
	 * Jurisdiction code 2.
	 * @example 14
	 *
	 * Reserved for Circuit Judges.
	 */
	Juris2num: number | undefined;
	/**
	 * Precincts in district.
	 * @example 10
	 */
	Precincts: number;
	/**
	 * Total reporting precincts in district.
	 * @example 10
	 */
	PrecinctsReporting: number;
	/**
	 * Candidate last name.
	 * @example "Hartman"
	 */
	CanNameLast: string;
	/**
	 * Candidate first name.
	 * @example "Ralph"
	 */
	CanNameFirst: string;
	/**
	 * Candidate middle name.
	 * @example "E."
	 */
	CanNameMiddle: string | undefined;
	/**
	 * Total votes candidate received.
	 * @example 87711
	 */
	CanVotes: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storagePath = path.join(__dirname, "../../", "storage/elections");

/**
 * @param inputFolder - The path to the folder containing the input .txt files
 */
export async function processFiles(inputFolder: string) {
	try {
		console.log(`Processing files in: ${inputFolder}`);
		const files = await fs.readdir(inputFolder);

		for (const file of files) {
			const fullPath = path.join(inputFolder, file);

			const fileStat = await fs.stat(fullPath);
			if (fileStat.isFile() && path.extname(file) === ".txt") {
				console.log(`Processing file: ${file}`);
				const textData = await fs.readFile(fullPath, "utf8");

				const result = Papa.parse<ElectionData>(textData, {
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
					.filter((item) => item.RaceCode === "STS")
					.groupBy((item) => item.Juris1num)
					.map((items) => {
						const candidatesMerged = items.reduce<Record<string, ElectionData>>(
							(acc, item) => {
								const key = `${item.CanNameFirst} ${item.CanNameMiddle} ${item.CanNameLast}`;

								if (acc[key]) {
									acc[key].CanVotes += Number(item.CanVotes);
								} else {
									item.CanVotes = Number(item.CanVotes);
									acc[key] = item;
								}

								return acc;
							},
							{},
						);

						const _candidates = Object.entries(candidatesMerged).map(
							([_, item]) => item,
						);

						const candidates = _candidates.map((item) => {
							const withMiddleName = `${item.CanNameFirst} ${item.CanNameMiddle} ${item.CanNameLast}`;
							const withoutMiddleName = `${item.CanNameFirst} ${item.CanNameLast}`;

							return {
								name: item.CanNameMiddle ? withMiddleName : withoutMiddleName,
								votes: item.CanVotes,
								party: item.PartyCode,
								district: Number(item.Juris1num),
							};
						});

						return {
							candidates,
							district: candidates[0].district,
							totalVotes: candidates.reduce((acc, item) => acc + item.votes, 0),
							winner: candidates.sort((a, b) => b.votes - a.votes)[0],
						};
					})
					.value();

				const outputFolder = path.join(storagePath, "datasets/downloads");
				const outputPathJson = path.join(
					outputFolder,
					file.replace(".txt", ".json"),
				);
				await fs.writeFile(outputPathJson, JSON.stringify(grouped, null, 2));

				console.log(
					`Processed ${file}: Found ${grouped.length} separate elections`,
				);
			}
		}
	} catch (err) {
		console.error("Error while processing files:", err);
		console.error(err instanceof Error ? err.stack : String(err));
	}
}
