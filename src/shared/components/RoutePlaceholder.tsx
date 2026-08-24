export function RoutePlaceholder({ label }: { label: string }) {
  return (
    <section
      aria-labelledby="route-placeholder-title"
      className="rounded-lg border border-dashed p-8 text-center"
    >
      <h2 id="route-placeholder-title" className="text-lg font-medium">
        {label}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This screen will be built in proto-lofi — for now it's a placeholder.
      </p>
    </section>
  )
}
