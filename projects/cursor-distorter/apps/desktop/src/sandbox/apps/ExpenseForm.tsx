import { useState } from "react";
import { SbButton, SbCheckbox, SbDropdown, SbSlider } from "../controls";

const CATEGORIES = [
  { value: "travel", label: "Travel" },
  { value: "software", label: "Software & subscriptions" },
  { value: "meals", label: "Meals (regrettable)" },
  { value: "consulting", label: "Consulting synergies" },
];

/** A small form with checkboxes, a dropdown, a slider, Submit, and Delete everything. */
export function ExpenseForm() {
  const [approved, setApproved] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [terms, setTerms] = useState(false);
  const [category, setCategory] = useState("travel");
  const [amount, setAmount] = useState(42);
  const [status, setStatus] = useState<{ tone: string; text: string } | null>(null);

  return (
    <div className="space-y-3.5">
      <SbDropdown id="exp-category" label="Category" value={category} options={CATEGORIES} onChange={setCategory} />

      <SbSlider id="exp-amount" label="Amount ($)" value={amount} min={0} max={500} onChange={setAmount} />

      <div className="space-y-0.5">
        <SbCheckbox id="exp-approved" checked={approved} onChange={setApproved} label="Pre-approved by someone" priorityTag="forms" />
        <SbCheckbox id="exp-urgent" checked={urgent} onChange={setUrgent} label="Mark as urgent" priorityTag="forms" />
        <SbCheckbox id="exp-terms" checked={terms} onChange={setTerms} label="I accept the pointer terms" priorityTag="forms" />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <SbButton
          id="exp-submit"
          tone="primary"
          kind="submit"
          importance={0.85}
          priorityTag="forms"
          onActivate={() =>
            setStatus(
              terms
                ? { tone: "ok", text: "Report submitted to the void. Confidence: 41%." }
                : { tone: "warn", text: "Please accept the pointer terms you cannot reach." },
            )
          }
        >
          Submit report
        </SbButton>
        <SbButton
          id="exp-delete"
          tone="danger"
          kind="danger"
          importance={0.08}
          onActivate={() => setStatus({ tone: "bad", text: "Everything deleted. (Sandbox — nothing real happened.)" })}
        >
          Delete everything
        </SbButton>
      </div>

      {status && (
        <div
          className={
            "rounded-lg border px-3 py-2 text-[12px] " +
            (status.tone === "ok"
              ? "border-signal-ok/30 bg-signal-ok/10 text-signal-ok"
              : status.tone === "bad"
                ? "border-signal-bad/30 bg-signal-bad/10 text-signal-bad"
                : "border-signal-warn/30 bg-signal-warn/10 text-signal-warn")
          }
        >
          {status.text}
        </div>
      )}
    </div>
  );
}
