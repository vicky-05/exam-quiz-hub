import { useEffect, useState } from "react";

import {
  ArrowRight,
  BarChart3,
  Beaker,
  BookOpen,
  Brain,
  Bug,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  Clock3,
  Database,
  FlaskConical,
  Globe2,
  Landmark,
  Leaf,
  ListChecks,
  Map,
  Milk,
  Microscope,
  Newspaper,
  Play,
  Scale,
  ScrollText,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Target,
  Users,
  Wheat,
} from "lucide-react";

import { Link, Navigate, useParams } from "react-router-dom";

import Header from "./Header";

import { getExam, formatSubjects } from "./ExamDashboard";

import {
  getExams,
  getTracks,
  getSubjects as getSupabaseSubjects,
  getTests as getSupabaseTests,
} from "../services/examService";

/* =========================================================
   CONTEXT
   Supabase remains the source of exam, track, subject and
   practice-set data. UI is redesigned only.
========================================================= */

function getContext(examId, trackId, subjectId, supabaseExam, tracks, subjects) {
  const localExam = getExam(examId);

  if (!localExam) {
    return { exam: null, track: null, subject: null };
  }

  const exam = {
    ...localExam,
    ...(supabaseExam || {}),
    tracks,
  };

  const track = tracks.find((item) => item.id === trackId);

  if (!track) {
    return { exam, track: null, subject: null };
  }

  const formattedSubjects = formatSubjects(subjects);

  const subject = formattedSubjects.find((item) => item[0] === subjectId);

  return { exam, track, subject };
}

function FlowCrumbs({ exam, track, subject }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400"
    >
      <Link to="/" className="transition hover:text-[#009FE3]">
        Home
      </Link>
      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
      <Link
        to={`/exam/${exam.id}`}
        className="transition hover:text-[#009FE3]"
      >
        {exam.name}
      </Link>
      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
      <Link
        to={`/exam/${exam.id}/${track.id}`}
        className="transition hover:text-[#009FE3]"
      >
        {track.name}
      </Link>
      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
      <span className="font-black text-[#001F4F] dark:text-white">
        {subject[1]}
      </span>
    </nav>
  );
}

