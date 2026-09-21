import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Leaf,
  Landmark,
  Train,
} from "lucide-react";
import { Link } from "react-router-dom";

function getExamTheme(examId) {
  const id = String(examId || "").toLowerCase();

  if (id === "rrb" || id.includes("railway")) {
    return {
      icon: Train,
      iconBg: "from-[#EF3340] to-[#D91E36]",
      glow: "rgba(239,51,64,0.28)",
      accent: "#EF3340",
      button: "from-[#EF3340] to-[#D91E36]",
      shortName: "RRB",
      label: "Railway Recruitment Board",
    };
  }

  if (id === "tnpsc") {
    return {
      icon: Landmark,
      iconBg: "from-[#F6B51E] to-[#E58A00]",
      glow: "rgba(246,181,30,0.28)",
      accent: "#F6C400",
      button: "from-[#F6C400] to-[#F0A000]",
      shortName: "TNPSC",
      label: "Tamil Nadu Public Service Commission",
    };
  }

  if (
    id.includes("bank") ||
    id === "ibps" ||
    id === "sbi" ||
    id.includes("banking")
  ) {
    return {
      icon: Building2,
      iconBg: "from-[#19A7F2] to-[#1769D2]",
      glow: "rgba(25,167,242,0.28)",
      accent: "#19A7F2",
      button: "from-[#19A7F2] to-[#1769D2]",
      shortName: "BANKING",
      label: "IBPS, SBI, RBI and more",
    };
  }

  if (
    id.includes("agri") ||
    id.includes("afo") ||
    id.includes("agriculture")
  ) {
    return {
      icon: Leaf,
      iconBg: "from-[#20A765] to-[#087A55]",
      glow: "rgba(32,167,101,0.28)",
      accent: "#20A765",
      button: "from-[#20A765] to-[#087A55]",
      shortName: "AGRICULTURE",
      label: "AFO, AAO and more",
    };
  }

  if (id.includes("ssc")) {
    return {
      icon: GraduationCap,
      iconBg: "from-[#7C3AED] to-[#5B21B6]",
      glow: "rgba(124,58,237,0.28)",
      accent: "#8B5CF6",
      button: "from-[#7C3AED] to-[#5B21B6]",
      shortName: "SSC",
      label: "Staff Selection Commission",
    };
  }

  return {
    icon: GraduationCap,
    iconBg: "from-[#145AA8] to-[#009FE3]",
    glow: "rgba(0,159,227,0.28)",
    accent: "#009FE3",
    button: "from-[#145AA8] to-[#009FE3]",
    shortName: examId ? String(examId).toUpperCase() : "EXAM",
    label: "Competitive Examination",
  };
}

function getDescription(exam, theme) {
  if (exam?.description) return exam.description;

  const id = String(exam?.id || "").toLowerCase();

  if (id === "rrb" || id.includes("railway")) {
    return "Prepare for NTPC, Group D, ALP and other RRB exams.";
  }

  if (id === "tnpsc") {
    return "Practice tests, PYQs and mock exams for TNPSC.";
  }

  if (id.includes("bank") || id === "ibps" || id === "sbi") {
    return "Build accuracy and speed for banking examinations.";
  }

  if (id.includes("agri") || id.includes("afo") || id.includes("agriculture")) {
    return "Focused preparation for agriculture competitive exams.";
  }

  if (id.includes("ssc")) {
    return "Practice SSC subjects, PYQs and mock tests.";
  }

  return theme.label;
}

function ExamCard({ exam }) {
  const theme = getExamTheme(exam?.id);
  const Icon = theme.icon;
  const tracks = Array.isArray(exam?.tracks)
    ? exam.tracks.map((track) => track?.name).filter(Boolean).slice(0, 3)
    : [];

  const displayName = exam?.name || theme.shortName || "Exam";
  const description = getDescription(exam, theme);

  return (
    <Link
      to={`/exam/${exam.id}`}
      className="group block h-full min-w-0"
      aria-label={`Explore ${displayName}`}
    >
      <article
        className="relative flex h-[410px] w-full flex-col overflow-hidden rounded-[20px] border border-[#243A55] bg-[#0D1B2E] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_22px_45px_rgba(0,0,0,0.30)]"
        style={{
          "--exam-accent": theme.accent,
          borderColor: undefined,
        }}
      >
        {/* Accent line */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${theme.accent}, #009FE3, #F6C400)`,
          }}
        />

        {/* Hover glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-10 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-25"
          style={{ background: theme.accent }}
        />

        {/* Top labels */}
        <div className="relative flex items-center justify-between">
          <span className="rounded-full border border-[#29425F] bg-[#12243B] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-[#D7E0EA]">
            Examination
          </span>

          <span
            className="rounded-full border px-2 py-1 text-[7px] font-black tracking-[0.08em]"
            style={{
              borderColor: `${theme.accent}66`,
              color: theme.accent,
              background: `${theme.accent}10`,
            }}
          >
            {theme.shortName}
          </span>
        </div>

        {/* Icon + title */}
        <div className="relative flex flex-col items-center text-center">
          <div
            className={`mt-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br ${theme.iconBg} text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-2`}
            style={{ boxShadow: `0 10px 28px ${theme.glow}` }}
          >
            <Icon size={32} strokeWidth={1.9} />
          </div>

          <h3 className="mt-4 truncate max-w-full text-[19px] font-black tracking-[-0.02em] text-white">
            {displayName}
          </h3>

          <p className="mt-1.5 h-[34px] max-w-[225px] overflow-hidden text-[9.5px] font-medium leading-[1.45] text-[#A8B4C5]">
            {description}
          </p>
        </div>

        {/* Divider */}
        <div className="my-4 h-px w-full bg-[#243A55]" />

        {/* Track chips */}
        <div className="flex h-[50px] items-start justify-center gap-1.5 overflow-hidden">
          {(tracks.length > 0 ? tracks : ["PYQs", "Practice", "Mock Tests"]).map(
            (item, index) => (
              <span
                key={`${item}-${index}`}
                className="max-w-[82px] truncate rounded-lg border border-[#29425F] bg-[#12243B] px-2 py-1.5 text-[7.5px] font-bold text-[#D7E0EA]"
                title={item}
              >
                {item}
              </span>
            )
          )}
        </div>

        {/* Features */}
        <div className="mt-1 space-y-2">
          <div className="flex items-center gap-2.5 text-[8.5px] font-semibold text-[#D7E0EA]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#12243B] text-[#19B8F2]">
              <BookOpen size={12} />
            </span>
            Previous Year Questions
          </div>

          <div className="flex items-center gap-2.5 text-[8.5px] font-semibold text-[#D7E0EA]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#12243B] text-[#19B8F2]">
              <BarChart3 size={12} />
            </span>
            Practice Tests
          </div>

          <div className="flex items-center gap-2.5 text-[8.5px] font-semibold text-[#D7E0EA]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#12243B] text-[#19B8F2]">
              <ClipboardCheck size={12} />
            </span>
            Mock Tests
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <div
            className={`flex h-[42px] w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r ${theme.button} text-[9px] font-black text-white shadow-lg transition-all duration-300 group-hover:-translate-y-0.5`}
          >
            Explore Examination
            <ArrowRight
              size={14}
              strokeWidth={2.6}
              className="transition-transform duration-300 group-hover:translate-x-1.5"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default ExamCard;
