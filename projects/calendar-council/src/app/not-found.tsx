import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <Logo className="mx-auto" />
        <p className="record-label mt-10">Error 404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">This page has no record on file.</h1>
        <p className="mt-3 text-muted-foreground">
          The Council found no record of that decision. It may have been spontaneous.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <Link href="/"><Button variant="outline">Return home</Button></Link>
          <Link href="/app"><Button variant="gold">Go to dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
