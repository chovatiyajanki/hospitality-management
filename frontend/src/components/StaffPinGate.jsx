import { useState } from "react";
import { Lock, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { Button, Card, Input } from "./ui";

const DEFAULT_STAFF_PIN = "1234";

export default function StaffPinGate({
  onSuccess,
  onCancel,
  isModal = false,
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (pin.trim() === DEFAULT_STAFF_PIN) {
      setError("");
      onSuccess?.();
    } else {
      setError("Incorrect PIN. Access restricted to clinic staff.");
    }
  };

  const content = (
    <div className="w-full max-w-md mx-auto p-2">
      <Card className="p-6 sm:p-8 space-y-6 text-center shadow-xl border border-[var(--border)] bg-[var(--surface-1)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4572E]/10 text-[#E4572E]">
          <Lock className="h-7 w-7" strokeWidth={2.2} />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-display font-normal text-[var(--fg)]">
            Doctor & Staff Access
          </h2>
          <p className="text-xs text-[var(--fg-muted)] leading-relaxed max-w-sm mx-auto">
            The Doctor Desk is strictly reserved for authorized clinic medical staff. Patients, please return to the Live Queue Board.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1 text-left">
            <label
              htmlFor="staff-pin-input"
              className="text-xs font-bold text-[var(--fg)] block px-1"
            >
              Enter 4-Digit Staff PIN
            </label>
            <Input
              id="staff-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError("");
              }}
              placeholder="••••"
              icon={KeyRound}
              autoFocus
              className="text-center text-lg tracking-[0.5em] font-mono min-h-[48px]"
            />
            {error ? (
              <p className="text-[11px] text-rose-500 font-semibold px-1 pt-1">
                {error}
              </p>
            ) : (
              <p className="text-[10px] text-[var(--fg-muted)] px-1 pt-0.5">
                Default Clinic PIN: <span className="font-mono font-bold text-[var(--fg)]">1234</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onCancel}
                className="w-full sm:flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Patient Board</span>
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:flex-1"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Unlock Desk</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      {content}
    </div>
  );
}
