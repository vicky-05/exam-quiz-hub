import {
  ArrowRight,
  BookOpen,
  BookOpenText,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Quote,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import ExamCard from "../components/ExamCard";
import { exams } from "../data/exams";
import logo from "../assets/exam-quiz-hub-logo.png";
import darkLogo from "../assets/exam-quiz-hub-logo-dark.png";
import achievers from "../assets/achievers.png";
import { supabase } from "../services/supabase";
import motivationImage from "../assets/motivation-image.png";

function HomePage() {
  const [stats, setStats] = useState({
    questions: 0,
    testSeries: 0,
    exams: 0,
  });

  const [dailyMotivation, setDailyMotivation] = useState(null);
  const [motivationLoading, setMotivationLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDailyMotivation() {
      try {
        const dayNumber = getMotivationDayNumber(new Date());

        const { data, error } = await supabase
          .from("daily_motivation")
          .select("id, day_number, person_name, person_title, quote")
          .eq("day_number", dayNumber)
          .eq("active", true)
          .maybeSingle();

        if (cancelled) return;

        if (error) throw error;
        setDailyMotivation(data ?? null);
      } catch (error) {
        console.error("Unable to load daily motivation:", error);
        if (!cancelled) setDailyMotivation(null);
      } finally {
        if (!cancelled) setMotivationLoading(false);
      }
    }

    loadDailyMotivation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeStats() {
      try {
        const [testsResult, examsResult] = await Promise.all([
          supabase
            .from("tests")
            .select("total_questions", { count: "exact" })
            .eq("active", true),
          supabase
            .from("exams")
            .select("id", { count: "exact", head: true })
            .eq("active", true),
        ]);

        if (cancelled) return;

        if (testsResult.error) throw testsResult.error;
        if (examsResult.error) throw examsResult.error;

        const questionTotal = (testsResult.data ?? []).reduce(
          (sum, test) => sum + Number(test.total_questions || 0),
          0
        );

        setStats({
          questions: questionTotal,
          testSeries: testsResult.count ?? (testsResult.data ?? []).length,
          exams: examsResult.count ?? 0,
        });
      } catch (error) {
        console.error("Unable to load homepage statistics:", error);
      }
    }

    loadHomeStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatCount = (value, suffix = "+") => {
    if (!value) return "—";

    if (value >= 1000) {
      const rounded = Math.floor(value / 1000);
      return `${rounded}K${suffix}`;
    }

    return `${value}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#07111F] dark:text-[#F8FAFC]">
      <Header />

      <main>
        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-[#F7FBFF] to-[#EAF6FF] dark:from-[#07111F] dark:via-[#0A1B30] dark:to-[#0D2B4A]">
          {/* Soft atmosphere behind the artwork */}
          <div className="pointer-events-none absolute -left-32 top-8 h-80 w-80 rounded-full bg-[#F6C400]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-[8%] top-0 h-[520px] w-[520px] rounded-full bg-[#19B8F2]/12 blur-3xl dark:bg-[#19B8F2]/10" />
          <div className="pointer-events-none absolute bottom-0 right-[30%] h-64 w-64 rounded-full bg-[#003B82]/8 blur-3xl dark:bg-[#145AA8]/20" />

          <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">
            <div className="relative min-h-[570px] lg:min-h-[600px]">
              {/* CONTENT */}
              <div className="relative z-30 w-full max-w-[690px] pt-8 pb-8 sm:pt-10 lg:w-[55%] lg:pt-9 lg:pb-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#F0A000]/30 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.09em] text-[#9A5B00] shadow-sm backdrop-blur dark:border-[#FFD23F]/35 dark:bg-[#0D1B2E]/85 dark:text-[#FFD23F] sm:text-[11px]">
                  <Trophy size={15} />
                  India&apos;s Competitive Exam Platform
                </div>

                <h1 className="mt-5 max-w-[650px] text-[42px] font-black leading-[0.98] tracking-[-0.045em] text-[#071A3A] sm:text-[53px] lg:text-[60px] xl:text-[66px] dark:text-white">
                  Your <span className="text-[#145AA8] dark:text-[#19B8F2]">Journey to</span>
                  <br />
                  a <span className="text-[#145AA8] dark:text-[#19B8F2]">Brighter Future</span>
                  <br />
                  Starts Here
                </h1>

                <p className="mt-5 max-w-[570px] text-[15px] leading-6 text-[#294A78] sm:text-base dark:text-[#C4D2E3]">
                  Practice smarter. Learn deeper. Achieve bigger.
                  <br className="hidden sm:block" />
                  The complete quiz platform for competitive exam aspirants.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => document.getElementById("exams")?.scrollIntoView({ behavior: "smooth" })}
                    className="group inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#F6C400] to-[#FFAA1F] px-7 py-3.5 text-sm font-black text-[#071A3A] shadow-[0_10px_28px_rgba(240,160,0,0.25)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(240,160,0,0.34)]"
                  >
                    Start Practicing
                    <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => document.getElementById("exams")?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#7FB9F2] bg-white/85 px-7 py-3.5 text-sm font-black text-[#082B67] shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#009FE3] hover:bg-white hover:shadow-md dark:border-[#2D6AA5] dark:bg-[#0D1B2E]/80 dark:text-white dark:hover:border-[#19B8F2] dark:hover:bg-[#12243B]"
                  >
                    <BookOpen size={19} />
                    Explore Exams
                  </button>
                </div>

                {/* Hero stats remain part of the same visual block */}
                <div className="mt-7 grid max-w-[660px] grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4 sm:gap-x-3">
                  <HeroStat icon={<FileText size={28} />} value={formatCount(stats.questions)} label="Questions" />
                  <HeroStat icon={<TrendingUp size={28} />} value={formatCount(stats.testSeries)} label="Test Series" />
                  <HeroStat icon={<BookOpen size={28} />} value={stats.exams ? "Multiple" : "—"} label="Exams" />
                  <HeroStat icon={<Trophy size={28} />} value="Your" label="Success" gold />
                </div>
              </div>

              {/* ACHIEVER ARTWORK — intentionally overlaps the content */}
              <div className="pointer-events-none absolute bottom-0 right-[-8%] z-20 hidden h-[610px] w-[67%] lg:block xl:right-[-5%] xl:w-[64%]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(25,184,242,0.16),transparent_58%)] blur-2xl dark:bg-[radial-gradient(circle_at_55%_45%,rgba(25,184,242,0.20),transparent_58%)]" />
                <img
                  src={achievers}
                  alt="Competitive exam achievers"
                  className="relative z-10 h-full w-full object-contain object-right-bottom drop-shadow-[0_18px_30px_rgba(0,59,130,0.10)] dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.28)]"
                />
              </div>

              {/* Mobile artwork */}
              <div className="relative z-10 -mx-5 mt-1 flex h-[350px] items-end justify-center sm:h-[430px] lg:hidden">
                <img
                  src={achievers}
                  alt="Competitive exam achievers"
                  className="h-full w-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,59,130,0.12)] dark:drop-shadow-[0_18px_30px_rgba(0,0,0,0.30)]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            POPULAR EXAMS
        ========================================================== */}
        <section
          id="exams"
          className="bg-[#F7F9FC] px-5 py-16 sm:px-8 lg:px-12 dark:bg-[#07111F]"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 border-b border-[#10233F]/10 pb-7 dark:border-white/10 lg:flex-row lg:items-end">
              <div>
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.28em] text-[#145AA8] dark:text-[#19B8F2]">
                  <span className="h-px w-8 bg-[#F6C400]" />
                  Popular Exams
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#071A3A] sm:text-4xl lg:text-[44px] dark:text-white">
                  Choose your{" "}
                  <span className="text-[#145AA8] dark:text-[#19B8F2]">
                    examination
                  </span>
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-[#A8B4C5]">
                  Select your target examination and start focused preparation
                  with structured practice.
                </p>
              </div>

              <div className="hidden text-right lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-[#71839A]">
                  Exam Quiz Hub
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#10233F] dark:text-white">
                  Prepare · Practice · Succeed
                </p>
              </div>
            </div>

            {/* Four equal vertical examination cards */}
            <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {exams.map((exam) => (
                <div key={exam.id} className="min-w-0">
                  <ExamCard exam={exam} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            DAILY MOTIVATION
        ========================================================== */}
        <DailyMotivationBanner
          motivation={dailyMotivation}
          loading={motivationLoading}
        />

        {/* =========================================================
            PLATFORM HIGHLIGHTS
        ========================================================== */}
        <section className="bg-white px-5 py-8 sm:px-8 lg:px-12 dark:bg-[#0D1B2E]">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-[20px] border border-[#009FE3]/15 bg-gradient-to-r from-[#F4F9FF] via-white to-[#FFF9E7] shadow-[0_8px_28px_rgba(16,35,63,0.05)] dark:border-[#19B8F2]/15 dark:from-[#102B49] dark:via-[#0D1B2E] dark:to-[#2A2416]">
              <div className="grid grid-cols-2 md:grid-cols-4">
                <Stat
                  icon={<FileText size={20} />}
                  value={formatCount(stats.questions)}
                  label="Practice Questions"
                />
                <Stat
                  icon={<Users size={20} />}
                  value={formatCount(stats.exams)}
                  label="Competitive Exams"
                />
                <Stat
                  icon={<Trophy size={20} />}
                  value={formatCount(stats.testSeries)}
                  label="Test Series"
                />
                <Stat
                  icon={<TrendingUp size={20} />}
                  value="Focused"
                  label="Exam Preparation"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            WHAT WE INCLUDE
        ========================================================== */}
        <section
          id="practice"
          className="bg-[#F7F9FC] px-5 py-14 sm:px-8 lg:px-12 dark:bg-[#07111F]"
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#145AA8] dark:text-[#19B8F2]">
                What We Include
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#10233F] sm:text-[30px] dark:text-white">
                Everything You Need for{" "}
                <span className="text-[#145AA8] dark:text-[#19B8F2]">
                  Exam Preparation
                </span>
              </h2>

              <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-600 sm:text-[13px] dark:text-[#A8B4C5]">
                Practice with focused content, smart tests, regular updates and
                tools designed to help you improve every day.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Target />}
                title="Exam-Focused Content"
                text="Curated questions organized according to competitive exam patterns."
                className="bg-white dark:bg-[#0D1B2E]"
              />

              <FeatureCard
                icon={<Brain />}
                title="Smart Practice"
                text="Topic-wise tests with instant results and detailed explanations."
                className="bg-white dark:bg-[#0D1B2E]"
              />

              <FeatureCard
                icon={<Clock3 />}
                title="Daily Practice"
                text="Regular current affairs, revision and practice to keep you prepared."
                className="bg-white dark:bg-[#0D1B2E]"
              />

              <FeatureCard
                icon={<TrendingUp />}
                title="Track Progress"
                text="Analyze your performance and identify areas for improvement."
                className="bg-white dark:bg-[#0D1B2E]"
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
        ========================================================== */}
        <section className="bg-[#F7F9FC] px-5 pb-14 sm:px-8 lg:px-12 dark:bg-[#07111F]">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-[#009FE3]/20 bg-gradient-to-br from-[#EAF6FF] via-white to-[#FFF7DD] px-6 py-8 shadow-[0_12px_35px_rgba(0,59,130,0.07)] sm:px-10 sm:py-9 lg:px-12 dark:border-[#19B8F2]/20 dark:from-[#102B49] dark:via-[#0D1B2E] dark:to-[#2A2416]">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#19B8F2]/10 blur-3xl dark:bg-[#19B8F2]/10" />
            <div className="pointer-events-none absolute -bottom-20 left-[38%] h-48 w-48 rounded-full bg-[#F6C400]/10 blur-3xl dark:bg-[#FFD23F]/8" />

            <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#145AA8] dark:text-[#19B8F2]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F6C400]" />
                  Your journey starts here
                </div>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#10233F] sm:text-[30px] dark:text-white">
                  Learn. Practice.{" "}
                  <span className="text-[#145AA8] dark:text-[#19B8F2]">
                    Achieve.
                  </span>
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600 sm:text-[13px] dark:text-[#A8B4C5]">
                  Practice consistently, improve every day and move closer to
                  your competitive exam goal.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("exams")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="group flex shrink-0 items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-6 py-3.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(0,96,180,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,96,180,0.30)]"
              >
                Start Preparing
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="bg-[#001F4F] text-white dark:bg-[#06101D]">
        <div className="mx-auto max-w-7xl px-5 py-11 sm:px-8 lg:px-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr]">
            <div>
              <div className="relative h-14 w-[210px]">
                <img
                  src={logo}
                  alt="Exam Quiz Hub"
                  className="h-14 w-auto object-contain dark:hidden"
                />
                <img
                  src={darkLogo}
                  alt="Exam Quiz Hub"
                  className="hidden h-14 w-auto object-contain dark:block"
                />
              </div>

              <p className="mt-4 max-w-sm text-xs leading-5 text-white/60">
                A focused platform for competitive exam preparation, practice
                and continuous improvement.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-white">
                Quick Links
              </h4>
              <div className="mt-4 space-y-2 text-xs text-white/60">
                <p>Home</p>
                <p>Exams</p>
                <p>Practice</p>
                <p>Mock Tests</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-white">
                Support
              </h4>
              <div className="mt-4 space-y-2 text-xs text-white/60">
                <p>About Us</p>
                <p>Contact Us</p>
                <p>Privacy Policy</p>
                <p>Terms & Conditions</p>
                <p>FAQ</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-white">
                Stay Updated
              </h4>
              <p className="mt-4 max-w-xs text-xs leading-5 text-white/60">
                Get useful exam updates, current affairs and study tips.
              </p>

              <div className="mt-4 flex rounded-xl border border-white/10 bg-white/10 p-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="min-w-0 flex-1 bg-transparent px-3 text-xs text-white outline-none placeholder:text-white/40"
                />
                <button
                  type="button"
                  className="rounded-lg bg-[#009FE3] px-3.5 py-2 text-[11px] font-black text-white transition hover:bg-[#19B8F2]"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-2 border-t border-white/10 pt-5 text-center text-[10px] text-white/40 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>© 2026 Exam Quiz Hub. All rights reserved.</p>
            <p>Learn · Practice · Achieve</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getMotivationDayNumber(date = new Date()) {
  // The motivation system intentionally uses a fixed 365-day cycle.
  // On leap years, February 29 does not shift the remaining days.
  const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if (month === 1 && day === 29) return 59;

  return monthStarts[month] + day;
}

function DailyMotivationBanner({ motivation, loading }) {
  const dayNumber = motivation?.day_number ?? getMotivationDayNumber(new Date());

  return (
    <section className="relative overflow-hidden bg-[#F7F9FC] px-5 py-10 sm:px-8 lg:px-12 dark:bg-[#07111F]">
      <div className="mx-auto max-w-7xl">
        <div className="group relative overflow-hidden rounded-[28px] border border-[#D9E7F5] bg-white shadow-[0_18px_55px_rgba(16,35,63,0.10)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          {/* Decorative academic grid */}
          <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,59,130,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,59,130,0.045)_1px,transparent_1px)] bg-[size:34px_34px] dark:bg-[linear-gradient(rgba(25,184,242,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(25,184,242,0.045)_1px,transparent_1px)]" />
          </div>

          {/* Glow accents */}
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#009FE3]/10 blur-3xl dark:bg-[#19B8F2]/10" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#F6C400]/14 blur-3xl dark:bg-[#FFD23F]/10" />

          <div className="relative grid lg:grid-cols-[1.08fr_0.92fr]">
            {/* Left: editorial copy */}
            <div className="relative px-6 py-8 sm:px-9 sm:py-10 lg:px-11 lg:py-11">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#009FE3]/20 bg-[#EAF6FF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#003B82] dark:border-[#19B8F2]/25 dark:bg-[#122C47] dark:text-[#19B8F2]">
                  <Sparkles size={13} />
                  Daily Inspiration
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F0A000]/25 bg-[#FFF8E2] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A5700] dark:border-[#FFD23F]/25 dark:bg-[#302714] dark:text-[#FFD23F]">
                  <CalendarDays size={12} />
                  Day {dayNumber} / 365
                </span>
              </div>

              <div className="mt-7 max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#145AA8] dark:text-[#19B8F2]">
                  365 Days • 365 Stories
                </p>

                <h2 className="mt-2 text-[36px] font-black leading-[0.98] tracking-[-0.045em] text-[#071A3A] sm:text-[46px] lg:text-[52px] dark:text-white">
                  A story worth
                  <br />
                  <span className="text-[#C88A00] dark:text-[#FFD23F]">remembering.</span>
                </h2>

                <div className="mt-5 flex gap-3">
                  <div className="mt-1 h-12 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#F6C400] to-[#009FE3] dark:from-[#FFD23F] dark:to-[#19B8F2]" />
                  <div>
                    <Quote size={22} className="mb-1 text-[#F0A000] dark:text-[#FFD23F]" />
                    {loading ? (
                      <div className="space-y-2.5">
                        <div className="h-3.5 w-full max-w-[480px] animate-pulse rounded bg-slate-200 dark:bg-[#243A55]" />
                        <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-[#243A55]" />
                        <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-[#243A55]" />
                      </div>
                    ) : motivation ? (
                      <>
                        <blockquote className="max-w-[590px] text-[16px] font-semibold leading-7 text-[#294A78] sm:text-[18px] dark:text-[#D7E3F0]">
                          “{motivation.quote}”
                        </blockquote>
                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-black text-[#10233F] dark:text-white">
                            {motivation.person_name}
                          </span>
                          {motivation.person_title && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-[#F0A000]" />
                              <span className="text-xs font-semibold text-slate-500 dark:text-[#A8B4C5]">
                                {motivation.person_title}
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-[#A8B4C5]">
                        Today’s inspiration is getting ready. Please check again shortly.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <MotivationPill icon={<Users size={15} />} text="Real People" />
                <MotivationPill icon={<BookOpenText size={15} />} text="Real Journeys" />
                <MotivationPill icon={<TrendingUp size={15} />} text="Real Lessons" />
              </div>

              <Link
                to="/motivation"
                className="group/button mt-7 inline-flex items-center gap-3 rounded-xl bg-[#003B82] px-5 py-3.5 text-xs font-black text-white shadow-[0_10px_25px_rgba(0,59,130,0.20)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#009FE3] hover:shadow-[0_14px_30px_rgba(0,159,227,0.24)] dark:bg-[#145AA8] dark:hover:bg-[#19B8F2]"
              >
                Read Today’s Story
                <ArrowRight size={17} className="transition-transform group-hover/button:translate-x-1" />
              </Link>
            </div>

            {/* Right: image section with overlay calendar */}
            <div className="relative min-h-[360px] overflow-hidden bg-[#06182B] dark:bg-[#050E19] sm:min-h-[430px]">

              {/* Motivation image */}
              <img
                src={motivationImage}
                alt={motivation?.person_name || "Daily motivation"}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />

              {/* Readability overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#06182B]/75 via-[#06182B]/25 to-[#06182B]/55 dark:from-[#050E19]/80 dark:via-[#050E19]/25 dark:to-[#050E19]/65" />

              {/* Premium blue + gold atmosphere */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(25,184,242,0.20),transparent_32%),radial-gradient(circle_at_82%_76%,rgba(255,210,63,0.16),transparent_30%)]" />

              {/* Decorative frame */}
              <div className="pointer-events-none absolute inset-4 rounded-[22px] border border-white/15 sm:inset-6" />

              {/* =====================================================
                  OVERLAY CALENDAR
              ====================================================== */}
              <div className="absolute right-5 top-5 z-20 w-[150px] overflow-hidden rounded-2xl border border-white/20 bg-[#10243A]/95 shadow-[0_18px_45px_rgba(0,0,0,0.30)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(0,0,0,0.38)] sm:right-8 sm:top-8 sm:w-[178px]">

                {/* Calendar header */}
                <div className="border-b border-white/10 bg-[#16345C]/85 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-[0.22em] text-[#A8B4C5]">
                      Today Is
                    </span>

                    <CalendarDays
                      size={14}
                      className="text-[#FFD23F]"
                    />
                  </div>
                </div>

                {/* Calendar day */}
                <div className="px-4 py-4">
                  <p className="text-[42px] font-black leading-none tracking-[-0.06em] text-white">
                    {dayNumber}
                  </p>

                  <div className="mt-3 h-px bg-white/10" />

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FFD23F]">
                      Day
                    </span>

                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#A8B4C5]">
                      of 365
                    </span>
                  </div>
                </div>

                {/* Gold / blue accent */}
                <div className="h-1 bg-gradient-to-r from-[#F6C400] via-[#FFAA1F] to-[#19B8F2]" />
              </div>

              {/* Image caption */}
              <div className="absolute bottom-6 left-6 z-10 max-w-[300px] sm:bottom-8 sm:left-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FFD23F]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/85">
                    Inspiring Lives
                  </span>
                </div>

                <h3 className="text-2xl font-black leading-tight tracking-[-0.035em] text-white sm:text-3xl">
                  One day.
                  <br />
                  <span className="text-[#FFD23F]">One story.</span>
                </h3>

                <p className="mt-2 text-xs leading-5 text-white/70 sm:text-sm">
                  Discover the journey behind today&apos;s inspiration.
                </p>
              </div>

              {/* Bottom identity strip */}
              <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-4 border-t border-white/10 bg-[#06182B]/70 px-5 py-3 backdrop-blur-md dark:bg-[#050E19]/75 sm:px-7">
                <div className="flex min-w-0 items-center gap-2">
                  <BookOpenText size={14} className="shrink-0 text-[#19B8F2]" />
                  <span className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
                    365 Stories • 365 Journeys
                  </span>
                </div>

                <span className="hidden shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-[#FFD23F] sm:block">
                  Learn • Grow • Achieve
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MotivationPill({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-[#294A78] shadow-sm dark:border-[#243A55] dark:bg-[#12243B] dark:text-[#C4D2E3]">
      <span className="text-[#009FE3] dark:text-[#19B8F2]">{icon}</span>
      {text}
    </span>
  );
}

function HeroStat({ icon, value, label, gold = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          gold
            ? "text-[#F0A000]"
            : "text-[#087BD8] dark:text-[#19B8F2]"
        }
      >
        {icon}
      </span>
      <div>
        <p className="text-xl font-black leading-none text-[#071A3A] sm:text-2xl dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-[#294A78] dark:text-[#A8B4C5]">
          {label}
        </p>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-4 py-4 md:border-r md:border-slate-200/80 md:last:border-r-0 dark:border-[#243A55]">
      <div className="text-[#009FE3] dark:text-[#19B8F2]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black leading-none text-[#10233F] dark:text-white">
          {value}
        </p>
        <p className="mt-1 truncate text-[9px] font-medium text-slate-500 dark:text-[#A8B4C5]">
          {label}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text, className = "" }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[15px] border border-slate-200/80 p-5 shadow-[0_5px_18px_rgba(16,35,63,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDDF5] hover:shadow-[0_12px_28px_rgba(16,35,63,0.10)] dark:border-[#243A55] dark:shadow-[0_8px_24px_rgba(0,0,0,0.16)] dark:hover:border-[#2D6AA5] dark:hover:shadow-[0_14px_32px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#19B8F2]/8 blur-2xl transition duration-300 group-hover:scale-125" />

      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF6FF] text-[#009FE3] shadow-sm transition-transform duration-300 group-hover:scale-105 dark:bg-[#122C47] dark:text-[#19B8F2]">
          {icon}
        </div>

        <h3 className="mt-4 text-[15px] font-black tracking-[-0.015em] text-[#10233F] dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-[11px] leading-[1.55] text-slate-600 dark:text-[#A8B4C5]">
          {text}
        </p>

        <div className="mt-4 h-1 w-8 rounded-full bg-[#F6C400] transition-all duration-300 group-hover:w-14" />
      </div>
    </div>
  );
}

export default HomePage;
