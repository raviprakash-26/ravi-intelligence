// Stand-in for the `server-only` package under Vitest.
//
// The real package throws on import unless resolved under React's `react-server`
// condition, which only the Next.js build applies. Tests import server modules
// directly, so this empty module takes its place there. The guard is unaffected
// in the application build.
export {};
