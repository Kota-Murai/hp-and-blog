# Toppomura Portfolio

村井洸太のポートフォリオサイト + ブログ機能

**URL**: https://www.toppomura.jp/

## 技術スタック

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: Supabase Auth (GitHub OAuth)
- **Deploy**: AWS Amplify Console

## 機能

### 公開ページ
- ポートフォリオ（トップページ）
- ブログ記事一覧・詳細
- カテゴリ・タグ別一覧
- お問い合わせフォーム

### 管理画面 (`/admin`)
- ダッシュボード（統計情報）
- ブログ記事管理（作成・編集・削除）
- カテゴリ・タグ管理
- 画像管理

## 開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# Prismaクライアント生成
npx prisma generate

# DBスキーマ反映
npx prisma db push
```

## ディレクトリ構成

```
src/
├── app/
│   ├── (public)/         # 公開ページ（Header/Footer付き）
│   ├── admin/            # 管理画面（認証必須）
│   └── api/              # API Routes
├── components/
│   ├── ui/               # shadcn/ui
│   ├── admin/            # 管理画面コンポーネント
│   └── blog/             # ブログコンポーネント
└── lib/                  # ユーティリティ
```

詳細は [CLAUDE.md](./CLAUDE.md) を参照。
