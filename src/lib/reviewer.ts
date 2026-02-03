import { createGitHubClient, createReview } from "../services/github.ts";
import type {
	ProofreadResult,
	PullRequestContext,
	ReviewComment,
} from "../types/index.ts";

/**
 * Convert proofread results to review comments
 * Only includes lines that have corrections
 */
export const createReviewComments = (
	results: ProofreadResult[],
): ReviewComment[] => {
	return results
		.filter((result) => result.corrected !== result.line)
		.map((result) => ({
			path: result.filename,
			line: result.linenumber,
			body: `\`\`\`suggestion
${result.corrected}
\`\`\``,
		}));
};

/**
 * Submit review comments to a GitHub pull request
 */
export const submitReviews = async (
	githubToken: string,
	prContext: PullRequestContext,
	commitSha: string,
	reviewResults: ProofreadResult[],
): Promise<void> => {
	const comments = createReviewComments(reviewResults);

	console.error(`Submitting ${comments.length} review comments`);

	if (comments.length === 0) {
		console.error("No corrections found, skipping review submission");
		return;
	}

	const octokit = createGitHubClient(githubToken);

	await createReview(octokit, prContext, commitSha, comments);

	console.error("Review submitted successfully");
};
