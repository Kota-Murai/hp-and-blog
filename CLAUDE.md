# Toppomura Portfolio

村井洸太のポートフォリオサイト + ブログ機能。

## 技術スタック

- **Framework**: Next.js 16.0.10 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: Supabase Auth (OAuth)
- **Deploy**: AWS Amplify Console
- **Email**: Nodemailer (Gmail)

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx            # ルートレイアウト（共通設定のみ）
│   ├── (public)/             # 公開ページ用Route Group
│   │   ├── layout.tsx        # Header + Footer を含むレイアウト
│   │   ├── page.tsx          # トップページ
│   │   └── blog/             # 公開ブログページ
│   │       ├── page.tsx      # 記事一覧
│   │       └── [slug]/       # 記事詳細
│   ├── admin/                # 管理画面（認証必須、独自レイアウト）
│   │   ├── layout.tsx        # 管理画面レイアウト（robots: noindex）
│   │   ├── page.tsx          # ダッシュボード
│   │   ├── blog/             # ブログ管理
│   │   ├── images/           # 画像管理
│   │   └── login/            # ログイン
│   ├── api/                  # API Routes
│   │   ├── contact/          # お問い合わせ
│   │   └── admin/            # 管理API
│   └── auth/                 # 認証コールバック
├── components/
│   ├── ui/                   # shadcn/ui コンポーネント
│   ├── admin/                # 管理画面コンポーネント
│   │   ├── AdminHeader.tsx   # 管理画面ヘッダー（パンくず・戻るボタン）
│   │   ├── BlogEditor.tsx    # 記事エディタ
│   │   └── ...
│   ├── blog/                 # ブログ関連コンポーネント
│   └── *.tsx                 # 各セクションコンポーネント
├── lib/
│   ├── supabase/             # Supabase クライアント
│   ├── analytics/            # アクセス解析（集計・デバイス解析）
│   ├── prisma.ts             # Prisma クライアント
│   └── auth.ts               # 認証ヘルパー
└── middleware.ts             # 認証・ルーティングミドルウェア

.github/
└── workflows/
    └── analytics-aggregation.yml  # 日次集計ワークフロー
```

## 主要コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint実行
```

## データベース

- Prisma を使用
- スキーマ: `prisma/schema.prisma`

```bash
npx prisma generate   # クライアント生成
npx prisma db push    # スキーマ反映
npx prisma studio     # GUI管理ツール
```

## 認証・セキュリティ

- 管理画面は `ALLOWED_ADMIN_EMAILS` で許可されたメールのみアクセス可能
- 本番ビルドでは `/admin` と `/api/admin` は middleware で404を返す

## コーディング規約

- コンポーネント: PascalCase
- 関数・変数: camelCase
- ファイル: kebab-case（コンポーネントはPascalCase）
- インデント: 2スペース

## 重要な実装パターン

- Server Components をデフォルトで使用
- Client Components は `"use client"` を明示
- フォームは React Hook Form + Zod でバリデーション
- 画像は next/image を使用
- ブログ記事は Markdown (react-markdown + remark-gfm)

## 環境変数

必要な環境変数は `.env.local` に設定:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ADMIN_EMAILS`
- `GMAIL_USER`, `GMAIL_PASS`
- `DATABASE_URL`
- `ANALYTICS_API_KEY` - GitHub Actionsからの集計API呼び出し用

### AWS Amplify環境変数

Amplifyでは環境変数はビルド時のみ利用可能で、ランタイム（Lambda）には自動的に渡されない。
`amplify.yml`で`.env.production`ファイルを生成することで対応:

```yaml
build:
  commands:
    - echo "DATABASE_URL=$DATABASE_URL" >> .env.production
    - npm run build
```

**注意**: `next.config.js`の`env`設定でDATABASE_URLを公開するとクライアントバンドルに含まれるため、上記の方法を使用すること。

## 関連ドキュメント

- @../仕様書/開発方針/開発方針.md
- @../仕様書/ブログ機能開発/ブログ機能開発仕様.md
- @../仕様書/ブログ機能開発/githubActionsとの連携.md
- @../仕様書/管理画面/管理画面開発仕様.md
