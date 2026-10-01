import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  BookOpen,
  RefreshCw,
  X,
  Save,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const AdminStudyMaterialSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [tracks, setTracks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [form, setForm] = useState({
    exam_id: "",
    track_id: "",
    name: "",
    description: "",
    display_order: 0,
    is_active: true,
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        { data: subjectData, error: subjectError },
        { data: examData, error: examError },
        { data: trackData, error: trackError },
      ] = await Promise.all([
        supabase
          .from("study_material_subjects")
          .select("*")
          .order("display_order", { ascending: true })
          .order("name", { ascending: true }),

        supabase
          .from("exams")
          .select("id, name")
          .order("name", { ascending: true }),

        supabase
          .from("tracks")
          .select("id, exam_id, name")
          .order("name", { ascending: true }),
      ]);

      if (subjectError) throw subjectError;
      if (examError) throw examError;
      if (trackError) throw trackError;

      setSubjects(subjectData || []);
      setExams(examData || []);
      setTracks(trackData || []);
    } catch (err) {
      console.error("Failed to load study material subjects:", err);
      setError(
        err?.message || "Unable to load study material subjects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const selectedTracks = tracks.filter(
    (track) => track.exam_id === form.exam_id
  );

  const getExamName = (examId) =>
    exams.find((exam) => exam.id === examId)?.name || "—";

  const getTrackName = (trackId) =>
    tracks.find((track) => track.id === trackId)?.name || "—";

  const createSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  /**
   * Generates a slug that is unique within the selected track.
   *
   * Examples:
   * Seed Technology -> seed-technology
   * Seed Technology -> seed-technology-2
   * Seed Technology -> seed-technology-3
   */
  const generateUniqueSlug = async (
    trackId,
    name,
    excludeSubjectId = null
  ) => {
    const baseSlug = createSlug(name);

    if (!baseSlug) {
      throw new Error(
        "Unable to generate a valid slug from the subject name."
      );
    }

    const { data, error: slugError } = await supabase
      .from("study_material_subjects")
      .select("id, slug")
      .eq("track_id", trackId);

    if (slugError) throw slugError;

    const existingSlugs = new Set(
      (data || [])
        .filter((item) => item.id !== excludeSubjectId)
        .map((item) => item.slug)
        .filter(Boolean)
    );

    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let counter = 2;

    while (existingSlugs.has(`${baseSlug}-${counter}`)) {
      counter += 1;
    }

    return `${baseSlug}-${counter}`;
  };

  const filteredSubjects = subjects.filter((subject) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const exam = exams.find(
      (item) => item.id === subject.exam_id
    );

    const track = tracks.find(
      (item) => item.id === subject.track_id
    );

    return `
      ${subject.name || ""}
      ${subject.slug || ""}
      ${subject.description || ""}
      ${exam?.name || ""}
      ${track?.name || ""}
    `
      .toLowerCase()
      .includes(query);
  });

  // =========================================================
  // FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      exam_id: "",
      track_id: "",
      name: "",
      description: "",
      display_order: 0,
      is_active: true,
    });

    setEditingSubject(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setEditingSubject(null);

    setForm({
      exam_id: "",
      track_id: "",
      name: "",
      description: "",
      display_order: 0,
      is_active: true,
    });

    setShowForm(true);
    setError("");
  };

  const openEdit = (subject) => {
    setEditingSubject(subject);

    setForm({
      exam_id: subject.exam_id || "",
      track_id: subject.track_id || "",
      name: subject.name || "",
      description: subject.description || "",
      display_order: subject.display_order || 0,
      is_active: subject.is_active ?? true,
    });

    setShowForm(true);
    setError("");
  };

  const handleExamChange = (examId) => {
    setForm((prev) => ({
      ...prev,
      exam_id: examId,
      track_id: "",
    }));
  };

  const handleNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
    }));
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.exam_id) {
      setError("Please select an exam.");
      return;
    }

    if (!form.track_id) {
      setError("Please select a track.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    try {
      setSaving(true);

      /*
       * New subject:
       *   Always generate a new unique slug.
       *
       * Existing subject:
       *   Keep the existing slug if it stays in the same track.
       *   If the track changes, generate a new unique slug for
       *   the new track so the unique(track_id, slug) constraint
       *   is respected.
       */
      let slug;

      const trackChanged =
        editingSubject &&
        editingSubject.track_id !== form.track_id;

      if (!editingSubject || trackChanged) {
        slug = await generateUniqueSlug(
          form.track_id,
          form.name.trim(),
          editingSubject?.id || null
        );
      } else {
        slug = editingSubject.slug;
      }

      const payload = {
        exam_id: form.exam_id,
        track_id: form.track_id,
        name: form.name.trim(),
        slug,
        description: form.description.trim() || null,
        display_order: Number(form.display_order) || 0,
        is_active: Boolean(form.is_active),
      };

      if (editingSubject) {
        const { error: updateError } = await supabase
          .from("study_material_subjects")
          .update(payload)
          .eq("id", editingSubject.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("study_material_subjects")
          .insert(payload);

        if (insertError) throw insertError;
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Failed to save study material subject:", err);

      if (err?.code === "23505") {
        setError(
          "A study material subject with this name/slug already exists for this track. Please try again."
        );
      } else {
        setError(
          err?.message || "Unable to save study material subject."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Delete "${subject.name}"?\n\nOnly delete a subject if it has no study materials.`
    );

    if (!confirmed) return;

    try {
      setError("");

      const { error: deleteError } = await supabase
        .from("study_material_subjects")
        .delete()
        .eq("id", subject.id);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete study material subject:",
        err
      );

      setError(
        err?.message || "Unable to delete study material subject."
      );
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#003B82] to-[#0067B8] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 text-sm font-semibold text-blue-100">
              Study Material Management
            </div>

            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Study Material Subjects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Create and manage the separate subjects used only
              for ExamQuizHub study materials.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#003B82] transition hover:bg-blue-50"
          >
            <Plus size={17} />
            Add Subject
          </button>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-extrabold text-[#10233F]">
                {editingSubject
                  ? "Edit Study Material Subject"
                  : "Add Study Material Subject"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                This subject belongs only to the Study Materials system.
                The URL slug is generated automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2"
          >
            {/* EXAM */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Exam
              </label>

              <select
                value={form.exam_id}
                onChange={(e) =>
                  handleExamChange(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              >
                <option value="">Select Exam</option>

                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TRACK */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Track
              </label>

              <select
                value={form.track_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    track_id: e.target.value,
                  }))
                }
                disabled={!form.exam_id}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {form.exam_id
                    ? "Select Track"
                    : "Select Exam First"}
                </option>

                {selectedTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>

            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Subject Name
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  handleNameChange(e.target.value)
                }
                placeholder="e.g. Seed Technology"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />

              <p className="mt-1 text-xs text-slate-400">
                The URL slug will be generated automatically.
              </p>
            </div>

            {/* DESCRIPTION */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                placeholder="Short description about this study material subject..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {/* ORDER */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Display Order
              </label>

              <input
                type="number"
                min="0"
                value={form.display_order}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    display_order: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {/* ACTIVE */}
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#009FE3]"
                />

                <span className="text-sm font-semibold text-[#10233F]">
                  Active subject
                </span>
              </label>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row lg:col-span-2 lg:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#002D66] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    {editingSubject
                      ? "Update Subject"
                      : "Create Subject"}
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LIST */}
      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-extrabold text-[#10233F]">
              Study Material Subjects
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {subjects.length} subject
              {subjects.length === 1 ? "" : "s"} configured.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search subjects..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#009FE3] sm:w-64"
              />
            </div>

            <button
              type="button"
              onClick={loadData}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF6FD]">
                <BookOpen
                  size={22}
                  className="text-[#003B82]"
                />
              </div>

              <p className="mt-4 font-bold text-[#10233F]">
                No study material subjects found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first Study Material Subject.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">
                    Subject
                  </th>

                  <th className="px-6 py-3">
                    Exam
                  </th>

                  <th className="px-6 py-3">
                    Track
                  </th>

                  <th className="px-6 py-3">
                    Order
                  </th>

                  <th className="px-6 py-3">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#10233F]">
                        {subject.name}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-400">
                        {subject.slug}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getExamName(subject.exam_id)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getTrackName(subject.track_id)}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {subject.display_order}
                    </td>

                    <td className="px-6 py-4">
                      {subject.is_active ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(subject)
                          }
                          className="rounded-lg p-2 text-[#003B82] transition hover:bg-blue-50"
                          title="Edit"
                          aria-label={`Edit ${subject.name}`}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(subject)
                          }
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete"
                          aria-label={`Delete ${subject.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminStudyMaterialSubjects;
