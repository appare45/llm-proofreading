import { parseArgs } from "node:util";

import { extractAddedLines } from "./services/patch.ts";
import { createProofreadingClient, proofreadLine } from "./services/copilot.ts";
import { createGitHubClient, createReview } from "./services/github.ts";
import { getEnvOrError } from "./utils/env.ts";

const { positionals, values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		output: {
			type: "string",
			short: "o",
		},
	},
	allowPositionals: true,
});
const subcommand = positionals[0];
const inputFile = positionals[1];
const outputFile = values.output;

if (!subcommand) {
	throw new Error("Please provide a subcommand. Available subcommands: review, submit-reviews");
}

switch (subcommand) {
	case "review": {
		if (!inputFile) {
			throw new Error("Please provide a patch file as an argument");
		}

		// Extract blocks from patch
		const patchContent = await Bun.file(inputFile).text();
		const addedLines = extractAddedLines(patchContent);

		// Proofread all lines
		const copilotClient = createProofreadingClient();
		const results = await Promise.all(
			addedLines.map(async (fileLines) => {
				return await Promise.all(
					fileLines.map(async (line) => {
						const corrected = await proofreadLine(copilotClient, line.line);
						return {
							original: line.line,
							corrected,
							filename: line.filename,
							linenumber: line.linenumber,
						};
					}),
				);
			}),
		);

		const flatResults = results.flat();
		const corrections = flatResults.filter((file) => file.corrected !== file.original);

		console.error(`Found ${corrections.length} corrections out of ${flatResults.length} lines`);
		const json = JSON.stringify(flatResults, null, 2);

		if (outputFile) {
			await Bun.write(outputFile, json);
			console.error(`Output written to ${outputFile}`);
		} else {
			console.log(json);
		}
		break;
	}
	case "submit-reviews": {
		if (!inputFile) {
			throw new Error("Please provide a reviews file as an argument");
		}
		const reviewResults = await Bun.file(inputFile).json();

		// Filter only lines that have corrections and format as suggestions
		const comments = reviewResults
			.filter((result: { original: string; corrected: string; }) => result.corrected !== result.original)
			.map((result: { filename: string; linenumber: number; corrected: string; }) => ({
				path: result.filename,
				line: result.linenumber,
				body: `\`\`\`suggestion
${result.corrected}
\`\`\``,
			}));

		console.error(`Submitting ${comments.length} review comments`);

		const github_token = getEnvOrError("GITHUB_TOKEN");
		const owner = getEnvOrError("GITHUB_REPOSITORY_OWNER");
		const repo = getEnvOrError("GITHUB_REPOSITORY").slice(owner.length + 1);
		const prNumber = Number.parseInt(getEnvOrError("GITHUB_PR_NUMBER"));
		const commitSha = getEnvOrError("GITHUB_SHA");

		const octokit = createGitHubClient(github_token);

		await createReview(
			octokit,
			{ owner, repo, prNumber },
			commitSha,
			comments,
		);

		console.error("Review submitted successfully");
		break;
	}
	default: {
		throw new Error(`Unknown subcommand: ${subcommand}. Available subcommands: review, submit-reviews`);
	}
}

process.exit(0);
