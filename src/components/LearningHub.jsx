import {
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

function LearningHub({ exam, track }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#009FE3]">
          <Sparkles size={15} />
          Learning Hub
        </div>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#001F4F] dark:text-white sm:text-3xl">
          Prepare Your Way
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
          Practice with the existing test subjects below or study from
          structured PDF materials. Everything you need for your{" "}
          {track.name} preparation in one place.
        </p>
      </div>

      {/* Study Materials */}
      <div className="grid gap-5">
        <Link
          to={`/study-materials/${exam.id}/${track.id}`}
          className="group relative overflow-hidden rounded-[28px] border border-[#FFD23F]/30 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#FFD23F]/60 hover:shadow-[0_22px_55px_rgba(0,59,130,0.10)] dark:border-[#4A4020] dark:bg-[#0D1B2E] dark:hover:border-[#FFD23F]/50"
        >
          {/* Decorative background */}
          <div className="absolute right-[-45px] top-[-45px] h-36 w-36 rounded-full bg-[#FFD23F]/10 blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF8D9] text-[#806000] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]">
                <FileText size={25} />
              </div>

              <span className="rounded-full bg-[#FFF8D9] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#806000] dark:bg-[#FFD23F]/10 dark:text-[#FFD23F]">
                PDF Library
              </span>
            </div>

            <h3 className="mt-6 text-xl font-black text-[#001F4F] dark:text-white">
              Study Materials
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
              Read your exam preparation materials, notes and reference PDFs
              organised by study-material subjects.
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-[#806000] dark:text-[#FFD23F]">
                Open study library
              </span>

              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFD23F] text-[#001F4F] transition group-hover:bg-[#FFE071]">
                <ArrowRight size={17} />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default LearningHub;