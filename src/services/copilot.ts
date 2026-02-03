import { CopilotClient } from "@github/copilot-sdk";

const SYSTEM_MESSAGE = `あなたは日本語の技術文書の校正専門家です。
入力される文章はTypstによって書かれた文章の一部です。
文章から以下のような誤りを見つけ、修正理由とともにJSON形式で返してください。

チェック項目:
1. 誤字脱字(タイポ)
2. 表記揺れ(例:「サーバー」vs「サーバ」)
3. 文法的な誤り
4. 技術用語の誤用

出力形式: {"corrected": "修正後の文章", "reason": "修正理由"}
誤りがない場合: {"corrected": "元の文章", "reason": ""}
修正内容が自明な場合: {"corrected": "修正後の文章", "reason": ""}

例:
入力文章: 「このサーバーは高い可用性を持っています。」
出力: {"corrected": "このサーバは高い可用性を持っています。", "reason": "表記揺れの修正(「サーバー」→「サーバ」)"}

入力文章: 「Typstは新しいドキュメント作成ツールです。」
出力: {"corrected": "Typstは新しいドキュメント作成ツールです。", "reason": ""}

入力文章: 「このアプリケーシヨンは便利です。」
出力: {"corrected": "このアプリケーションは便利です。", "reason": ""}

必ずJSON形式で返してください。修正理由は1〜2文で簡潔に記述してください。
修正内容が自明な場合（単純な誤字など）はreasonを空文字列にしてください。
`;

export const createProofreadingClient = async () => {
	const client = new CopilotClient();
	const session = await client.createSession({
		model: "gpt-4.1",
		systemMessage: {
			mode: "append",
			content: SYSTEM_MESSAGE,
		},
	});

	return { client, session };
};

export const proofreadLine = async (
	session: Awaited<ReturnType<CopilotClient["createSession"]>>,
	line: string,
): Promise<{ corrected: string; reason: string }> => {
	const result = await session.sendAndWait({ prompt: line });
	const content = result?.data.content ?? "";

	try {
		const parsed = JSON.parse(content);
		return {
			corrected: parsed.corrected || line,
			reason: parsed.reason || "",
		};
	} catch {
		return {
			corrected: line,
			reason: "",
		};
	}
};
