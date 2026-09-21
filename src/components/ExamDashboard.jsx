import { useEffect, useState } from "react";

import {
  getExams,
  getTracks,
  getSubjects as getSupabaseSubjects,
  getMockTests,
} from "../services/examService";

import { exams as localExams } from "../data/exams";

import {
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FlaskConical,
  Globe2,
  Landmark,
  Map,
  Medal,
  Play,
  Scale,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Link, Navigate, useParams } from "react-router-dom";
import Header from "./Header";

/* =========================================================
   SUBJECT UI CONFIGURATION
   Backend/database data remains unchanged.
========================================================= */

const subjectUI = {
  history: {
    Icon: Landmark,
    accent: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  },
  geography: {
    Icon: Map,
    accent: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
  },
  polity: {
    Icon: Scale,
    accent: "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300",
  },
  economy: {
    Icon: Target,
    accent: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300",
  },
  "general-science": {
    Icon: FlaskConical,
    accent: "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300",
  },
  reasoning: {
    Icon: BrainCircuit,
    accent: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
  },
  "general-awareness": {
    Icon: Globe2,
    accent: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
  },
  agriculture: {
    Icon: FlaskConical,
    accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  horticulture: {
    Icon: Target,
    accent: "bg-yellow-50 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300",
  },
  soil: {
    Icon: Map,
    accent: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300",
  },
  pathology: {
    Icon: Landmark,
    accent: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  },
};

function getExam(examId) {
  return localExams.find((exam) => exam.id === examId);
}

function formatSubjects(subjects = []) {
  return subjects.map((subject) => {
    const ui = subjectUI[subject.id] || {
      Icon: BookOpen,
      accent:
        "bg-blue-50 text-[#003B82] dark:bg-blue-400/10 dark:text-[#19B8F2]",
    };

    return [
      subject.id,
      subject.name,
      subject.description || "",
      ui.Icon,
      ui.accent,
      0,
    ];
  });
}

function getSubjects(exam, track) {
  if (!exam || !track) return [];
  return [];
}

/* =========================================================
   SHARED UI
========================================================= */

function Breadcrumb({ exam, track }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400"
    >
      <Link to="/" className="transition hover:text-[#009FE3]">
        Home
      </Link>
      <ChevronRight size={15} />
      {track ? (
        <Link
          to={`/exam/${exam.id}`}
          className="transition hover:text-[#009FE3]"
        >
          {exam.name}
        </Link>
      ) : (
        <span className="text-[#001F4F] dark:text-white">{exam.name}</span>
      )}
      {track && (
        <>
          <ChevronRight size={15} />
          <span className="text-[#001F4F] dark:text-white">{track.name}</span>
        </>
      )}
    </nav>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-black text-[#001F4F] dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function LibraryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-b-0 dark:border-white/5">
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <strong className="text-sm font-black text-[#003B82] dark:text-[#19B8F2]">
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   EXAM SELECTOR
   Completely new layout: editorial hero + numbered pathways.
========================================================= */

function ExamSelector({ exam }) {
  return (
    <main className="min-h-[calc(100vh-78px)] bg-[#F7F9FC] dark:bg-[#07111F]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-[#243A55] dark:bg-[#07111F]">
        <div className="absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#009FE3]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#F6C400]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 lg:px-8 lg:pb-20">
          <Breadcrumb exam={exam} />

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#001F4F] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white dark:bg-[#16345C]">
                <Sparkles size={14} className="text-[#FFD23F]" />
                Exam preparation desk
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#001F4F] dark:text-white sm:text-5xl lg:text-6xl">
                Your preparation starts with the{" "}
                <span className="text-[#009FE3]">{exam.name}</span>.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500 dark:text-[#A8B4C5] sm:text-lg">
                Pick your examination path and move into a focused practice
                environment built for consistent preparation.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-full bg-[#FFF8D9] px-4 py-2 text-xs font-black text-[#805F00] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]">
                  LEARN
                </div>
                <div className="rounded-full bg-[#EAF6FD] px-4 py-2 text-xs font-black text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                  PRACTICE
                </div>
                <div className="rounded-full bg-[#001F4F] px-4 py-2 text-xs font-black text-white dark:bg-[#16345C]">
                  ACHIEVE
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[30px] bg-[#001F4F] p-1 shadow-[0_24px_70px_rgba(0,31,79,0.18)] dark:bg-[#16345C]">
                <div className="rounded-[26px] border border-white/10 bg-[#0D2A52] p-6 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD23F]">
                        Preparation roadmap
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        Choose your path
                      </p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFD23F] text-[#001F4F]">
                      <Medal size={23} />
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    {["Select examination path", "Build subject strength", "Take focused tests"].map(
                      (step, index) => (
                        <div
                          key={step}
                          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5"
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
                              index === 0
                                ? "bg-[#FFD23F] text-[#001F4F]"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-bold text-white/90">
                            {step}
                          </span>
                          {index === 0 && (
                            <CheckCircle2
                              size={17}
                              className="ml-auto text-[#FFD23F]"
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#009FE3]">
                Select a pathway
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#001F4F] dark:text-white">
                {exam.name} opportunities
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-[#A8B4C5] sm:text-right">
              Choose the role or stream that matches your target examination.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {exam.tracks.map((track, index) => (
              <Link
                key={track.id}
                to={`/exam/${exam.id}/${track.id}`}
                className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#009FE3]/50 hover:shadow-[0_20px_50px_rgba(0,59,130,0.10)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:hover:border-[#19B8F2]/40 sm:p-7"
              >
                <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[70px] bg-[#EAF6FD] transition group-hover:bg-[#009FE3]/10 dark:bg-[#19B8F2]/5" />

                <div className="relative flex items-start gap-5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#001F4F] text-sm font-black text-[#FFD23F] dark:bg-[#16345C]">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#009FE3]">
                          Examination path
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[#001F4F] dark:text-white sm:text-2xl">
                          {track.name}
                        </h3>
                      </div>
                      <ArrowRight
                        size={21}
                        className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#009FE3]"
                      />
                    </div>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
                      {track.description}
                    </p>

                    <div className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#003B82] dark:text-[#19B8F2]">
                      Open preparation desk
                      <ChevronRight size={15} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {exam.mockTests?.length > 0 && (
        <section className="border-t border-slate-200 bg-white px-4 py-12 dark:border-[#243A55] dark:bg-[#0D1B2E] sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F0A000]">
                  Full-length practice
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#001F4F] dark:text-white">
                  Mock Tests
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-slate-500 dark:text-[#A8B4C5] sm:text-right">
                Simulate the pressure, pacing, and structure of the real
                examination.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exam.mockTests.map((mock, index) => (
                <Link
                  key={mock.id}
                  to={`/exam/${exam.id}/${mock.track_id}/mock/${mock.id}`}
                  className="group rounded-[24px] border border-slate-200 bg-[#F7F9FC] p-6 transition hover:-translate-y-1 hover:border-[#F6C400]/70 hover:bg-white hover:shadow-xl dark:border-[#243A55] dark:bg-[#07111F] dark:hover:bg-[#12243B]"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF8D9] text-[#8A6500] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]">
                      <Trophy size={21} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Mock {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-black leading-6 text-[#001F4F] dark:text-white">
                    {mock.title}
                  </h3>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <StatPill
                      icon={BookOpen}
                      label="Questions"
                      value={mock.total_questions}
                    />
                    <StatPill
                      icon={Clock3}
                      label="Duration"
                      value={`${mock.duration_minutes} min`}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-black text-[#003B82] dark:border-[#243A55] dark:text-[#19B8F2]">
                    Start test
                    <Play
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

/* =========================================================
   TRACK DASHBOARD
   Completely new layout: command-center style.
========================================================= */

function TrackDashboard({ exam, track }) {
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);

  const isAao = exam.id === "tnpsc" && track.id === "aao";

  useEffect(() => {
    async function loadSubjects() {
      try {
        setSubjectsLoading(true);
        setSubjectsError(null);

        const data = await getSupabaseSubjects(track.id);
        setSubjects(formatSubjects(data || []));
      } catch (err) {
        console.error("Failed to load subjects:", err);
        setSubjectsError(err.message || "Unable to load subjects.");
      } finally {
        setSubjectsLoading(false);
      }
    }

    loadSubjects();
  }, [track.id]);

  return (
    <main className="min-h-[calc(100vh-78px)] bg-[#F7F9FC] dark:bg-[#07111F]">
      <section className="relative overflow-hidden bg-[#001F4F] dark:bg-[#07111F]">
        <div className="absolute right-[-8rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#009FE3]/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-6rem] h-[25rem] w-[25rem] rounded-full bg-[#F6C400]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 lg:px-8 lg:pb-14">
          <div className="text-white/60 [&_a]:text-white/60 [&_a:hover]:text-[#19B8F2]">
            <Breadcrumb exam={exam} track={track} />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD23F]/30 bg-[#FFD23F]/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFD23F]">
                <Award size={14} />
                {isAao ? "TNPSC · AAO" : exam.categories}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.03] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                {track.name}
                <span className="block text-[#19B8F2]">Preparation Desk</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                {track.description}{" "}
                {isAao
                  ? "Choose your specialized subject and begin your preparation."
                  : "Choose a subject and build your next focused session."}
              </p>

              {subjects.length > 0 && (
                <Link
                  to={`/exam/${exam.id}/${track.id}/subject/${subjects[0][0]}`}
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#FFD23F] px-5 py-3.5 text-sm font-black text-[#001F4F] shadow-[0_10px_30px_rgba(246,196,0,0.18)] transition hover:bg-[#FFE071]"
                >
                  <Sparkles size={17} />
                  Start practising
                  <ArrowRight size={17} />
                </Link>
              )}
            </div>

            <aside className="rounded-[26px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#009FE3] text-white">
                  <Target size={21} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#19B8F2]">
                    Your focus
                  </p>
                  <p className="mt-1 font-black text-white">
                    {isAao ? "Specialized preparation" : "Subject mastery"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-1">
                {isAao ? (
                  <>
                    <LibraryRow
                      label="Subjects"
                      value={subjectsLoading ? "..." : subjects.length}
                    />
                    <LibraryRow label="Test format" value="200 Q" />
                    <LibraryRow label="Duration" value="3 hrs" />
                    <LibraryRow label="Negative marking" value="None" />
                  </>
                ) : (
                  (exam.stats || []).map((stat) => (
                    <LibraryRow
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                    />
                  ))
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-7 dark:border-[#243A55] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#009FE3]">
              {isAao ? "AAO specialization" : "Your study subjects"}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#001F4F] dark:text-white">
              {isAao ? "Choose Your Subject" : "Practice by Subject"}
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-slate-500 dark:text-[#A8B4C5] sm:text-right">
            {isAao
              ? "Choose Agriculture, Horticulture, Soil Science or Plant Pathology to access its practice sets."
              : "Select a subject to view available practice sets."}
          </p>
        </div>

        {subjectsLoading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-[26px] border border-slate-200 bg-white p-6 dark:border-[#243A55] dark:bg-[#0D1B2E]"
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="mt-6 h-5 w-36 rounded bg-slate-200 dark:bg-white/10" />
                <div className="mt-4 h-4 w-full rounded bg-slate-100 dark:bg-white/5" />
                <div className="mt-2 h-4 w-2/3 rounded bg-slate-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {!subjectsLoading && subjectsError && (
          <div className="mt-8 rounded-[24px] border border-red-200 bg-red-50 p-6 dark:border-red-400/20 dark:bg-red-950/20">
            <h3 className="font-black text-red-700 dark:text-red-300">
              Unable to load subjects
            </h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              {subjectsError}
            </p>
          </div>
        )}

        {!subjectsLoading && !subjectsError && subjects.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(([id, name, description, Icon, accent], index) => (
              <Link
                key={id}
                to={`/exam/${exam.id}/${track.id}/subject/${id}`}
                className="group relative flex min-h-56 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#009FE3]/50 hover:shadow-[0_22px_55px_rgba(0,59,130,0.10)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:hover:border-[#19B8F2]/40 dark:hover:bg-[#12243B]"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[60px] bg-slate-50 dark:bg-white/[0.025]" />

                <div className="relative flex items-start justify-between">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${accent}`}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="text-[10px] font-black tracking-wider text-slate-300 dark:text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="relative mt-6 text-xl font-black text-[#001F4F] dark:text-white">
                  {name}
                </h3>

                <p className="relative mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
                  {description}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5 dark:border-white/5">
                  <span className="text-xs font-black uppercase tracking-wider text-[#003B82] dark:text-[#19B8F2]">
                    Practice sets
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF6FD] text-[#003B82] transition group-hover:bg-[#009FE3] group-hover:text-white dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!subjectsLoading && !subjectsError && subjects.length === 0 && (
          <div className="mt-8 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-[#243A55] dark:bg-[#0D1B2E]">
            <BookOpen
              size={30}
              className="mx-auto text-slate-300 dark:text-slate-600"
            />
            <h3 className="mt-4 text-xl font-black text-[#001F4F] dark:text-white">
              No Subjects Available
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-[#A8B4C5]">
              Subjects for this exam track have not been added yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   MAIN DASHBOARD
   Data fetching and routing are unchanged.
========================================================= */

function ExamDashboard() {
  const { examId, trackId } = useParams();

  const [supabaseExams, setSupabaseExams] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadExamData() {
      try {
        setLoading(true);
        setError(null);

        const examData = await getExams();
        setSupabaseExams(examData || []);

        if (examId) {
          const trackData = await getTracks(examId);
          setTracks(trackData || []);

          const mockData = await getMockTests();

          const trackIds = new Set(
            (trackData || []).map((track) => track.id)
          );

          setMockTests(
            (mockData || []).filter((mock) => trackIds.has(mock.track_id))
          );
        } else {
          setTracks([]);
          setMockTests([]);
        }
      } catch (err) {
        console.error("Failed to load exam data:", err);
        setError(err.message || "Unable to load exam data.");
      } finally {
        setLoading(false);
      }
    }

    loadExamData();
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F]">
        <Header />
        <main className="grid min-h-[calc(100vh-78px)] place-items-center px-6">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3]" />
            <p className="mt-4 text-sm font-black text-slate-500 dark:text-[#A8B4C5]">
              Loading your preparation desk...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F]">
        <Header />
        <main className="grid min-h-[calc(100vh-78px)] place-items-center px-6">
          <div className="max-w-md rounded-[26px] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-400/10">
              <Target size={23} />
            </div>
            <h1 className="mt-5 text-xl font-black text-[#001F4F] dark:text-white">
              Unable to load exams
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
              {error}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const supabaseExam = supabaseExams.find((item) => item.id === examId);

  if (!supabaseExam) {
    return <Navigate to="/" replace />;
  }

  const exam = {
    ...supabaseExam,
    tracks,
    mockTests,
  };

  if (!trackId) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-[#001F4F] dark:bg-[#07111F] dark:text-white">
        <Header />
        <ExamSelector exam={exam} />
      </div>
    );
  }

  const track = tracks.find((item) => item.id === trackId);

  if (!track) {
    return <Navigate to={`/exam/${exam.id}`} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#001F4F] dark:bg-[#07111F] dark:text-white">
      <Header />
      <TrackDashboard exam={exam} track={track} />
    </div>
  );
}

export { getExam, getSubjects, formatSubjects, subjectUI };

export default ExamDashboard;