function InfoCard({ icon: Icon, label, value, accent = "blue" }) {
  const styles =
    accent === "gold"
      ? "bg-[#FFF8D9] text-[#806000] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]"
      : "bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#243A55] dark:bg-[#0D1B2E]">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${styles}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-[#001F4F] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function SubjectHero({ exam, track, subjectName, description, Icon, accent }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#001F4F] p-6 shadow-[0_25px_70px_rgba(0,31,79,0.16)] dark:bg-[#0D1B2E] sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#009FE3]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#F6C400]/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl ${accent}`}
            >
              <Icon size={28} strokeWidth={2} />
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFD23F]">
              {track.name} · Subject Practice
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.04em] text-white sm:text-5xl">
            {subjectName}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
            {description || "Build your knowledge with focused practice sets."}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white/80">
              {exam.name}
            </span>
            <span className="rounded-full bg-[#009FE3]/15 px-3.5 py-2 text-xs font-bold text-[#19B8F2]">
              Focused practice
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#19B8F2]">
            Practice flow
          </p>
          <div className="mt-4 space-y-3">
            {["Choose a set", "Set your pace", "Start the quiz"].map(
              (item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-black ${
                      index === 0
                        ? "bg-[#FFD23F] text-[#001F4F]"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-white/80">
                    {item}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomPractice({
  subjectTests,
  customTestId,
  customQuestionCount,
  customInput,
  customError,
  customMaxQuestions,
  safeCustomCount,
  customDurationSeconds,
  handleCustomTestChange,
  syncCustomCount,
  handleQuickCount,
  handleStartCustomQuiz,
  formatCustomDuration,
}) {
  return (
    <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-[#243A55] dark:bg-[#0D1B2E] sm:p-7 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#001F4F] text-[#FFD23F] dark:bg-[#16345C]">
            <SlidersHorizontal size={21} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#009FE3]">
              Custom practice
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#001F4F] dark:text-white sm:text-3xl">
              Build Your Own Quiz
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
              Choose a question bank and create a session that matches your
              available time.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#F6C400]/30 bg-[#FFF8D9] px-4 py-3 dark:bg-[#FFD23F]/10">
          <Database size={17} className="text-[#806000] dark:text-[#FFD23F]" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#806000] dark:text-[#FFD23F]">
              Question bank
            </p>
            <p className="text-lg font-black text-[#001F4F] dark:text-white">
              {customMaxQuestions.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#001F4F] dark:text-white/80">
            Choose question bank
          </label>
          <select
            value={customTestId}
            onChange={handleCustomTestChange}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FC] px-4 py-4 text-sm font-bold text-[#001F4F] outline-none transition focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white"
          >
            {subjectTests.map((item) => (
              <option
                key={item.id}
                value={item.id}
                className="text-[#001F4F]"
              >
                Set {item.setNumber} · {item.title} · {item.totalQuestions}{" "}
                questions
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#001F4F] dark:text-white/80">
            Number of questions
          </label>
          <div className="relative mt-2">
            <input
              type="number"
              min="1"
              max={customMaxQuestions || undefined}
              value={customInput}
              onChange={(event) => syncCustomCount(event.target.value)}
              onBlur={() => syncCustomCount(customInput || "1")}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleStartCustomQuiz();
              }}
              inputMode="numeric"
              className="w-full rounded-2xl border border-[#009FE3]/30 bg-[#F7F9FC] px-4 py-4 pr-24 text-lg font-black text-[#001F4F] outline-none transition focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-[#19B8F2]/25 dark:bg-[#07111F] dark:text-white"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wider text-slate-400">
              of {customMaxQuestions}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
          Quick select
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[25, 50, 100, 150, 200].map((count) =>
            count <= customMaxQuestions ? (
              <button
                key={count}
                type="button"
                onClick={() => handleQuickCount(count)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black transition ${
                  safeCustomCount === count
                    ? "border-[#003B82] bg-[#003B82] text-white dark:border-[#19B8F2] dark:bg-[#145AA8]"
                    : "border-slate-200 bg-[#F7F9FC] text-[#001F4F] hover:border-[#009FE3]/50 dark:border-[#243A55] dark:bg-[#07111F] dark:text-white"
                }`}
              >
                {safeCustomCount === count && <Check size={12} />}
                {count}
              </button>
            ) : null
          )}

          {customMaxQuestions > 200 && (
            <button
              type="button"
              onClick={() => handleQuickCount(customMaxQuestions)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-black transition ${
                safeCustomCount === customMaxQuestions
                  ? "border-[#003B82] bg-[#003B82] text-white"
                  : "border-[#F6C400]/40 bg-[#FFF8D9] text-[#806000] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]"
              }`}
            >
              All {customMaxQuestions}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <InfoCard icon={Check} label="Selected" value={`${safeCustomCount} questions`} />
        <InfoCard
          icon={Database}
          label="Available"
          value={`${customMaxQuestions} questions`}
        />
        <InfoCard
          icon={Clock3}
          label="Estimated time"
          value={formatCustomDuration(customDurationSeconds)}
          accent="gold"
        />
      </div>

      {customError && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-950/20 dark:text-red-300">
          {customError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 dark:border-[#243A55] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-400">
          Questions are randomly selected from the chosen set.
        </p>
        <button
          type="button"
          onClick={handleStartCustomQuiz}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#003B82] px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#002D66] dark:bg-[#145AA8] dark:hover:bg-[#1769C0]"
        >
          <Sparkles size={17} />
          Start Custom Quiz
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

const SUBJECT_VISUALS = {
  // Agriculture
  "animal husbandry and livestock": { icon: Milk, label: "Livestock" },
  "animal husbandry": { icon: Milk, label: "Livestock" },
  livestock: { icon: Milk, label: "Livestock" },
  "soil science": { icon: Sprout, label: "Soil Science" },
  horticulture: { icon: Leaf, label: "Horticulture" },
  agriculture: { icon: Wheat, label: "Agriculture" },
  agronomy: { icon: Wheat, label: "Agronomy" },
  entomology: { icon: Bug, label: "Entomology" },
  "plant pathology": { icon: Microscope, label: "Plant Pathology" },
  "agricultural economics": { icon: BarChart3, label: "Agricultural Economics" },
  "agricultural chemistry": { icon: FlaskConical, label: "Agricultural Chemistry" },

  // General studies
  polity: { icon: Scale, label: "Polity" },
  "indian polity": { icon: Scale, label: "Indian Polity" },
  constitution: { icon: ScrollText, label: "Constitution" },
  governance: { icon: Landmark, label: "Governance" },
  geography: { icon: Globe2, label: "Geography" },
  geo: { icon: Map, label: "Geography" },
  "world geography": { icon: Globe2, label: "World Geography" },
  "indian geography": { icon: Map, label: "Indian Geography" },
  economy: { icon: BarChart3, label: "Economy" },
  economics: { icon: BarChart3, label: "Economics" },
  "indian economy": { icon: BarChart3, label: "Indian Economy" },
  history: { icon: ScrollText, label: "History" },
  "indian history": { icon: ScrollText, label: "Indian History" },
  "modern history": { icon: Landmark, label: "Modern History" },
  "ancient history": { icon: ScrollText, label: "Ancient History" },
  "medieval history": { icon: Landmark, label: "Medieval History" },

  // Science / technology
  science: { icon: Microscope, label: "Science" },
  "general science": { icon: Microscope, label: "General Science" },
  physics: { icon: Beaker, label: "Physics" },
  chemistry: { icon: FlaskConical, label: "Chemistry" },
  biology: { icon: Microscope, label: "Biology" },
  technology: { icon: Beaker, label: "Technology" },
  "computer awareness": { icon: Building2, label: "Computer Awareness" },
  computers: { icon: Building2, label: "Computers" },

  // Banking / finance
  banking: { icon: Landmark, label: "Banking" },
  "banking awareness": { icon: Landmark, label: "Banking Awareness" },
  finance: { icon: BarChart3, label: "Finance" },
  "financial awareness": { icon: BarChart3, label: "Financial Awareness" },
  "financial markets": { icon: BarChart3, label: "Financial Markets" },

  // Aptitude / reasoning / language
  "quantitative aptitude": { icon: Calculator, label: "Quantitative Aptitude" },
  aptitude: { icon: Calculator, label: "Aptitude" },
  mathematics: { icon: Calculator, label: "Mathematics" },
  maths: { icon: Calculator, label: "Mathematics" },
  reasoning: { icon: Brain, label: "Reasoning" },
  "logical reasoning": { icon: Brain, label: "Logical Reasoning" },
  "verbal reasoning": { icon: Brain, label: "Verbal Reasoning" },
  english: { icon: BookOpen, label: "English" },
  "english language": { icon: BookOpen, label: "English Language" },
  tamil: { icon: BookOpen, label: "Tamil" },

  // Current / general awareness
  "general knowledge": { icon: Brain, label: "General Knowledge" },
  "general awareness": { icon: Brain, label: "General Awareness" },
  "current affairs": { icon: Newspaper, label: "Current Affairs" },
  "current affairs and general awareness": {
    icon: Newspaper,
    label: "Current Affairs",
  },

  // Social / administration / security
  "social issues": { icon: Users, label: "Social Issues" },
  "social science": { icon: Users, label: "Social Science" },
  "public administration": { icon: Landmark, label: "Public Administration" },
  "internal security": { icon: Shield, label: "Internal Security" },
};

function normalizeSubjectName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[&/,-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getSubjectVisual(subjectName) {
  const normalized = normalizeSubjectName(subjectName);

  if (SUBJECT_VISUALS[normalized]) {
    return SUBJECT_VISUALS[normalized];
  }

  const matchedKey = Object.keys(SUBJECT_VISUALS).find((key) => {
    const normalizedKey = normalizeSubjectName(key);
    return (
      normalized === normalizedKey ||
      normalized.includes(normalizedKey) ||
      normalizedKey.includes(normalized)
    );
  });

  return SUBJECT_VISUALS[matchedKey] || {
    icon: BookOpen,
    label: subjectName || "Practice",
  };
}

function PracticeSetCard({
  exam,
  track,
  subjectId,
  subjectName,
  test,
}) {
  const { icon: SubjectIcon, label: subjectVisualLabel } =
    getSubjectVisual(subjectName);

  return (
    <Link
      to={`/exam/${exam.id}/${track.id}/quiz/${subjectId}/set-${test.setNumber}`}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#009FE3]/50 hover:shadow-[0_18px_45px_rgba(0,59,130,0.10)] dark:border-[#243A55] dark:bg-[#0D1B2E] dark:hover:border-[#19B8F2]/40 sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#003B82] via-[#009FE3] to-[#F6C400] opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[#EAF6FD] text-[#003B82] transition duration-300 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-[#003B82] group-hover:text-white dark:bg-[#19B8F2]/10 dark:text-[#19B8F2] dark:group-hover:bg-[#145AA8] dark:group-hover:text-white">
          <SubjectIcon
            size={24}
            strokeWidth={2}
            aria-label={subjectVisualLabel}
          />
          <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-md border-2 border-white bg-[#F6C400] px-1 text-[7px] font-black leading-none text-[#001F4F] dark:border-[#0D1B2E] dark:bg-[#FFD23F]">
            {String(test.setNumber).padStart(2, "0")}
          </span>
        </div>

        <span className="rounded-full bg-[#F7F9FC] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:bg-white/5">
          Practice Set
        </span>
      </div>

      <h3 className="mt-6 text-lg font-black leading-6 text-[#001F4F] dark:text-white">
        {test.title}
      </h3>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F6C400]" />
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#64748B] dark:text-[#8FA0B4]">
          {subjectVisualLabel}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F7F9FC] px-3 py-3 dark:bg-[#07111F]">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Questions
          </p>
          <p className="mt-1 font-black text-[#001F4F] dark:text-white">
            {test.totalQuestions}
          </p>
        </div>
        <div className="rounded-xl bg-[#F7F9FC] px-3 py-3 dark:bg-[#07111F]">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Duration
          </p>
          <p className="mt-1 font-black text-[#001F4F] dark:text-white">
            {test.durationMinutes} min
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-500 dark:text-[#A8B4C5]">
          +{test.marksPerQuestion} marks ·{" "}
          {Number(test.negativeMarks) > 0
            ? `-${test.negativeMarks} negative`
            : "No negative marking"}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF6FD] text-[#003B82] transition group-hover:bg-[#009FE3] group-hover:text-white dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   SUBJECT SETS
========================================================= */

function SubjectSets() {
  const { examId, trackId, subjectId } = useParams();

  const [supabaseExam, setSupabaseExam] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectTests, setSubjectTests] = useState([]);

  const [customTestId, setCustomTestId] = useState("");
  const [customQuestionCount, setCustomQuestionCount] = useState(100);
  const [customInput, setCustomInput] = useState("100");
  const [customError, setCustomError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadContext() {
      try {
        setLoading(true);
        setError(null);

        const examData = await getExams();

        const selectedExam = (examData || []).find(
          (item) => item.id === examId
        );

        if (!selectedExam) {
          setSupabaseExam(null);
          setTracks([]);
          setSubjects([]);
          setSubjectTests([]);
          return;
        }

        setSupabaseExam(selectedExam);

        const trackData = await getTracks(examId);
        setTracks(trackData || []);

        const selectedTrack = (trackData || []).find(
          (item) => item.id === trackId
        );

        if (!selectedTrack) {
          setSubjects([]);
          setSubjectTests([]);
          return;
        }

        const subjectData = await getSupabaseSubjects(trackId);
        setSubjects(subjectData || []);

        const selectedSubject = (subjectData || []).find(
          (item) => item.id === subjectId
        );

        if (!selectedSubject) {
          setSubjectTests([]);
          return;
        }

        const testData = await getSupabaseTests(subjectId);

        const formattedTests = (testData || []).map((test) => ({
          id: test.id,
          subjectId: test.subject_id,
          title: test.title,
          setNumber: test.set_number,
          totalQuestions: test.total_questions,
          durationMinutes: test.duration_minutes,
          marksPerQuestion: test.marks_per_question,
          negativeMarks: test.negative_marks,
        }));

        setSubjectTests(formattedTests);

        const firstTest = formattedTests[0];
        const firstMax = Number(firstTest?.totalQuestions || 0);
        const firstDefault = Math.min(100, firstMax || 100);

        setCustomTestId(firstTest?.id || "");
        setCustomQuestionCount(firstDefault);
        setCustomInput(String(firstDefault));
        setCustomError("");
      } catch (err) {
        console.error("Failed to load LearningFlow context:", err);
        setError(err.message || "Unable to load practice data.");
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, [examId, trackId, subjectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F]">
        <Header />
        <main className="grid min-h-[calc(100vh-78px)] place-items-center px-6">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#009FE3]/20 border-t-[#009FE3]" />
            <p className="mt-4 text-sm font-black text-slate-500 dark:text-[#A8B4C5]">
              Loading your subject desk...
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
              Unable to load practice
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
              {error}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#003B82] px-5 py-3 text-sm font-black text-white"
            >
              Back to Home
              <ArrowRight size={16} />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { exam, track, subject } = getContext(
    examId,
    trackId,
    subjectId,
    supabaseExam,
    tracks,
    subjects
  );

  if (!exam || !track || !subject) {
    return <Navigate to="/" replace />;
  }

  const [, subjectName, description, Icon, accent] = subject;

  const selectedCustomTest =
    subjectTests.find((item) => item.id === customTestId) ||
    subjectTests[0] ||
    null;

  const customMaxQuestions = Number(
    selectedCustomTest?.totalQuestions || 0
  );

  const safeCustomCount =
    customMaxQuestions > 0
      ? Math.min(
          Math.max(Number(customQuestionCount) || 1, 1),
          customMaxQuestions
        )
      : 0;

  const customSecondsPerQuestion =
    selectedCustomTest &&
    Number(selectedCustomTest.totalQuestions) > 0
      ? (Number(selectedCustomTest.durationMinutes || 0) * 60) /
        Number(selectedCustomTest.totalQuestions)
      : 60;

  const customDurationSeconds = Math.round(
    safeCustomCount * customSecondsPerQuestion
  );

  function formatCustomDuration(seconds) {
    const totalMinutes = Math.max(
      0,
      Math.ceil(Number(seconds || 0) / 60)
    );

    if (totalMinutes < 60) return `${totalMinutes} min`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }

  function syncCustomCount(value) {
    const digits = String(value ?? "").replace(/\D/g, "");

    if (!digits) {
      setCustomInput("");
      setCustomQuestionCount(0);
      setCustomError(
        `Enter a number between 1 and ${customMaxQuestions}.`
      );
      return;
    }

    const numeric = Number(digits);

    if (customMaxQuestions > 0 && numeric > customMaxQuestions) {
      setCustomInput(String(customMaxQuestions));
      setCustomQuestionCount(customMaxQuestions);
      setCustomError(
        `Maximum available is ${customMaxQuestions} questions.`
      );
      return;
    }

    const safe = Math.max(1, numeric);
    setCustomInput(String(safe));
    setCustomQuestionCount(safe);
    setCustomError("");
  }

  function handleCustomTestChange(event) {
    const nextId = event.target.value;
    const nextTest = subjectTests.find((item) => item.id === nextId);
    const max = Number(nextTest?.totalQuestions || 0);
    const nextDefault = Math.min(100, max || 100);

    setCustomTestId(nextId);
    setCustomQuestionCount(nextDefault);
    setCustomInput(String(nextDefault));
    setCustomError("");
  }

  function handleQuickCount(count) {
    const nextCount = Math.min(Number(count), customMaxQuestions);
    if (!nextCount) return;

    setCustomQuestionCount(nextCount);
    setCustomInput(String(nextCount));
    setCustomError("");
  }

  function handleStartCustomQuiz() {
    if (!selectedCustomTest) {
      setCustomError("Please choose a practice set first.");
      return;
    }

    const max = Number(selectedCustomTest.totalQuestions || 0);
    const count = Number(customInput);

    if (!Number.isInteger(count) || count < 1) {
      setCustomError(`Enter a whole number between 1 and ${max}.`);
      return;
    }

    if (count > max) {
      setCustomError(`Maximum available is ${max} questions.`);
      setCustomInput(String(max));
      setCustomQuestionCount(max);
      return;
    }

    window.location.href = `/exam/${exam.id}/${track.id}/quiz/${subjectId}/set-${selectedCustomTest.setNumber}?custom=1&count=${count}`;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#001F4F] dark:bg-[#07111F] dark:text-white">
      <Header />

      <main className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mx-auto max-w-7xl">
          <FlowCrumbs exam={exam} track={track} subject={subject} />

          <div className="mt-7">
            <SubjectHero
              exam={exam}
              track={track}
              subjectName={subjectName}
              description={description}
              Icon={getSubjectVisual(subjectName).icon}
              accent={accent}
            />
          </div>

          {subjectTests.length > 0 && (
            <CustomPractice
              subjectTests={subjectTests}
              customTestId={customTestId}
              customQuestionCount={customQuestionCount}
              customInput={customInput}
              customError={customError}
              customMaxQuestions={customMaxQuestions}
              safeCustomCount={safeCustomCount}
              customDurationSeconds={customDurationSeconds}
              handleCustomTestChange={handleCustomTestChange}
              syncCustomCount={syncCustomCount}
              handleQuickCount={handleQuickCount}
              handleStartCustomQuiz={handleStartCustomQuiz}
              formatCustomDuration={formatCustomDuration}
            />
          )}

          <section className="mt-10">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 dark:border-[#243A55] sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#009FE3]">
                  Practice library
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-[#001F4F] dark:text-white">
                  Choose a Practice Set
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-[#A8B4C5]">
                  Pick a set and enter the focused quiz environment.
                </p>
              </div>

              {subjectTests.length > 0 && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF6FD] px-3.5 py-2 text-xs font-black text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                  <ListChecks size={14} />
                  {subjectTests.length}{" "}
                  {subjectTests.length === 1 ? "Set" : "Sets"}
                </span>
              )}
            </div>

            {subjectTests.length > 0 ? (
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjectTests.map((test) => (
                  <PracticeSetCard
                    key={test.id}
                    exam={exam}
                    track={track}
                    subjectId={subjectId}
                    subjectName={subjectName}
                    test={test}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-[#243A55] dark:bg-[#0D1B2E] sm:p-14">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#EAF6FD] text-[#003B82] dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                  <BookOpen size={28} />
                </div>

                <h3 className="mt-5 text-xl font-black text-[#001F4F] dark:text-white">
                  No Practice Sets Available
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
                  Practice sets for{" "}
                  <span className="font-bold text-[#001F4F] dark:text-white">
                    {subjectName}
                  </span>{" "}
                  have not been added yet.
                </p>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    to={`/exam/${exam.id}/${track.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-5 py-3 text-sm font-black text-white transition hover:bg-[#002D66]"
                  >
                    Back to {track.name}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#001F4F] transition hover:border-[#009FE3]/40 dark:border-[#243A55] dark:bg-[#0D1B2E] dark:text-white"
                  >
                    Home
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export { SubjectSets };

export default SubjectSets;
