import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  RefreshCw,
  X,
  Save,
  Upload,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const STORAGE_BUCKET = "study-materials";

const AdminStudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [tracks, setTracks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [form, setForm] = useState({
    exam_id: "",
    track_id: "",
    study_material_subject_id: "",
    title: "",
    description: "",
    estimated_minutes: 10,
    display_order: 0,
    is_published: false,
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        { data: materialData, error: materialError },
        { data: subjectData, error: subjectError },
        { data: examData, error: examError },
        { data: trackData, error: trackError },
      ] = await Promise.all([
        supabase
          .from("study_materials")
          .select("*")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false }),

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

      if (materialError) throw materialError;
      if (subjectError) throw subjectError;
      if (examError) throw examError;
      if (trackError) throw trackError;

      setMaterials(materialData || []);
      setSubjects(subjectData || []);
      setExams(examData || []);
      setTracks(trackData || []);
    } catch (err) {
      console.error("Failed to load study materials:", err);

      setError(
        err?.message || "Unable to load study materials."
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

  const selectedTracks = useMemo(
    () =>
      tracks.filter(
        (track) => track.exam_id === form.exam_id
      ),
    [tracks, form.exam_id]
  );

  const selectedSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          subject.exam_id === form.exam_id &&
          subject.track_id === form.track_id &&
          subject.is_active
      ),
    [
      subjects,
      form.exam_id,
      form.track_id,
    ]
  );

  const getExamName = (examId) =>
    exams.find((exam) => exam.id === examId)?.name || "—";

  const getTrackName = (trackId) =>
    tracks.find((track) => track.id === trackId)?.name || "—";

  const getSubjectName = (subjectId) =>
    subjects.find((subject) => subject.id === subjectId)?.name ||
    "—";

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return "PDF";

    const parts = fileName.split(".");

    return parts.length > 1
      ? parts[parts.length - 1].toUpperCase()
      : "PDF";
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return materials;

    return materials.filter((material) => {
      const examName = getExamName(material.exam_id);
      const trackName = getTrackName(material.track_id);
      const subjectName = getSubjectName(
        material.study_material_subject_id
      );

      return `
        ${material.title || ""}
        ${material.description || ""}
        ${material.pdf_file_name || ""}
        ${examName}
        ${trackName}
        ${subjectName}
      `
        .toLowerCase()
        .includes(query);
    });
  }, [materials, search, exams, tracks, subjects]);

  // =========================================================
  // FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      exam_id: "",
      track_id: "",
      study_material_subject_id: "",
      title: "",
      description: "",
      estimated_minutes: 10,
      display_order: 0,
      is_published: false,
    });

    setSelectedFile(null);
    setEditingMaterial(null);
    setShowForm(false);

    setFileInputKey((value) => value + 1);
  };

  const openCreate = () => {
    setEditingMaterial(null);

    setForm({
      exam_id: "",
      track_id: "",
      study_material_subject_id: "",
      title: "",
      description: "",
      estimated_minutes: 10,
      display_order: 0,
      is_published: false,
    });

    setSelectedFile(null);
    setFileInputKey((value) => value + 1);

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEdit = (material) => {
    setEditingMaterial(material);

    setForm({
      exam_id: material.exam_id || "",
      track_id: material.track_id || "",
      study_material_subject_id:
        material.study_material_subject_id || "",
      title: material.title || "",
      description: material.description || "",
      estimated_minutes:
        material.estimated_minutes ?? 10,
      display_order:
        material.display_order ?? 0,
      is_published:
        material.is_published ?? false,
    });

    setSelectedFile(null);
    setFileInputKey((value) => value + 1);

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleExamChange = (examId) => {
    setForm((prev) => ({
      ...prev,
      exam_id: examId,
      track_id: "",
      study_material_subject_id: "",
    }));
  };

  const handleTrackChange = (trackId) => {
    setForm((prev) => ({
      ...prev,
      track_id: trackId,
      study_material_subject_id: "",
    }));
  };

  // =========================================================
  // FILE
  // =========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    setError("");
    setSuccess("");

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file only.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    // 50 MB maximum
    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("PDF size must be 50 MB or less.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    // Automatically use filename as title only for new materials
    if (!editingMaterial && !form.title.trim()) {
      const title = file.name
        .replace(/\.pdf$/i, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      setForm((prev) => ({
        ...prev,
        title,
      }));
    }
  };

  // =========================================================
  // STORAGE
  // =========================================================

  const createStoragePath = (file) => {
    const extension = "pdf";

    const safeFileName = file.name
      .replace(/\.pdf$/i, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const uniquePart = `${Date.now()}-${crypto.randomUUID()}`;

    return `${form.exam_id}/${form.track_id}/${form.study_material_subject_id}/${uniquePart}-${safeFileName}.${extension}`;
  };

  const uploadPdf = async (file) => {
    const path = createStoragePath(file);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });

    if (uploadError) {
      throw uploadError;
    }

    return path;
  };

  const deleteStorageFile = async (path) => {
    if (!path) return;

    const { error: removeError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (removeError) {
      console.error(
        "Failed to remove storage file:",
        removeError
      );
    }
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.exam_id) {
      setError("Please select an exam.");
      return;
    }

    if (!form.track_id) {
      setError("Please select a track.");
      return;
    }

    if (!form.study_material_subject_id) {
      setError("Please select a study material subject.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!editingMaterial && !selectedFile) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setSaving(true);

      let pdfPath = editingMaterial?.pdf_path || null;
      let newUploadedPath = null;

      // Upload new PDF if selected
      if (selectedFile) {
        newUploadedPath = await uploadPdf(selectedFile);
        pdfPath = newUploadedPath;
      }

      const payload = {
        exam_id: form.exam_id,
        track_id: form.track_id,
        study_material_subject_id:
          form.study_material_subject_id,
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        pdf_path: pdfPath,
        pdf_file_name:
          selectedFile?.name ||
          editingMaterial?.pdf_file_name ||
          null,
        file_size_bytes:
          selectedFile?.size ??
          editingMaterial?.file_size_bytes ??
          null,
        estimated_minutes:
          Number(form.estimated_minutes) || 10,
        display_order:
          Number(form.display_order) || 0,
        is_published: Boolean(form.is_published),
      };

      let savedMaterial = null;

      if (editingMaterial) {
        const { data, error: updateError } =
          await supabase
            .from("study_materials")
            .update(payload)
            .eq("id", editingMaterial.id)
            .select()
            .single();

        if (updateError) {
          // If DB update failed, remove newly uploaded PDF
          if (newUploadedPath) {
            await deleteStorageFile(newUploadedPath);
          }

          throw updateError;
        }

        savedMaterial = data;

        // Delete old PDF only after successful DB update
        if (
          newUploadedPath &&
          editingMaterial.pdf_path &&
          editingMaterial.pdf_path !== newUploadedPath
        ) {
          await deleteStorageFile(
            editingMaterial.pdf_path
          );
        }
      } else {
        const { data, error: insertError } =
          await supabase
            .from("study_materials")
            .insert(payload)
            .select()
            .single();

        if (insertError) {
          // If DB insert failed, remove uploaded PDF
          if (newUploadedPath) {
            await deleteStorageFile(newUploadedPath);
          }

          throw insertError;
        }

        savedMaterial = data;
      }

      console.log("Study material saved:", savedMaterial);

      resetForm();

      setSuccess(
        editingMaterial
          ? "Study material updated successfully."
          : "Study material uploaded successfully."
      );

      await loadData();
    } catch (err) {
      console.error("Failed to save study material:", err);

      setError(
        err?.message ||
          "Unable to save study material."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (material) => {
    const confirmed = window.confirm(
      `Delete "${material.title}"?\n\nThe PDF file will also be removed from Storage.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(material.id);
      setError("");
      setSuccess("");

      const { error: deleteError } = await supabase
        .from("study_materials")
        .delete()
        .eq("id", material.id);

      if (deleteError) throw deleteError;

      // Remove PDF from Storage after DB deletion
      if (material.pdf_path) {
        await deleteStorageFile(material.pdf_path);
      }

      setSuccess(
        "Study material deleted successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete study material:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete study material."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // TOGGLE PUBLISH
  // =========================================================

  const togglePublished = async (material) => {
    try {
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("study_materials")
        .update({
          is_published: !material.is_published,
        })
        .eq("id", material.id);

      if (updateError) throw updateError;

      setSuccess(
        material.is_published
          ? "Study material unpublished."
          : "Study material published."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Failed to update publication status:",
        err
      );

      setError(
        err?.message ||
          "Unable to update publication status."
      );
    }
  };

  // =========================================================
  // VIEW PDF
  // =========================================================

  const openPdf = async (material) => {
    try {
      setError("");

      if (!material.pdf_path) {
        setError("PDF file is not available.");
        return;
      }

      const { data, error: signedUrlError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(
            material.pdf_path,
            60 * 10
          );

      if (signedUrlError) {
        throw signedUrlError;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Unable to create PDF viewing URL."
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      console.error("Failed to open PDF:", err);

      setError(
        err?.message ||
          "Unable to open the PDF."
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
              Study Materials
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Upload and manage PDF study materials for
              ExamQuizHub.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#003B82] transition hover:bg-blue-50"
          >
            <Plus size={17} />
            Add Study Material
          </button>
        </div>
      </section>

      {/* SUCCESS */}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

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
                {editingMaterial
                  ? "Edit Study Material"
                  : "Add Study Material"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Upload a PDF and connect it to the correct
                Study Material Subject.
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
                  <option
                    key={exam.id}
                    value={exam.id}
                  >
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
                  handleTrackChange(e.target.value)
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
                  <option
                    key={track.id}
                    value={track.id}
                  >
                    {track.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBJECT */}

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Study Material Subject
              </label>

              <select
                value={
                  form.study_material_subject_id
                }
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    study_material_subject_id:
                      e.target.value,
                  }))
                }
                disabled={!form.track_id}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {form.track_id
                    ? selectedSubjects.length
                      ? "Select Study Material Subject"
                      : "No active subjects available"
                    : "Select Track First"}
                </option>

                {selectedSubjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TITLE */}

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Title
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g. Seed Certification Procedure"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
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
                placeholder="Short description about this study material..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {/* PDF */}

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                PDF File
              </label>

              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 transition hover:border-[#009FE3]/50">
                <input
                  key={fileInputKey}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#EAF6FD] file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-[#003B82] hover:file:bg-blue-100"
                />

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <FileText size={15} />
                  <span>PDF only • Maximum 50 MB</span>
                </div>

                {selectedFile && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                      <FileText
                        size={20}
                        className="text-red-600"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#10233F]">
                        {selectedFile.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatFileSize(
                          selectedFile.size
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {!selectedFile &&
                  editingMaterial?.pdf_file_name && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                        <FileText
                          size={20}
                          className="text-red-600"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#10233F]">
                          {editingMaterial.pdf_file_name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Existing PDF • Select a new file
                          above to replace it.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* ESTIMATED TIME */}

            <div>
              <label className="mb-2 block text-sm font-bold text-[#10233F]">
                Estimated Reading Time
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={form.estimated_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estimated_minutes:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  minutes
                </span>
              </div>
            </div>

            {/* DISPLAY ORDER */}

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
                    display_order:
                      e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/10"
              />
            </div>

            {/* PUBLISH */}

            <div className="lg:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_published:
                        e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#009FE3]"
                />

                <div>
                  <span className="block text-sm font-bold text-[#10233F]">
                    Publish immediately
                  </span>

                  <span className="block text-xs text-slate-400">
                    Published materials will be available
                    to users.
                  </span>
                </div>
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
                    {selectedFile
                      ? "Uploading..."
                      : "Saving..."}
                  </>
                ) : (
                  <>
                    {editingMaterial ? (
                      <Save size={17} />
                    ) : (
                      <Upload size={17} />
                    )}

                    {editingMaterial
                      ? "Update Study Material"
                      : "Upload & Save"}
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
              Available Study Materials
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {materials.length} material
              {materials.length === 1 ? "" : "s"} configured.
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
                placeholder="Search materials..."
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
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF6FD]">
                <FileText
                  size={22}
                  className="text-[#003B82]"
                />
              </div>

              <p className="mt-4 font-bold text-[#10233F]">
                No study materials found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Upload your first study material PDF.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">
                    Material
                  </th>

                  <th className="px-6 py-3">
                    Subject
                  </th>

                  <th className="px-6 py-3">
                    Track
                  </th>

                  <th className="px-6 py-3">
                    File
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
                {filteredMaterials.map((material) => (
                  <tr
                    key={material.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  >
                    {/* MATERIAL */}

                    <td className="px-6 py-4">
                      <div className="flex min-w-[260px] items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                          <FileText
                            size={21}
                            className="text-red-600"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-bold text-[#10233F]">
                            {material.title}
                          </div>

                          <div className="mt-1 line-clamp-1 text-xs text-slate-400">
                            {material.description ||
                              "No description"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SUBJECT */}

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-700">
                        {getSubjectName(
                          material.study_material_subject_id
                        )}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {getExamName(material.exam_id)}
                      </div>
                    </td>

                    {/* TRACK */}

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getTrackName(material.track_id)}
                    </td>

                    {/* FILE */}

                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-600">
                        {getFileExtension(
                          material.pdf_file_name
                        )}
                        {" • "}
                        {formatFileSize(
                          material.file_size_bytes
                        )}
                      </div>

                      <div className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                        {material.pdf_file_name || "—"}
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          togglePublished(material)
                        }
                        className={
                          material.is_published
                            ? "inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 transition hover:bg-green-100"
                            : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
                        }
                        title={
                          material.is_published
                            ? "Click to unpublish"
                            : "Click to publish"
                        }
                      >
                        {material.is_published ? (
                          <>
                            <Eye size={13} />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} />
                            Draft
                          </>
                        )}
                      </button>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openPdf(material)
                          }
                          className="rounded-lg p-2 text-[#0067B8] transition hover:bg-blue-50"
                          title="View PDF"
                          aria-label={`View ${material.title}`}
                        >
                          <ExternalLink size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(material)
                          }
                          className="rounded-lg p-2 text-[#003B82] transition hover:bg-blue-50"
                          title="Edit"
                          aria-label={`Edit ${material.title}`}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId === material.id
                          }
                          onClick={() =>
                            handleDelete(material)
                          }
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                          aria-label={`Delete ${material.title}`}
                        >
                          {deletingId ===
                          material.id ? (
                            <RefreshCw
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}
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

export default AdminStudyMaterials;