# Toppomura Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)

村井洸太のポートフォリオサイト + ブログ機能

**URL**: https://www.toppomura.jp/

## 機能

### 公開ページ
- **ポートフォリオ** - スキル、経歴、プロジェクト紹介
- **ブログ** - 技術記事、日記などの投稿
  - カテゴリ・タグによる分類
  - ページネーション
  - SEO最適化（OGP、構造化データ、サイトマップ）
- **お問い合わせ** - コンタクトフォーム
- **小アプリ** - 便利なツールを随時追加予定

### 管理画面 (`/admin`)
- 記事の作成・編集・削除（Markdownエディタ）
- カテゴリ・タグ管理
- 画像管理（自動最適化・WebP変換）
- アクセス解析（閲覧数統計、人気記事、デバイス別集計）

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| 言語 | [TypeScript](https://www.typescriptlang.org/) |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| データベース | [PostgreSQL](https://www.postgresql.org/) ([Supabase](https://supabase.com/)) |
| ORM | [Prisma](https://www.prisma.io/) |
| 認証 | [Supabase Auth](https://supabase.com/auth) (GitHub OAuth) |
| ストレージ | [Supabase Storage](https://supabase.com/storage) |
| デプロイ | [AWS Amplify](https://aws.amazon.com/amplify/) |

## セットアップ

### 必要環境

- Node.js 20以上
- npm または yarn
- PostgreSQLデータベース（Supabase推奨）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/toppomura-portfolio.git
cd toppomura-portfolio

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して認証情報を設定

# Prismaクライアントを生成
npx prisma generate

# データベーススキーマを反映
npx prisma db push

# 開発サーバーを起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) でサイトを確認できます。

### 環境変数

`.env.local` ファイルを作成し、以下の変数を設定してください：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# データベース
DATABASE_URL=your_database_url

# 認証
ALLOWED_ADMIN_EMAILS=your_email@example.com

# メール（お問い合わせフォーム用）
GMAIL_USER=your_gmail
GMAIL_PASS=your_app_password

# アクセス解析（GitHub Actions用）
ANALYTICS_API_KEY=your_api_key
```

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint実行
```

### Prismaコマンド

```bash
npx prisma generate    # Prismaクライアント生成
npx prisma db push     # スキーマをデータベースに反映
npx prisma studio      # データベースGUIを起動
npx prisma migrate dev # マイグレーション作成
```

## ディレクトリ構成

```
src/
├── app/
│   ├── (public)/         # 公開ページ（Header/Footer付き）
│   │   ├── page.tsx      # トップ / ポートフォリオ
│   │   ├── blog/         # ブログ一覧・詳細ページ
│   │   └── contact/      # お問い合わせフォーム
│   ├── admin/            # 管理画面（認証必須）
│   │   ├── blog/         # ブログ管理
│   │   ├── images/       # 画像管理
│   │   └── login/        # ログインページ
│   └── api/              # APIルート
├── components/
│   ├── ui/               # shadcn/uiコンポーネント
│   ├── admin/            # 管理画面コンポーネント
│   └── blog/             # ブログコンポーネント
├── lib/
│   ├── supabase/         # Supabaseクライアント
│   ├── analytics/        # アクセス解析ユーティリティ
│   ├── prisma.ts         # Prismaクライアント
│   └── auth.ts           # 認証ヘルパー
└── types/                # TypeScript型定義
```

## デプロイ

AWS Amplifyにデプロイしています。`main` ブランチへのプッシュで自動デプロイが実行されます。

### GitHub Actions

アクセス解析データの集計はGitHub Actionsで毎日自動実行されます。詳細は `.github/workflows/analytics-aggregation.yml` を参照してください。

## 作者

**村井洸太** (Kota Murai)

- ウェブサイト: [toppomura.jp](https://www.toppomura.jp/)
- GitHub: [@toppomura](https://github.com/toppomura)

## ライセンス

個人ポートフォリオ用のプロジェクトです。All rights reserved.
