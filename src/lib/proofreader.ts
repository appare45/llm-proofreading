import {
	createProofreadingClient,
	proofreadLine,
} from "../services/copilot.ts";
import {
	createGitHubClient,
	getPullRequest,
	getPullRequestDiff,
} from "../services/github.ts";
import { extractAddedLines } from "../services/patch.ts";
import type { GitHubConfig, ProofreadResult } from "../types/index.ts";

export const proofreadPullRequest = async (
	config: GitHubConfig,
	githubToken: string,
): Promise<ProofreadResult[][]> => {
	const octokit = createGitHubClient(githubToken);

	const pr = await getPullRequest(octokit, config);

	const diffContent = await getPullRequestDiff(
		octokit,
		config.owner,
		config.repository,
		pr.number,
	);

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

	return results;
};
