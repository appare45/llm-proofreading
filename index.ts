import { Octokit } from "octokit";
import { getEnvOrError } from "./env";
import parseGitPatch from "parse-git-patch/dist/src";

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
  per_page: 1
});

if (prs.length < 1) throw new Error("PR not found");

const pr = prs[0];
if (!pr?.number) throw new Error("PR number is not found");

const { data: raw_diff } = await octokit.rest.pulls.get({
  owner,
  repo: repository,
  pull_number: pr.number,
  mediaType: {
    format: "diff"
  }
});

const patch = parseGitPatch(raw_diff.toString());
if (!patch) throw new Error("Failed to parse patch file");
const added_lines = patch.files.filter(file => !file.deleted).map(file =>
  file.modifiedLines.filter(line => line.added).map((line) => ({ filename: file.afterName, line: line.line, linumber: line.lineNumber }))
);
console.log(added_lines);
