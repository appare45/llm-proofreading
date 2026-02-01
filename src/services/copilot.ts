import { CopilotClient } from "@github/copilot-sdk";

export const createProofreadingClient = (): CopilotClient => {
	return new CopilotClient();
};

export const proofreadLine = async (
	client: CopilotClient,
	line: string,
): Promise<string> => {
	const session = await client.createSession({
		model: "gpt-4.1",
		systemMessage: {
			mode: "append",
			content: `あなたは日本語の技術文書の校正専門家です。
入力される文章はTypstによって書かれた文章の一部です。
文章から以下のような誤りを見つけ、正しい文章だけを返してください。
誤りが見つからなかった場合はもとの文章をそのまま返してください。

1. 誤字脱字(タイポ)
2. 表記揺れ(例:「サーバー」vs「サーバ」)
3. 文法的な誤り
4. 技術用語の誤用

例:
入力文章: 「このサーバーは高い可用性を持っています。」
修正後文章: 「このサーバは高い可用性を持っています。」

入力文章: 「Typstは新しいドキュメント作成ツールです。」
修正後文章: 「Typstは新しいドキュメント作成ツールです。」
`,
		},
	});

	const result = await session.sendAndWait({ prompt: line });
	return result?.data.content ?? line;
};
