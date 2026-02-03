import {
	createProofreadingClient,
	proofreadLine,
} from "../services/copilot.ts";
import {
	createGitHubClient,
	createReview,
	getPullRequest,
	getPullRequestDiff,
} from "../services/github.ts";
import { extractAddedLines } from "../services/patch.ts";
import type { GitHubConfig } from "../types/index.ts";

export const proofreadPullRequest = async (
	config: GitHubConfig,
	githubToken: string,
): Promise<undefined[]> => {
	const octokit = createGitHubClient(githubToken);

	const pr = await getPullRequest(octokit, config);

	const prContext = {
		owner: config.owner,
		repo: config.repository,
		prNumber: pr.number,
	};

	const diffContent = await getPullRequestDiff(octokit, prContext);

	const addedLines = extractAddedLines(diffContent);

	const copilotClient = createProofreadingClient();

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

	if (commentsToSubmit.length > 0) {
		await createReview(
			octokit,
			prContext,
			pr.headSha,
			commentsToSubmit,
		);
		console.log("Review submitted successfully");
	}

	return [];
};
