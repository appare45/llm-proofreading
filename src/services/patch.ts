import parseGitPatch from "parse-git-patch/dist/src";
import type { AddedLine } from "../types/index.ts";

export const extractAddedLines = (diffContent: string): AddedLine[][] => {
	const patch = parseGitPatch(diffContent);
	if (!patch) throw new Error("Failed to parse patch file");

	return patch.files
		.filter((file) => !file.deleted)
		.map((file) =>
			file.modifiedLines
				.filter((line) => line.added && line.line)
				.map((line) => ({
					filename: file.afterName,
					line: line.line,
					linenumber: line.lineNumber,
				})),
		);
};
