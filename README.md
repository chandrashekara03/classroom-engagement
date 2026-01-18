This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Release Process

### Cutting a Release

1. Ensure all changes are committed and pushed to main branch.
2. Use conventional commit messages (e.g., `feat: add new feature`, `fix: resolve bug`).
3. Run the appropriate version script:
   - `npm run version:patch` for bug fixes
   - `npm run version:minor` for new features
   - `npm run version:major` for breaking changes
4. This will:
   - Update package.json version
   - Generate CHANGELOG.md
   - Create git commit and tag
5. Push tags: `npm run release`

### Publishing Release Tags

- Tags are automatically created by standard-version
- Push to GitHub triggers CI workflow
- CI publishes changelog and triggers Vercel deployment

### Version Propagation to Vercel

- NEXT_PUBLIC_APP_VERSION is set from package.json version
- Main branch deploys to production
- Staging branch deploys to preview
- Feature branches create ephemeral previews
- Version visible in /about route
