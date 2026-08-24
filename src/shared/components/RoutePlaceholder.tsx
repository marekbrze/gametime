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
        Ekran wypełni proto-lofi — to na razie miejsce w strukturze.
      </p>
    </section>
  )
}
