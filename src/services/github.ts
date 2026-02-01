import { Octokit } from "octokit";
import type { GitHubConfig, PullRequestContext } from "../types/index.ts";

export const createGitHubClient = (token: string): Octokit => {
	return new Octokit({ auth: token });
};

export const getPullRequest = async (
	client: Octokit,
	config: GitHubConfig,
): Promise<{ number: number; headSha: string; }> => {
	const { data: prs } = await client.rest.pulls.list({
		owner: config.owner,
		repo: config.repository,
		base: config.baseRef,
		head: config.headRef,
		per_page: 1,
	});

	if (prs.length < 1) throw new Error("PR not found");

	const pr = prs[0];
	if (!pr?.number) throw new Error("PR number is not found");
	if (!pr?.head?.sha) throw new Error("PR head SHA is not found");

	return { number: pr.number, headSha: pr.head.sha };
};

export const getPullRequestDiff = async (
	client: Octokit,
	context: PullRequestContext,
): Promise<string> => {
	const { data: raw_diff } = await client.rest.pulls.get({
		owner: context.owner,
		repo: context.repo,
		pull_number: context.prNumber,
		mediaType: {
			format: "diff",
		},
	});

	return raw_diff.toString();
};

export const createReview = async (
	client: Octokit,
	context: PullRequestContext,
	commit_id: string,
	comments: Array<{
		path: string;
		line: number;
		body: string;
	}>,
): Promise<void> => {
	await client.rest.pulls.createReview({
		owner: context.owner,
		repo: context.repo,
		pull_number: context.prNumber,
		commit_id,
		event: "COMMENT",
		comments:
			comments.map((comment) => ({ side: "RIGHT", ...comment })),
	});
};
