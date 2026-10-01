import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import Header from "../components/Header";

const StudyMaterialsPage = () => {
  const { examId, trackId } = useParams();

  const [exam, setExam] = useState(null);
  const [track, setTrack] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStudyMaterials();
  }, [examId, trackId]);

  const loadStudyMaterials = async () => {
    try {
      setLoading(true);
      setError("");

      // -----------------------------------------
      // 1. Load Exam
      // -----------------------------------------
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("id, name")
        .eq("id", examId)
        .single();

      if (examError) throw examError;

      // -----------------------------------------
      // 2. Load Track
      // -----------------------------------------
      const { data: trackData, error: trackError } = await supabase
        .from("tracks")
        .select("id, name, exam_id")
        .eq("id", trackId)
        .eq("exam_id", examId)
        .single();

      if (trackError) throw trackError;

      // -----------------------------------------
      // 3. Load Study Material Subjects
      // -----------------------------------------
      const { data: subjectData, error: subjectError } = await supabase
        .from("study_material_subjects")
        .select(`
          id,
          exam_id,
          track_id,
          name,
          slug,
          description,
          display_order,
          is_active
        `)
        .eq("exam_id", examId)
        .eq("track_id", trackId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (subjectError) throw subjectError;

      // -----------------------------------------
      // 4. Load Published Study Materials
      // -----------------------------------------
      const { data: materialData, error: materialError } = await supabase
        .from("study_materials")
        .select(`
          id,
          exam_id,
          track_id,
          study_material_subject_id,
          title,
          description,
          pdf_file_name,
          file_size_bytes,
          estimated_minutes,
          display_order,
          is_published
        `)
        .eq("exam_id", examId)
        .eq("track_id", trackId)
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("title", { ascending: true });

      if (materialError) throw materialError;

      setExam(examData);
      setTrack(trackData);
      setSubjects(subjectData || []);
      setMaterials(materialData || []);
    } catch (err) {
      console.error("Study materials loading error:", err);
      setError(
        err?.message ||
          "Unable to load study materials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Material count for each subject
  // -----------------------------------------
  const materialCountBySubject = useMemo(() => {
    const counts = {};

    materials.forEach((material) => {
      counts[material.study_material_subject_id] =
        (counts[material.study_material_subject_id] || 0) + 1;
    });

    return counts;
  }, [materials]);

  // -----------------------------------------
  // Search
  // -----------------------------------------
  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return subjects;
    }

    return subjects.filter((subject) => {
      const subjectName = subject.name?.toLowerCase() || "";
      const description = subject.description?.toLowerCase() || "";

      const subjectMaterials = materials.filter(
        (material) =>
          material.study_material_subject_id === subject.id
      );

      const materialMatch = subjectMaterials.some((material) => {
        const title = material.title?.toLowerCase() || "";
        const materialDescription =
          material.description?.toLowerCase() || "";
        const fileName =
          material.pdf_file_name?.toLowerCase() || "";

        return (
          title.includes(query) ||
          materialDescription.includes(query) ||
          fileName.includes(query)
        );
      });

      return (
        subjectName.includes(query) ||
        description.includes(query) ||
        materialMatch
      );
    });
  }, [subjects, materials, search]);

  // -----------------------------------------
  // Format file size
  // -----------------------------------------
  const formatFileSize = (bytes) => {
    if (!bytes) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // -----------------------------------------
  // Loading
  // -----------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#081426]">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-700" />

            <div className="h-14 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -----------------------------------------
  // Error
  // -----------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#081426]">
        <Header />

        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-900/40">
              ⚠️
            </div>

            <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
              Unable to Load Study Materials
            </h2>

            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={loadStudyMaterials}
              className="mt-5 rounded-xl bg-[#003B82] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#002d65]"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#081426] dark:text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Breadcrumb */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/"
            className="text-gray-500 transition hover:text-[#003B82] dark:text-gray-400 dark:hover:text-[#19B8F2]"
          >
            Home
          </Link>

          <span className="text-gray-400">/</span>

          <span className="font-medium text-[#003B82] dark:text-[#19B8F2]">
            {exam?.name || examId}
          </span>

          <span className="text-gray-400">/</span>

          <span className="font-medium text-gray-700 dark:text-gray-300">
            {track?.name || trackId}
          </span>

          <span className="text-gray-400">/</span>

          <span className="font-semibold text-gray-900 dark:text-white">
            Study Materials
          </span>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B82] via-[#0056A8] to-[#009FE3] px-5 py-7 text-white shadow-lg sm:px-8 sm:py-9">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              📚 Study Materials
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              {track?.name || "Study Materials"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
              Learn important concepts through structured study materials
              designed for competitive-exam preparation.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur-sm">
                <span className="block text-lg font-bold">
                  {subjects.length}
                </span>
                <span className="text-xs text-blue-100">
                  Subjects
                </span>
              </div>

              <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur-sm">
                <span className="block text-lg font-bold">
                  {materials.length}
                </span>
                <span className="text-xs text-blue-100">
                  PDF Materials
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-16 h-56 w-56 rounded-full bg-white/5" />
        </section>

        {/* Search */}
        <section className="mt-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search study materials or subjects..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm outline-none transition focus:border-[#009FE3] focus:ring-4 focus:ring-[#009FE3]/10 dark:border-gray-700 dark:bg-[#101E33] dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        </section>

        {/* Section Header */}
        <div className="mb-5 mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-bold text-[#10233F] dark:text-white sm:text-2xl">
              Study Material Subjects
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a subject to explore available PDF materials.
            </p>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredSubjects.length} subject
            {filteredSubjects.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Subjects */}
        {filteredSubjects.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-[#101E33]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl dark:bg-blue-900/20">
              📚
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              No Study Materials Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {search
                ? "Try a different search term."
                : "Study materials will appear here once they are published."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => {
              const count = materialCountBySubject[subject.id] || 0;

              return (
                <Link
                  key={subject.id}
                  to={`/study-materials/${examId}/${trackId}/${subject.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#009FE3]/40 hover:shadow-lg dark:border-gray-700 dark:bg-[#101E33] dark:hover:border-[#19B8F2]/40"
                >
                  {/* Icon */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF6FF] text-2xl transition group-hover:scale-105 dark:bg-[#003B82]/30">
                      📘
                    </div>

                    <div className="rounded-full bg-[#F0F7FF] px-3 py-1 text-xs font-bold text-[#003B82] dark:bg-[#003B82]/30 dark:text-[#19B8F2]">
                      {count} PDF{count !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Subject */}
                  <h3 className="text-lg font-bold text-[#10233F] transition group-hover:text-[#003B82] dark:text-white dark:group-hover:text-[#19B8F2]">
                    {subject.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-gray-500 dark:text-gray-400">
                    {subject.description ||
                      "Explore study materials and PDF resources for this subject."}
                  </p>

                  {/* Bottom */}
                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Exam preparation
                    </span>

                    <span className="flex items-center gap-1 text-sm font-bold text-[#003B82] transition group-hover:gap-2 dark:text-[#19B8F2]">
                      Explore
                      <span>→</span>
                    </span>
                  </div>

                  {/* Hover decoration */}
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#009FE3]/5 transition group-hover:bg-[#009FE3]/10" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer information */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-[#0B1D36]">
          <div className="flex gap-3">
            <div className="text-xl">💡</div>

            <div>
              <h3 className="text-sm font-bold text-[#003B82] dark:text-[#19B8F2]">
                Study Smart
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                Read the study material first and then use the Test Subjects
                section to practice questions and improve your preparation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudyMaterialsPage;