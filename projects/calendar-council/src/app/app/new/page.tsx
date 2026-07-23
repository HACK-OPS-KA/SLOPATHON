import { NewRequestForm } from "@/components/app/new-request-form";

export const metadata = { title: "New Request" };

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">Request Permission</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Submit a request for review
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Tell the Council where you think you want to go. It will decide whether you may.
        </p>
      </div>
      <NewRequestForm />
    </div>
  );
}
