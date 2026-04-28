// Global Suspense fallback. Intentionally renders nothing so navigation does not
// flash a placeholder; per-route loading.tsx files own their own skeletons.
export default function RootLoading() {
  return null;
}
