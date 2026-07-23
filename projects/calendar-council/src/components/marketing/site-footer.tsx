import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FOOTER_LINKS, SUBTAGLINE } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{SUBTAGLINE}</p>
            <p className="mt-4 text-xs text-muted-foreground/70">
              A parody product. No real calendars were governed in the making of this website.
            </p>
          </div>
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <p className="record-label mb-3">{group.heading}</p>
              <ul className="space-y-2.5">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {2026} Calendar Council, Inc. All autonomy reserved.</p>
          <p className="font-mono uppercase tracking-[0.15em]">Personal Time Governance™</p>
        </div>
      </div>
    </footer>
  );
}
