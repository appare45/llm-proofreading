import { Octokit } from "octokit";
import { getEnvOrError } from "./env";
import parseGitPatch from "parse-git-patch/dist/src";
import { CopilotClient } from "@github/copilot-sdk";

const github_token = getEnvOrError("GITHUB_TOKEN");
const octokit = new Octokit({ auth: github_token });

const owner = getEnvOrError("GITHUB_REPOSITORY_OWNER");
const repository = getEnvOrError("GITHUB_REPOSITORY").slice(owner.length + 1);
const base_ref = getEnvOrError("GITHUB_BASE_REF");
const head_ref = getEnvOrError("GITHUB_HEAD_REF");

const { data: prs } = await octokit.rest.pulls.list({
	owner: owner,
	repo: repository,
	base: base_ref,
	head: head_ref,
	per_page: 1,
});

if (prs.length < 1) throw new Error("PR not found");

const pr = prs[0];
if (!pr?.number) throw new Error("PR number is not found");

const { data: raw_diff } = await octokit.rest.pulls.get({
	owner,
	repo: repository,
	pull_number: pr.number,
	mediaType: {
		format: "diff",
	},
});

const patch = parseGitPatch(raw_diff.toString());
if (!patch) throw new Error("Failed to parse patch file");
const added_lines = patch.files
	.filter((file) => !file.deleted)
	.map((file) =>
		file.modifiedLines
			.filter((line) => line.added && line.line)
			.map((line) => ({
				filename: file.afterName,
				line: line.line,
				linumber: line.lineNumber,
			})),
	);
console.log(added_lines);

const client = new CopilotClient();

await Promise.all(
	added_lines.map(async (fileLines) => {
		let p = await Promise.all(
			fileLines.map(async (line) => {
				const session = await client.createSession({
					model: "gpt-4.1",
					systemMessage: {
						mode: "append",
						content: `あなたは日本語の技術文書の校正専門家です。
入力される文章はTypstによって書かれた文章の一部です。
文章から以下のような誤りを見つけ、正しい文章だけを返してください。
誤りが見つからなかった場合はもとの文章をそのまま返してください。

1. 誤字脱字（タイポ）
2. 表記揺れ（例：「サーバー」vs「サーバ」）
3. 文法的な誤り
4. 技術用語の誤用

例：
入力文章: 「このサーバーは高い可用性を持っています。」
修正後文章: 「このサーバは高い可用性を持っています。」

入力文章: 「Typstは新しいドキュメント作成ツールです。」
修正後文章: 「Typstは新しいドキュメント作成ツールです。」
`,
					},
				});
				return {
					corrected:
						(await session.sendAndWait({ prompt: line.line }))?.data.content ??
						line.line,
					...line,
				};
			})
		);
		console.log(p);
	}),
);

console.log("Done");
process.exit(0);
