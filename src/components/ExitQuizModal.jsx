import { AlertTriangle, ArrowLeft, ShieldAlert, X } from "lucide-react";

function ExitQuizModal({
  isOpen,
  onStay,
  onLeave,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020B18]/80 px-4 py-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-quiz-title"
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#29425F] bg-[#0D1B2E] text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="border-b border-[#243A55] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFD23F]/10 text-[#FFD23F]">
                <ShieldAlert size={20} />
              </div>

              <div>
                <h2
                  id="exit-quiz-title"
                  className="text-base font-black"
                >
                  Leave Test?
                </h2>
                <p className="mt-0.5 text-[10px] font-semibold text-[#A8B4C5]">
                  Your current test session is in progress.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStay}
              aria-label="Stay in test"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#64748B] transition hover:bg-[#12243B] hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-[#FFD23F]/25 bg-[#FFD23F]/10 p-3.5">
            <div className="flex gap-2.5">
              <AlertTriangle
                size={17}
                className="mt-0.5 shrink-0 text-[#FFD23F]"
              />

              <div>
                <p className="text-sm font-black text-[#FFD23F]">
                  Do not leave the test accidentally.
                </p>

                <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#DCCB87]">
                  If you leave this quiz, your current attempt will be
                  ended and you will not be able to resume it from this
                  page.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs font-medium leading-5 text-[#A8B4C5]">
            Choose <span className="font-black text-white">Stay in Test</span>{" "}
            to continue answering your questions, or{" "}
            <span className="font-black text-white">Leave Test</span> if you
            really want to go back.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-[#243A55] bg-[#0A1728] px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-5 text-sm font-black text-red-300 transition hover:border-red-400/40 hover:bg-red-400/15"
          >
            <ArrowLeft size={15} />
            Leave Test
          </button>

          <button
            type="button"
            onClick={onStay}
            autoFocus
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#009FE3] px-5 text-sm font-black text-white shadow-[0_3px_12px_rgba(0,159,227,0.20)] transition hover:bg-[#008BC7] hover:shadow-[0_5px_16px_rgba(0,159,227,0.28)]"
          >
            Stay in Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExitQuizModal;
