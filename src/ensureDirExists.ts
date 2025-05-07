import fs from "node:fs/promises";

export async function ensureDirExists(dirPath: string): Promise<void> {
	try {
		const stats = await fs.stat(dirPath);
		if (!stats.isDirectory()) {
			throw new Error(`${dirPath} exists but is not a directory`);
		}
	} catch {
		await fs.mkdir(dirPath, { recursive: true });
	}
}
