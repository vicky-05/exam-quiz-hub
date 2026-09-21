import { Link } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CircleHelp,
    FileQuestion,
    Home,
    SearchX,
    Sparkles,
} from "lucide-react";

import logo from "../assets/exam-quiz-hub-logo.png";
import darkLogo from "../assets/exam-quiz-hub-logo-dark.png";
import notFoundStudy from "../assets/not-found-study.png";

function NotFoundPage() {
    return (
        <div className="min-h-screen overflow-hidden bg-[#F5F8FC] text-[#10233F] dark:bg-[#06111F] dark:text-white">

            {/* Decorative background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[#009FE3]/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#FFD23F]/10 blur-3xl" />

                <div className="absolute left-[8%] top-[28%] hidden rotate-[-12deg] text-[#009FE3]/10 lg:block">
                    <BookOpen size={80} strokeWidth={1} />
                </div>

                <div className="absolute right-[8%] top-[20%] hidden rotate-[12deg] text-[#FFD23F]/20 lg:block">
                    <CircleHelp size={70} strokeWidth={1} />
                </div>
            </div>

            {/* Navbar */}
            <header className="relative z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#071625]/70">
                <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

                    <Link to="/" className="shrink-0">
                        <img
                            src={logo}
                            alt="Exam Quiz Hub"
                            className="h-11 w-auto object-contain dark:hidden"
                        />

                        <img
                            src={darkLogo}
                            alt="Exam Quiz Hub"
                            className="hidden h-11 w-auto object-contain dark:block"
                        />
                    </Link>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-[#003B82] shadow-sm transition hover:-translate-y-0.5 hover:border-[#009FE3] hover:text-[#009FE3] dark:border-[#263A52] dark:bg-[#0D1B2C] dark:text-[#19B8F2]"
                    >
                        <Home size={15} />
                        Home
                    </Link>
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl items-start px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-8">

                <div className="grid w-full items-start gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">

                    {/* LEFT — MESSAGE */}
                    <section className="order-2 text-center lg:order-1 lg:text-left">

                        {/* Small label */}
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#009FE3]/20 bg-[#009FE3]/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#0079B8] dark:border-[#19B8F2]/20 dark:bg-[#19B8F2]/10 dark:text-[#19B8F2]">
                            <Sparkles size={13} />
                            Wrong Turn
                        </div>

                        {/* 404 Exam Card */}
                        <div className="mx-auto mb-7 w-fit lg:mx-0">

                            <div className="relative rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(16,35,63,0.10)] dark:border-[#263A52] dark:bg-[#0D1B2C]">

                                {/* Question paper header */}
                                <div className="flex items-center justify-between rounded-2xl bg-[#F3F7FB] px-5 py-3 dark:bg-[#101F32]">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <FileQuestion size={15} />
                                        Question Status
                                    </div>

                                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-black text-red-500 dark:bg-red-950/30 dark:text-red-400">
                                        NOT FOUND
                                    </span>
                                </div>

                                <div className="px-7 py-5 sm:px-10">

                                    <div className="relative">
                                        <div className="text-[78px] font-black leading-none tracking-[-0.08em] text-[#003B82] dark:text-[#19B8F2] sm:text-[95px]">
                                            404
                                        </div>

                                        <div className="absolute -right-5 -top-2 flex h-10 w-10 rotate-12 items-center justify-center rounded-xl bg-[#FFD23F] text-[#10233F] shadow-lg">
                                            <SearchX size={20} />
                                        </div>
                                    </div>

                                    {/* Fake options */}
                                    <div className="mt-5 grid grid-cols-2 gap-2 text-left">
                                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-[10px] font-bold text-slate-400 dark:border-white/5">
                                            <span className="h-4 w-4 rounded-full border-2 border-slate-300" />
                                            Page moved
                                        </div>

                                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-[10px] font-bold text-slate-400 dark:border-white/5">
                                            <span className="h-4 w-4 rounded-full border-2 border-slate-300" />
                                            Wrong URL
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Heading */}
                        <h1 className="mt-1 text-4xl font-black tracking-[-0.05em] text-[#10233F] sm:text-5xl xl:text-[54px] dark:text-white">
                            Oops! You took
                            <br className="hidden sm:block" />
                            <span className="bg-gradient-to-r from-[#003B82] via-[#009FE3] to-[#19B8F2] bg-clip-text text-transparent">
                                a wrong turn.
                            </span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-[560px] text-sm leading-6 text-slate-500 sm:text-base lg:mx-0 dark:text-[#A8B4C5]">
                            This page isn't in our question bank. It may have been moved,
                            removed, or the URL may be incorrect.
                        </p>

                        {/* Buttons */}
                        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">

                            <Link
                                to="/"
                                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#003B82] to-[#009FE3] px-6 py-3.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,96,180,0.22)] transition hover:-translate-y-0.5"
                            >
                                <ArrowLeft
                                    size={18}
                                    className="transition group-hover:-translate-x-1"
                                />
                                Back to Home
                            </Link>

                            <Link
                                to="/"
                                className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-[#003B82] shadow-sm transition hover:-translate-y-0.5 hover:border-[#009FE3] dark:border-[#263A52] dark:bg-[#0D1B2C] dark:text-[#19B8F2]"
                            >
                                <BookOpen size={17} />
                                Explore Exams
                                <ArrowRight
                                    size={17}
                                    className="transition group-hover:translate-x-1"
                                />
                            </Link>

                        </div>

                        {/* Motivation */}
                        <div className="mx-auto mt-5 flex max-w-[520px] items-center justify-center gap-3 border-t border-slate-200 pt-5 text-xs font-semibold italic text-slate-400 lg:mx-0 lg:justify-start dark:border-white/10 dark:text-[#718198]">
                            <Sparkles
                                size={15}
                                className="shrink-0 text-[#FFD23F]"
                            />

                            <span>
                                Every wrong turn is a chance to learn.
                            </span>
                        </div>
                    </section>

                    {/* RIGHT — 404 STUDY ILLUSTRATION */}
                    <section className="order-1 flex items-center justify-center lg:order-2">

                        <div className="relative w-full max-w-[620px]">

                            {/* Floating message */}
                            <div className="absolute -left-2 top-[12%] z-20 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md sm:block dark:border-white/10 dark:bg-[#0D1B2C]/90">
                                <div className="flex items-center gap-3">

                                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF8D9] text-[#C49700]">
                                        <Sparkles size={17} />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                            Don't Give Up
                                        </p>

                                        <p className="text-xs font-black text-[#10233F] dark:text-white">
                                            Keep learning!
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* Main Image */}
                            <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white p-2 shadow-[0_30px_90px_rgba(0,44,94,0.20)] dark:border-[#263A52] dark:bg-[#0D1B2C]">

                                <div className="overflow-hidden rounded-[26px]">

                                    <img
                                        src={notFoundStudy}
                                        alt="Student discovering a page not found"
                                        className="
            block
            h-auto
            max-h-[520px]
            w-full
            object-cover
            object-center
            transition-transform
            duration-700
            hover:scale-[1.015]
          "
                                    />

                                </div>

                            </div>

                            {/* Bottom floating card */}
                            <div className="absolute -bottom-5 right-5 z-20 hidden rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md sm:block dark:border-white/10 dark:bg-[#0D1B2C]/95">

                                <div className="flex items-center gap-3">

                                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8F7FF] text-[#009FE3] dark:bg-[#123554]">
                                        <BookOpen size={17} />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                            Exam Quiz Hub
                                        </p>

                                        <p className="text-xs font-black text-[#10233F] dark:text-white">
                                            Back to learning →
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>

                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200/70 bg-white/50 py-4 text-center dark:border-white/10 dark:bg-transparent">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-[#65758C]">
                    © 2026 Exam Quiz Hub · Learn · Practice · Achieve
                </p>
            </footer>

        </div>
    );
}

export default NotFoundPage;