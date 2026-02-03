import { extractAddedLines } from "../services/patch.ts";

export interface ExtractTargetsCommandOptions {
	output?: string;
}

/**
 * Extract targets command handler
 * Reads a patch file, extracts added lines, and outputs them as JSON
 */
export const extractTargetsCommand = async (
	inputFile: string,
	options: ExtractTargetsCommandOptions,
): Promise<void> => {
	if (!inputFile) {
		throw new Error("Please provide a patch file as an argument");
	}

	// Read patch file
	const patchContent = await Bun.file(inputFile).text();

	// Extract targets
	const targets = extractAddedLines(patchContent);

	// Calculate summary
	const totalLines = targets.reduce((sum, fileLines) => sum + fileLines.length, 0);
	const fileCount = targets.length;

	// Report summary
	console.error(
		`Extracted ${totalLines} lines from ${fileCount} files`,
	);

	// Output results
	const json = JSON.stringify(targets, null, 2);

	if (options.output) {
		await Bun.write(options.output, json);
		console.error(`Output written to ${options.output}`);
	} else {
		console.log(json);
	}
};
