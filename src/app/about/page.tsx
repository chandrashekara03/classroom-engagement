export default function AboutPage() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
  const commitHash = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
  const buildTime = new Date().toISOString();
  const environment = process.env.VERCEL_ENV || 'development';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">About Classroom Engagement</h1>
      <div className="space-y-2">
        <p><strong>Version:</strong> {version}</p>
        <p><strong>Commit:</strong> {commitHash}</p>
        <p><strong>Build Time:</strong> {buildTime}</p>
        <p><strong>Environment:</strong> {environment}</p>
      </div>
    </div>
  );
}