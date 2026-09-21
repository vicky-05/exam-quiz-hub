import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    HelpCircle,
    Search,
    Plus,
    Edit3,
    Eye,
    Power,
    CheckCircle2,
    XCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Filter,
    Upload,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const PAGE_SIZE = 20;

function AdminQuestions() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [tests, setTests] = useState([]);

    const [totalQuestions, setTotalQuestions] = useState(0);
    const [activeQuestions, setActiveQuestions] = useState(0);
    const [inactiveQuestions, setInactiveQuestions] = useState(0);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [testFilter, setTestFilter] = useState("all");

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [viewQuestion, setViewQuestion] = useState(null);

    /*
     * ------------------------------------------------------
     * LOAD TESTS
     * ------------------------------------------------------
     */

    async function loadTests() {
        try {
            const { data, error: testsError } = await supabase
                .from("tests")
                .select("id, title, set_number, test_type")
                .order("title", { ascending: true });

            if (testsError) {
                throw testsError;
            }

            setTests(data || []);
        } catch (err) {
            console.error("Tests loading failed:", err);

            setError(
                err?.message || "Unable to load test information."
            );
        }
    }

    /*
     * ------------------------------------------------------
     * LOAD QUESTION COUNTS
     * ------------------------------------------------------
     */

    async function loadCounts() {
        try {
            const [
                totalResult,
                activeResult,
                inactiveResult,
            ] = await Promise.all([
                supabase
                    .from("questions")
                    .select("id", {
                        count: "exact",
                        head: true,
                    }),

                supabase
                    .from("questions")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("active", true),

                supabase
                    .from("questions")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("active", false),
            ]);

            if (totalResult.error) {
                throw totalResult.error;
            }

            if (activeResult.error) {
                throw activeResult.error;
            }

            if (inactiveResult.error) {
                throw inactiveResult.error;
            }

            setTotalQuestions(totalResult.count || 0);
            setActiveQuestions(activeResult.count || 0);
            setInactiveQuestions(inactiveResult.count || 0);
        } catch (err) {
            console.error("Question counts loading failed:", err);

            setError(
                err?.message ||
                "Unable to load question statistics."
            );
        }
    }

    /*
     * ------------------------------------------------------
     * LOAD QUESTIONS
     * ------------------------------------------------------
     */

    async function loadQuestions() {
        try {
            setLoading(true);
            setError("");

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from("questions")
                .select(
                    `
            id,
            test_id,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            question_type,
            marks,
            negative_marks,
            display_order,
            active,
            created_at
          `,
                    {
                        count: "exact",
                    }
                )
                .order("display_order", {
                    ascending: true,
                })
                .range(from, to);

            /*
             * Search question text
             */
            if (search.trim()) {
                query = query.ilike(
                    "question_text",
                    `%${search.trim()}%`
                );
            }

            /*
             * Status filter
             */
            if (statusFilter === "active") {
                query = query.eq("active", true);
            }

            if (statusFilter === "inactive") {
                query = query.eq("active", false);
            }

            /*
             * Test filter
             */
            if (testFilter !== "all") {
                query = query.eq("test_id", testFilter);
            }

            const {
                data,
                error: questionsError,
                count,
            } = await query;

            if (questionsError) {
                throw questionsError;
            }

            setQuestions(data || []);

            /*
             * The count here is the filtered result count.
             * We don't overwrite the overall dashboard count.
             */
            if (count === 0 && page > 1) {
                setPage(1);
            }
        } catch (err) {
            console.error("Questions loading failed:", err);

            setError(
                err?.message ||
                "Unable to load questions."
            );

            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }

    /*
     * ------------------------------------------------------
     * INITIAL LOAD
     * ------------------------------------------------------
     */

    useEffect(() => {
        loadTests();
        loadCounts();
    }, []);

    /*
     * ------------------------------------------------------
     * RELOAD QUESTIONS WHEN FILTERS CHANGE
     * ------------------------------------------------------
     */

    useEffect(() => {
        loadQuestions();
    }, [page, statusFilter, testFilter, search]);

    /*
     * ------------------------------------------------------
     * REFRESH
     * ------------------------------------------------------
     */

    async function refreshAll() {
        setSuccess("");
        setError("");

        await Promise.all([
            loadTests(),
            loadCounts(),
            loadQuestions(),
        ]);
    }

    /*
     * ------------------------------------------------------
     * ACTIVATE / DEACTIVATE
     * ------------------------------------------------------
     */

    async function toggleQuestionStatus(question) {
        const newStatus = !question.active;

        try {
            setActionLoading(question.id);
            setError("");
            setSuccess("");

            const { error: updateError } = await supabase
                .from("questions")
                .update({
                    active: newStatus,
                })
                .eq("id", question.id);

            if (updateError) {
                throw updateError;
            }

            setQuestions((currentQuestions) =>
                currentQuestions.map((item) =>
                    item.id === question.id
                        ? {
                            ...item,
                            active: newStatus,
                        }
                        : item
                )
            );

            await loadCounts();

            setSuccess(
                newStatus
                    ? "Question activated successfully."
                    : "Question deactivated successfully."
            );

            setTimeout(() => {
                setSuccess("");
            }, 2500);
        } catch (err) {
            console.error(
                "Question status update failed:",
                err
            );

            setError(
                err?.message ||
                "Unable to update question status."
            );
        } finally {
            setActionLoading("");
        }
    }

    /*
     * ------------------------------------------------------
     * TEST LOOKUP
     * ------------------------------------------------------
     */

    const testMap = useMemo(() => {
        const map = {};

        tests.forEach((test) => {
            map[test.id] = test;
        });

        return map;
    }, [tests]);

    function getTestName(testId) {
        const test = testMap[testId];

        if (!test) {
            return testId || "Unknown Test";
        }

        return test.title || "Untitled Test";
    }

    function getTestDetails(testId) {
        const test = testMap[testId];

        if (!test) {
            return "";
        }

        const parts = [];

        if (
            test.set_number !== null &&
            test.set_number !== undefined
        ) {
            parts.push(`Set ${test.set_number}`);
        }

        if (test.test_type) {
            parts.push(test.test_type);
        }

        return parts.join(" · ");
    }

    /*
     * ------------------------------------------------------
     * FORMAT
     * ------------------------------------------------------
     */

    function getQuestionNumber(question) {
        return question.display_order ?? "—";
    }

    function formatDate(date) {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function getCorrectOption(question) {
        const options = [
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d,
        ];

        const answer = Number(question.correct_answer);

        if (
            Number.isInteger(answer) &&
            answer >= 0 &&
            answer < options.length
        ) {
            return String.fromCharCode(65 + answer);
        }

        return question.correct_answer ?? "—";
    }

    /*
     * ------------------------------------------------------
     * PAGINATION
     * ------------------------------------------------------
     */

    const filteredTotalPages = Math.max(
        1,
        Math.ceil(
            totalQuestions / PAGE_SIZE
        )
    );

    /*
     * ------------------------------------------------------
     * RENDER
     * ------------------------------------------------------
     */

    return (
        <div className="space-y-6">
            {/* ------------------------------------------------ */}
            {/* HEADER */}
            {/* ------------------------------------------------ */}

            <section>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#009FE3]">
                            Management
                        </p>

                        <h1 className="mt-1 text-2xl font-extrabold text-[#10233F] sm:text-3xl">
                            Question Bank
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage questions across all tests and sets.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={refreshAll}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#003B82] shadow-sm transition hover:bg-slate-50"
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin/questions/bulk-upload")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#003B82] bg-white px-4 py-2.5 text-sm font-bold text-[#003B82] transition hover:bg-blue-50"
                        >
                            <Upload size={17} />
                            Bulk Upload
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin/questions/new")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#002F68]"
                        >
                            <Plus size={17} />
                            Add Question
                        </button>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* SUCCESS */}
            {/* ------------------------------------------------ */}

            {success && (
                <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            {/* ------------------------------------------------ */}
            {/* ERROR */}
            {/* ------------------------------------------------ */}

            {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <XCircle size={18} />
                    {error}
                </div>
            )}

            {/* ------------------------------------------------ */}
            {/* STATISTICS */}
            {/* ------------------------------------------------ */}

            <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">
                                Total Questions
                            </p>

                            <p className="mt-2 text-3xl font-extrabold text-[#10233F]">
                                {totalQuestions.toLocaleString("en-IN")}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                            <HelpCircle
                                size={21}
                                className="text-[#003B82]"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">
                                Active Questions
                            </p>

                            <p className="mt-2 text-3xl font-extrabold text-[#10233F]">
                                {activeQuestions.toLocaleString("en-IN")}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                            <CheckCircle2
                                size={21}
                                className="text-green-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">
                                Inactive Questions
                            </p>

                            <p className="mt-2 text-3xl font-extrabold text-[#10233F]">
                                {inactiveQuestions.toLocaleString("en-IN")}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                            <XCircle
                                size={21}
                                className="text-red-600"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* FILTERS */}
            {/* ------------------------------------------------ */}

            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                        {/* Search */}
                        <div className="relative w-full">
                            <Search
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search questions..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#009FE3] focus:bg-white focus:ring-2 focus:ring-[#009FE3]/10"
                            />
                        </div>

                        <div className="flex flex-col gap-3 lg:flex-row">
                            {/* Test */}
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                <Filter
                                    size={17}
                                    className="shrink-0 text-slate-400"
                                />

                                <select
                                    value={testFilter}
                                    onChange={(event) => {
                                        setTestFilter(event.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none focus:border-[#009FE3]"
                                >
                                    <option value="all">
                                        All Tests
                                    </option>

                                    {tests.map((test) => (
                                        <option
                                            key={test.id}
                                            value={test.id}
                                        >
                                            {test.title}
                                            {test.set_number !== null &&
                                                test.set_number !== undefined
                                                ? ` — Set ${test.set_number}`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    ["all", "All"],
                                    ["active", "Active"],
                                    ["inactive", "Inactive"],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(value);
                                            setPage(1);
                                        }}
                                        className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${statusFilter === value
                                            ? "bg-[#003B82] text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* RESULTS */}
                {/* ------------------------------------------------ */}

                <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-bold text-[#10233F]">
                        {questions.length}
                    </span>{" "}
                    questions on this page
                </div>

                {/* ------------------------------------------------ */}
                {/* TABLE */}
                {/* ------------------------------------------------ */}

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="space-y-3 p-5">
                            {Array.from({ length: 8 }).map(
                                (_, index) => (
                                    <div
                                        key={index}
                                        className="h-20 animate-pulse rounded-xl bg-slate-100"
                                    />
                                )
                            )}
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <HelpCircle
                                size={44}
                                className="mx-auto text-slate-300"
                            />

                            <h3 className="mt-4 font-bold text-[#10233F]">
                                No questions found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Try changing your search or filters.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full min-w-[1050px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                                    <th className="px-5 py-4">
                                        #
                                    </th>

                                    <th className="px-5 py-4">
                                        Question
                                    </th>

                                    <th className="px-5 py-4">
                                        Test
                                    </th>

                                    <th className="px-5 py-4">
                                        Answer
                                    </th>

                                    <th className="px-5 py-4">
                                        Marks
                                    </th>

                                    <th className="px-5 py-4">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {questions.map((question) => (
                                    <tr
                                        key={question.id}
                                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                                    >
                                        {/* Number */}
                                        <td className="px-5 py-4">
                                            <span className="font-bold text-slate-500">
                                                {getQuestionNumber(question)}
                                            </span>
                                        </td>

                                        {/* Question */}
                                        <td className="max-w-[420px] px-5 py-4">
                                            <div className="line-clamp-2 font-semibold leading-6 text-[#10233F]">
                                                {question.question_text}
                                            </div>

                                            <div className="mt-1 text-xs text-slate-400">
                                                ID: {question.id}
                                            </div>
                                        </td>

                                        {/* Test */}
                                        <td className="max-w-[230px] px-5 py-4">
                                            <div className="truncate text-sm font-semibold text-[#10233F]">
                                                {getTestName(question.test_id)}
                                            </div>

                                            <div className="mt-1 text-xs text-slate-500">
                                                {getTestDetails(question.test_id)}
                                            </div>
                                        </td>

                                        {/* Answer */}
                                        <td className="px-5 py-4">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-sm font-extrabold text-green-700">
                                                {getCorrectOption(question)}
                                            </span>
                                        </td>

                                        {/* Marks */}
                                        <td className="px-5 py-4">
                                            <div className="text-sm font-bold text-[#10233F]">
                                                {question.marks}
                                            </div>

                                            <div className="mt-1 text-xs text-red-500">
                                                -{question.negative_marks}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            {question.active ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                                                    <CheckCircle2 size={13} />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                                                    <XCircle size={13} />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                {/* View */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewQuestion(question)
                                                    }
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-[#003B82]"
                                                    title="View question"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/questions/${question.id}/edit`
                                                        )
                                                    }
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-[#003B82]"
                                                    title="Edit question"
                                                >
                                                    <Edit3 size={16} />
                                                </button>

                                                {/* Activate / Deactivate */}
                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading === question.id
                                                    }
                                                    onClick={() =>
                                                        toggleQuestionStatus(
                                                            question
                                                        )
                                                    }
                                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${question.active
                                                        ? "border-red-100 text-red-500 hover:bg-red-50"
                                                        : "border-green-100 text-green-600 hover:bg-green-50"
                                                        }`}
                                                    title={
                                                        question.active
                                                            ? "Deactivate"
                                                            : "Activate"
                                                    }
                                                >
                                                    <Power size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ------------------------------------------------ */}
                {/* PAGINATION */}
                {/* ------------------------------------------------ */}

                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                        Page{" "}
                        <span className="font-bold text-[#10233F]">
                            {page}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() =>
                                setPage((current) =>
                                    Math.max(1, current - 1)
                                )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={
                                loading ||
                                questions.length < PAGE_SIZE
                            }
                            onClick={() =>
                                setPage((current) => current + 1)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* VIEW QUESTION MODAL */}
            {/* ------------------------------------------------ */}

            {viewQuestion && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h2 className="font-extrabold text-[#10233F]">
                                    Question Details
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    ID: {viewQuestion.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewQuestion(null)}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                            >
                                <XCircle size={21} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-5 p-5">
                            <div>
                                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Question
                                </div>

                                <p className="font-semibold leading-7 text-[#10233F]">
                                    {viewQuestion.question_text}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    ["A", viewQuestion.option_a],
                                    ["B", viewQuestion.option_b],
                                    ["C", viewQuestion.option_c],
                                    ["D", viewQuestion.option_d],
                                ].map(([letter, option]) => {
                                    const isCorrect =
                                        getCorrectOption(viewQuestion) ===
                                        letter;

                                    return (
                                        <div
                                            key={letter}
                                            className={`rounded-xl border p-4 ${isCorrect
                                                ? "border-green-200 bg-green-50"
                                                : "border-slate-200 bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${isCorrect
                                                        ? "bg-green-600 text-white"
                                                        : "bg-white text-slate-600"
                                                        }`}
                                                >
                                                    {letter}
                                                </span>

                                                <span className="pt-1 text-sm font-medium leading-6 text-[#10233F]">
                                                    {option}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-4">
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="text-xs font-bold uppercase text-slate-400">
                                        Test
                                    </div>

                                    <div className="mt-1 text-sm font-bold text-[#10233F]">
                                        {getTestName(
                                            viewQuestion.test_id
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="text-xs font-bold uppercase text-slate-400">
                                        Type
                                    </div>

                                    <div className="mt-1 text-sm font-bold text-[#10233F]">
                                        {viewQuestion.question_type}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="text-xs font-bold uppercase text-slate-400">
                                        Marks
                                    </div>

                                    <div className="mt-1 text-sm font-bold text-[#10233F]">
                                        {viewQuestion.marks}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="text-xs font-bold uppercase text-slate-400">
                                        Negative
                                    </div>

                                    <div className="mt-1 text-sm font-bold text-red-600">
                                        {viewQuestion.negative_marks}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setViewQuestion(null)}
                                className="rounded-xl bg-[#003B82] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#002F68]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminQuestions;