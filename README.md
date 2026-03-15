This is a Next.js app for kindergarten Cantonese practice with AI speech and locally stored flashcard illustrations.

## Card Images

The practice cards look for pre-generated PNG files in `public/generated/card-images/<item-id>.png`.

To generate the full illustration set with the same `DASHSCOPE_API_KEY` already used by the app:

```bash
npm run generate:card-images
```

Useful options:

```bash
# regenerate everything even if files already exist
npm run generate:card-images -- --force

# test a single card first
npm run generate:card-images -- --only 2-7-s1
```

Optional environment variables:

- `DASHSCOPE_BASE_URL` defaults to `https://dashscope-intl.aliyuncs.com/api/v1`
- `DASHSCOPE_IMAGE_MODEL` defaults to `wan2.6-image`
- `DASHSCOPE_IMAGE_SIZE` defaults to `1280*960`
- `DASHSCOPE_IMAGE_POLL_MS` defaults to `10000`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
