export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold">
              Kaigaar<span className="text-primary">.</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Skilled hands, honest work. Find verified local tradespeople near you.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Made with care · Paper &amp; Ink edition
          </p>
        </div>
      </div>
    </footer>
  );
}
