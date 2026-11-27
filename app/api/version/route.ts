// Reports the commit this build was made from, so the deploy smoke test can
// verify that the exact tested commit is the one live in production.
// GIT_SHA is set at image build time (Dockerfile build arg, passed by CI).
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ sha: process.env.GIT_SHA ?? 'unknown' })
}
