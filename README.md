# LLM Proofreading

GitHub Copilot を使用してプルリクエストの変更内容を自動校正する GitHub Action です。

## 機能

- プルリクエストで追加された行を自動的に抽出
- GitHub Copilot API を使用して文章を校正
- 修正提案を GitHub のレビューコメントとして自動投稿

## 使い方

### GitHub Actions として使用

`.github/workflows/proofreading.yml` を作成:

```yaml
name: Proofreading

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  proofread:
    runs-on: ubuntu-latest
    steps:
      - uses: appare45/llm-proofreading@main
```
