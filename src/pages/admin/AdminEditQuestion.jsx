import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import { supabase } from "../../services/supabase";

function AdminEditQuestion() {
  const { questionId } = useParams();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);

  const [form, setForm] = useState({
    test_id: "",
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "0",
    question_type: "mcq",
    marks: "1",
    negative_marks: "0",
    display_order: "1",
    active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * --------------------------------------------------
   * LOAD TESTS
   * --------------------------------------------------
   */

  async function loadTests() {
    const { data, error: testsError } = await supabase
      .from("tests")
      .select("id, title, set_number, test_type")
      .order("title", { ascending: true });

    if (testsError) {
      throw testsError;
    }

    setTests(data || []);
  }

  /*
   * --------------------------------------------------
   * LOAD QUESTION
   * --------------------------------------------------
   */

  async function loadQuestion() {
    try {
      setLoading(true);
      setError("");

      await loadTests();

      const { data, error: questionError } = await supabase
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
            active
          `
        )
        .eq("id", questionId)
        .single();

      if (questionError) {
        throw questionError;
      }

      if (!data) {
        throw new Error("Question not found.");
      }

      setForm({
        test_id: data.test_id || "",
        question_text: data.question_text || "",
        option_a: data.option_a || "",
        option_b: data.option_b || "",
        option_c: data.option_c || "",
        option_d: data.option_d || "",
        correct_answer:
          data.correct_answer !== null &&
          data.correct_answer !== undefined
            ? String(data.correct_answer)
            : "0",
        question_type:
          data.question_type || "mcq",
        marks:
          data.marks !== null &&
          data.marks !== undefined
            ? String(data.marks)
            : "1",
        negative_marks:
          data.negative_marks !== null &&
          data.negative_marks !== undefined
            ? String(data.negative_marks)
            : "0",
        display_order:
          data.display_order !== null &&
          data.display_order !== undefined
            ? String(data.display_order)
            : "1",
        active: Boolean(data.active),
      });
    } catch (err) {
      console.error("Question loading failed:", err);

      setError(
        err?.message || "Unable to load question."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (questionId) {
      loadQuestion();
    }
  }, [questionId]);

  /*
   * --------------------------------------------------
   * FORM CHANGE
   * --------------------------------------------------
   */

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /*
   * --------------------------------------------------
   * VALIDATION
   * --------------------------------------------------
   */

  function validateForm() {
    if (!form.test_id) {
      return "Please select a test.";
    }

    if (!form.question_text.trim()) {
      return "Please enter the question.";
    }

    if (!form.option_a.trim()) {
      return "Please enter Option A.";
    }

    if (!form.option_b.trim()) {
      return "Please enter Option B.";
    }

    if (!form.option_c.trim()) {
      return "Please enter Option C.";
    }

    if (!form.option_d.trim()) {
      return "Please enter Option D.";
    }

    const correctAnswer = Number(form.correct_answer);

    if (
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer > 3
    ) {
      return "Correct answer must be A, B, C or D.";
    }

    if (
      form.marks === "" ||
      Number.isNaN(Number(form.marks))
    ) {
      return "Please enter valid marks.";
    }

    if (
      form.negative_marks === "" ||
      Number.isNaN(Number(form.negative_marks))
    ) {
      return "Please enter valid negative marks.";
    }

    if (
      form.display_order === "" ||
      !Number.isInteger(Number(form.display_order))
    ) {
      return "Display order must be a whole number.";
    }

    return "";
  }

  /*
   * --------------------------------------------------
   * SAVE
   * --------------------------------------------------
   */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from("questions")
        .update({
          test_id: form.test_id,
          question_text: form.question_text.trim(),
          option_a: form.option_a.trim(),
          option_b: form.option_b.trim(),
          option_c: form.option_c.trim(),
          option_d: form.option_d.trim(),
          correct_answer: Number(form.correct_answer),
          question_type: form.question_type.trim(),
          marks: Number(form.marks),
          negative_marks: Number(form.negative_marks),
          display_order: Number(form.display_order),
          active: form.active,
        })
        .eq("id", questionId);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Question updated successfully.");

      setTimeout(() => {
        navigate("/admin/questions");
      }, 1000);
    } catch (err) {
      console.error("Question update failed:", err);

      setError(
        err?.message ||
          "Unable to update question."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading question...
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR WITHOUT QUESTION
   * --------------------------------------------------
   */

  if (error && !form.question_text) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/admin/questions")}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#003B82]"
        >
          <ArrowLeft size={17} />
          Back to Question Bank
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          <div className="flex items-center gap-2">
            <XCircle size={18} />
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <section>
        <button
          type="button"
          onClick={() => navigate("/admin/questions")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#003B82] transition hover:text-[#009FE3]"
        >
          <ArrowLeft size={17} />
          Back to Question Bank
        </button>

        <p className="text-sm font-semibold text-[#009FE3]">
          Question Bank
        </p>

        <h1 className="mt-1 text-2xl font-extrabold text-[#10233F] sm:text-3xl">
          Edit Question
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update the question and its settings.
        </p>
      </section>

      {/* Messages */}
      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <XCircle size={18} />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Question Settings */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-extrabold text-[#10233F]">
              Question Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select where this question belongs.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Test */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Test
              </label>

              <select
                name="test_id"
                value={form.test_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#10233F] outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              >
                <option value="">
                  Select a test
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

            {/* Question Type */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Question Type
              </label>

              <input
                type="text"
                name="question_type"
                value={form.question_type}
                onChange={handleChange}
                placeholder="mcq"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-[#10233F] outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Display Order
              </label>

              <input
                type="number"
                min="1"
                name="display_order"
                value={form.display_order}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-[#10233F] outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>
          </div>
        </section>

        {/* Question */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-extrabold text-[#10233F]">
              Question
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the question and four answer options.
            </p>
          </div>

          <div className="space-y-5">
            {/* Question Text */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Question Text
              </label>

              <textarea
                name="question_text"
                value={form.question_text}
                onChange={handleChange}
                rows={5}
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 text-[#10233F] outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {/* Options */}
            <div className="grid gap-5 md:grid-cols-2">
              <OptionField
                letter="A"
                name="option_a"
                value={form.option_a}
                onChange={handleChange}
              />

              <OptionField
                letter="B"
                name="option_b"
                value={form.option_b}
                onChange={handleChange}
              />

              <OptionField
                letter="C"
                name="option_c"
                value={form.option_c}
                onChange={handleChange}
              />

              <OptionField
                letter="D"
                name="option_d"
                value={form.option_d}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Answer & Marks */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-extrabold text-[#10233F]">
              Answer & Scoring
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set the correct answer and scoring rules.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* Correct Answer */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Correct Answer
              </label>

              <select
                name="correct_answer"
                value={form.correct_answer}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#10233F] outline-none transition focus:border-[#009FE3]"
              >
                <option value="0">
                  A
                </option>

                <option value="1">
                  B
                </option>

                <option value="2">
                  C
                </option>

                <option value="3">
                  D
                </option>
              </select>

              <p className="mt-2 text-xs text-slate-400">
                A = 0, B = 1, C = 2, D = 3
              </p>
            </div>

            {/* Marks */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Marks
              </label>

              <input
                type="number"
                step="0.01"
                name="marks"
                value={form.marks}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-[#10233F] outline-none transition focus:border-[#009FE3]"
              />
            </div>

            {/* Negative Marks */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Negative Marks
              </label>

              <input
                type="number"
                step="0.01"
                name="negative_marks"
                value={form.negative_marks}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-[#10233F] outline-none transition focus:border-[#009FE3]"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-[#10233F]">
                Question Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Inactive questions won't be available to students.
              </p>
            </div>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="peer sr-only"
              />

              <div className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-[#003B82] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#009FE3]/20" />

              <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </label>
          </div>
        </section>

        {/* Buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/questions")
            }
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#002F68] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/*
 * --------------------------------------------------
 * OPTION FIELD
 * --------------------------------------------------
 */

function OptionField({
  letter,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#10233F]">
        Option {letter}
      </label>

      <div className="flex gap-2">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-[#E8F5FF] text-sm font-extrabold text-[#003B82]">
          {letter}
        </div>

        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-[#10233F] outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
        />
      </div>
    </div>
  );
}

export default AdminEditQuestion;