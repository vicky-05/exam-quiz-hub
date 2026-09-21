import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Lightbulb,
  Quote,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { supabase } from "../services/supabase";

function getMotivationDayNumber(date = new Date()) {
  // Fixed 365-day cycle.
  // February 29 is intentionally ignored.
  const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if (month === 1 && day === 29) return 59;

  return monthStarts[month] + day;
}

function MotivationPage() {
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const dayNumber = useMemo(() => getMotivationDayNumber(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadMotivation() {
      try {
        setLoading(true);
        setErrorMessage("");

        const { data, error } = await supabase
          .from("daily_motivation")
          .select("id, day_number, person_name, person_title, quote, story")
          .eq("day_number", dayNumber)
          .eq("active", true)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;

        if (!data) {
          setMotivation(null);
          setErrorMessage("Today’s story is not available yet.");
          return;
        }

        setMotivation(data);
      } catch (error) {
        console.error("Unable to load daily motivation:", error);

        if (!cancelled) {
          setMotivation(null);
          setErrorMessage(
            "We could not load today’s story. Please try again shortly."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMotivation();

    return () => {
      cancelled = true;
    };
  }, [dayNumber]);

  const paragraphs = useMemo(() => {
    if (!motivation?.story) return [];

    return motivation.story
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [motivation]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-[#F8FAFC]">
      <Header />

      <main>
        {/* =========================================================
            UNIQUE HERO — editorial, not another dashboard/card row
        ========================================================== */}
        <section className="relative overflow-hidden border-b border-[#DCE7F1] bg-white dark:border-[#243A55] dark:bg-[#0D1B2E]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#009FE3]/10 blur-3xl dark:bg-[#19B8F2]/10" />
            <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#F6C400]/10 blur-3xl dark:bg-[#FFD23F]/8" />
            <div className="absolute right-[28%] top-[-120px] h-72 w-72 rounded-full border-[70px] border-[#009FE3]/5 dark:border-[#19B8F2]/5" />
          </div>

          <div className="relative mx-auto max-w-[1450px] px-5 pb-8 pt-5 sm:px-8 lg:px-12 lg:pb-10">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B] transition hover:text-[#009FE3] dark:text-[#8FA0B4] dark:hover:text-[#19B8F2]"
              >
                <ArrowLeft
                  size={14}
                  className="transition-transform group-hover:-translate-x-1"
                />
                Back to Exam Quiz Hub
              </Link>

              <div className="hidden items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#64748B] dark:text-[#8FA0B4] sm:flex">
                <Sparkles size={13} className="text-[#F0A000] dark:text-[#FFD23F]" />
                365 Days • 365 Stories
              </div>
            </div>

            {loading ? (
              <HeroLoading />
            ) : motivation ? (
              <div className="mt-8 grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
                {/* Identity side */}
                <div className="relative pb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003B82] text-white shadow-sm dark:bg-[#145AA8]">
                      <Compass size={19} />
                    </span>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#145AA8] dark:text-[#19B8F2]">
                        Today&apos;s Journey
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-[#64748B] dark:text-[#A8B4C5]">
                        Day {motivation.day_number} / 365
                      </p>
                    </div>
                  </div>

                  <div className="mt-7">
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#F0A000] dark:text-[#FFD23F]">
                      Meet the person
                    </p>

                    <h1 className="mt-2 max-w-xl text-[44px] font-black leading-[0.94] tracking-[-0.055em] text-[#071A3A] sm:text-[58px] lg:text-[64px] dark:text-white">
                      {motivation.person_name}
                    </h1>

                    {motivation.person_title && (
                      <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-[#526B8C] dark:text-[#A8B4C5]">
                        {motivation.person_title}
                      </p>
                    )}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#D9E7F5] bg-[#F8FBFF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#526B8C] dark:border-[#243A55] dark:bg-[#10243B] dark:text-[#B8C5D5]">
                      Real Journey
                    </span>
                    <span className="rounded-full border border-[#F0A000]/25 bg-[#FFF8E2] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#8A5700] dark:border-[#FFD23F]/25 dark:bg-[#302714] dark:text-[#FFD23F]">
                      A lesson for today
                    </span>
                  </div>
                </div>

                {/* Quote stage */}
                <div className="relative min-h-[290px] overflow-hidden rounded-[28px] bg-[#001F4F] px-7 py-8 shadow-[0_20px_55px_rgba(0,31,79,0.18)] sm:px-10 sm:py-10 dark:bg-[#081827] dark:shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
                  <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[55px] border-[#19B8F2]/10" />
                  <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#F6C400]/10 blur-3xl" />

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-5">
                      <Quote size={38} className="text-[#FFD23F]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.24em] text-white/45">
                        Words to carry forward
                      </span>
                    </div>

                    <blockquote className="mt-8 max-w-3xl text-[25px] font-semibold leading-[1.35] tracking-[-0.02em] text-white sm:text-[32px] lg:text-[36px]">
                      “{motivation.quote}”
                    </blockquote>

                    <div className="mt-8 flex items-end justify-between gap-5">
                      <div>
                        <div className="h-1 w-12 rounded-full bg-[#FFD23F]" />
                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                          Today&apos;s thought
                        </p>
                      </div>

                      <div className="hidden text-right sm:block">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#19B8F2]">
                          Day
                        </p>
                        <p className="text-3xl font-black leading-none text-white">
                          {motivation.day_number}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState message={errorMessage} />
            )}
          </div>
        </section>

        {/* =========================================================
            STORY — large reading canvas + meaningful sidebar
        ========================================================== */}
        {motivation && (
          <section className="relative bg-[#F7F9FC] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 dark:bg-[#07111F]">
            <div className="mx-auto max-w-[1250px]">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-start">
                {/* Reading canvas */}
                <article className="relative overflow-hidden rounded-[26px] border border-[#DCE7F1] bg-white shadow-[0_16px_45px_rgba(16,35,63,0.06)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_18px_50px_rgba(0,0,0,0.20)]">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#19B8F2] via-[#F6C400] to-[#003B82] dark:from-[#19B8F2] dark:via-[#FFD23F] dark:to-[#145AA8]" />

                  <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
                    <div className="flex items-center justify-between border-b border-[#E8EEF4] pb-5 dark:border-[#243A55]">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[#009FE3] dark:text-[#19B8F2]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.23em] text-[#526B8C] dark:text-[#A8B4C5]">
                          The Story
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#94A3B8] dark:text-[#71839A]">
                        <Clock3 size={13} />
                        2–3 min read
                      </div>
                    </div>

                    <div className="mt-8 max-w-[780px]">
                      {paragraphs.map((paragraph, index) => (
                        <p
                          key={`${motivation.id}-${index}`}
                          className={
                            index === 0
                              ? "mb-6 text-[18px] leading-[1.9] text-[#294A78] dark:text-[#D7E3F0] first-letter:float-left first-letter:mr-2 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8] first-letter:text-[#145AA8] first-letter:dark:text-[#19B8F2]"
                              : "mb-6 text-[16px] leading-[1.9] text-slate-600 dark:text-[#B8C5D5]"
                          }
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Reflection panel */}
                    <div className="mt-10 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center rounded-2xl border border-[#DCE7F1] bg-[#F7FBFF] p-5 dark:border-[#243A55] dark:bg-[#10243B]">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF4CA] text-[#C88A00] dark:bg-[#302714] dark:text-[#FFD23F]">
                        <Lightbulb size={20} />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9A6500] dark:text-[#FFD23F]">
                          Pause & Reflect
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[#526B8C] dark:text-[#C4D2E3]">
                          What part of this journey can change the way you approach
                          your own next step?
                        </p>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Sidebar — no duplicate day cards */}
                <aside className="space-y-4 lg:sticky lg:top-24">
                  <div className="rounded-[22px] border border-[#DCE7F1] bg-white p-5 shadow-[0_12px_32px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF] text-[#009FE3] dark:bg-[#122C47] dark:text-[#19B8F2]">
                        <UserRound size={18} />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#64748B] dark:text-[#A8B4C5]">
                          Today&apos;s Person
                        </p>
                        <p className="mt-0.5 text-sm font-black text-[#10233F] dark:text-white">
                          {motivation.person_name}
                        </p>
                      </div>
                    </div>

                    {motivation.person_title && (
                      <p className="mt-4 border-t border-[#E8EEF4] pt-4 text-xs leading-5 text-slate-500 dark:border-[#243A55] dark:text-[#A8B4C5]">
                        {motivation.person_title}
                      </p>
                    )}
                  </div>

                  <div className="rounded-[22px] border border-[#DCE7F1] bg-white p-5 shadow-[0_12px_32px_rgba(16,35,63,0.05)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center gap-2 text-[#145AA8] dark:text-[#19B8F2]">
                      <Target size={17} />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                        Takeaway
                      </p>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-[#294A78] dark:text-[#D0DCE9]">
                      A meaningful story can give you a new way to look at your own
                      journey.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-[#F0A000]/20 bg-[#FFF9E8] p-5 dark:border-[#FFD23F]/20 dark:bg-[#2A2416]">
                    <div className="flex items-center gap-2 text-[#B57400] dark:text-[#FFD23F]">
                      <CheckCircle2 size={17} />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                        Remember
                      </p>
                    </div>

                    <p className="mt-3 text-sm font-semibold leading-6 text-[#66511B] dark:text-[#E5D69E]">
                      Progress does not need to be dramatic. It only needs to
                      continue.
                    </p>
                  </div>
                </aside>
              </div>

              {/* Bottom continuation */}
              <div className="mt-8 flex flex-col gap-4 rounded-[22px] border border-[#DCE7F1] bg-white px-5 py-5 shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E] sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#145AA8] dark:text-[#19B8F2]">
                    Tomorrow brings another journey
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#526B8C] dark:text-[#B8C5D5]">
                    Come back for the next story.
                  </p>
                </div>

                <Link
                  to="/"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-5 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#009FE3] dark:bg-[#145AA8] dark:hover:bg-[#19B8F2]"
                >
                  Continue Exploring
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function HeroLoading() {
  return (
    <div className="mt-8 grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="space-y-5 py-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-[#243A55]" />
        <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-[#243A55]" />
        <div className="h-14 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-[#243A55]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-[#243A55]" />
      </div>

      <div className="min-h-[290px] animate-pulse rounded-[28px] bg-[#001F4F] dark:bg-[#081827]" />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#DCE7F1] bg-[#F8FBFF] p-8 text-center dark:border-[#243A55] dark:bg-[#10243B]">
      <BookOpen size={28} className="mx-auto text-[#009FE3] dark:text-[#19B8F2]" />

      <h2 className="mt-4 text-xl font-black text-[#10233F] dark:text-white">
        Today&apos;s story is unavailable
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
        {message}
      </p>

      <Link
        to="/"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#003B82] px-5 py-3 text-xs font-black text-white transition hover:bg-[#009FE3] dark:bg-[#145AA8] dark:hover:bg-[#19B8F2]"
      >
        <ArrowLeft size={15} />
        Back to Home
      </Link>
    </div>
  );
}

export default MotivationPage;
