import { proofreadPullRequest } from "./lib/proofreader.ts";
import { getEnvOrError } from "./utils/env.ts";
import { parseArgs } from "node:util";
import { extractAddedLines } from "./services/patch.ts";
import { createProofreadingClient, proofreadLine } from "./services/copilot.ts";
import { createGitHubClient, createReview } from "./services/github.ts";
import type { AddedLine } from "./types/index.ts";

const { values, positionals } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		// Generate a block of patch content for testing
		patch: {
			type: "string",
		},

		// Blocks
		blocks: {
			type: "string",
		},

		// Submit review comments from the json file
		reviews: {
			type: "string",
		},
	},
	allowPositionals: true,
});
const subcommand = positionals[0] || "proofread";

switch (subcommand) {
	case "generate-blocks": {
		if (!values.patch) {
			throw new Error("Please provide a patch file with --patch");
		}
		const patchContent = await Bun.file(values.patch).text();
		const blocks = extractAddedLines(patchContent);
		console.log(JSON.stringify(blocks, null, 2));
		break;
	}
	case "review-from-file": {
		if (!values.blocks) {
			throw new Error("Please provide a blocks file with --blocks");
		}
		const blocksContent = await Bun.file(values.blocks).json();
		const addedLines = blocksContent as AddedLine[][];
		const copilotClient = createProofreadingClient();

		// Proofread all lines (same logic as proofreadPullRequest)
		const results = await Promise.all(
			addedLines.map(async (fileLines) => {
				return await Promise.all(
					fileLines.map(async (line) => {
						const corrected = await proofreadLine(copilotClient, line.line);
						return {
							corrected,
							...line,
						};
					}),
				);
			}),
		);

		// Format as review comments
		const commentsToSubmit = results
			.flat()
			.filter((file) => file.corrected !== file.line)
			.map((fileResults) => ({
				path: fileResults.filename,
				line: fileResults.linenumber,
				body: `\`\`\`suggestion
${fileResults.corrected}
\`\`\``,
			}));

		console.log(`Found ${commentsToSubmit.length} corrections to submit`);
		console.log(JSON.stringify(commentsToSubmit, null, 2));
		break;
	}
	case "submit-reviews": {
		if (!values.reviews) {
			throw new Error("Please provide a reviews file with --reviews");
		}
		const reviewsContent = await Bun.file(values.reviews).json();
		const { owner, repo, prNumber, commitSha, comments } = reviewsContent;

		const github_token = getEnvOrError("GITHUB_TOKEN");
		const octokit = createGitHubClient(github_token);

		await createReview(
			octokit,
			{ owner, repo, prNumber },
			commitSha,
			comments,
		);

		console.log("Review submitted successfully");
		break;
	}
	case "proofread": {
		const github_token = getEnvOrError("GITHUB_TOKEN");
		const owner = getEnvOrError("GITHUB_REPOSITORY_OWNER");
		const repository = getEnvOrError("GITHUB_REPOSITORY").slice(owner.length + 1);
		const base_ref = getEnvOrError("GITHUB_BASE_REF");
		const head_ref = getEnvOrError("GITHUB_HEAD_REF");
		const results = await proofreadPullRequest(
			{
				owner,
				repository,
				baseRef: base_ref,
				headRef: head_ref,
			},
			github_token,
		);

		for (const fileResults of results) {
			console.log(fileResults);
		}
		console.log("Done");
		break;
	}
	default: {
		throw new Error(`Unknown subcommand: ${subcommand}. Available subcommands: proofread, generate-blocks, review-from-file, submit-reviews`);
	}
}

process.exit(0);
