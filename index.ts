import { Octokit } from "octokit";

const github_token = Bun.env?.GITHUB_TOKEN;
if (github_token == undefined) {
  throw new Error("No github token");
}

const octokit = new Octokit({ auth: github_token });

const {
  data: { login },
} = await octokit.rest.users.getAuthenticated();
console.log("Hello, %s", login);
