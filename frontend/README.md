# StudyPilot frontend

Supabase接続を確認するための最小React UIです。ビルドツールなしで動作します。

## 起動

VS CodeのLive Server、または任意の静的HTTPサーバーで `frontend/index.html` を開いてください。

Pythonがある場合:

```bash
cd frontend
python -m http.server 5173
```

その後、`http://localhost:5173` を開きます。

## 現在できること

- メールアドレスとパスワードによる登録・ログイン
- 科目の追加
- ログイン中ユーザーの科目一覧表示
- ログアウト

SupabaseのPublishable Keyは公開クライアントで使用するためのキーです。Secret Keyや旧service_role keyはフロントエンドに置かないでください。

依存ライブラリは `app.js` のESM URLでバージョン固定しています。
