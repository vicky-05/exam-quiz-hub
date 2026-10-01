import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import { supabase } from "../services/supabase";

import {
    Worker,
    Viewer,
} from "@react-pdf-viewer/core";

import {
    defaultLayoutPlugin,
} from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const STORAGE_BUCKET = "study-materials";

const StudyMaterialViewerPage = () => {
    const {
        examId,
        trackId,
        subjectSlug,
        materialId,
    } = useParams();

    const [exam, setExam] = useState(null);
    const [track, setTrack] = useState(null);
    const [subject, setSubject] = useState(null);
    const [material, setMaterial] = useState(null);

    const [pdfUrl, setPdfUrl] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const defaultLayoutPluginInstance =
        defaultLayoutPlugin();

    useEffect(() => {
        loadMaterial();
    }, [examId, trackId, subjectSlug, materialId]);

    const loadMaterial = async () => {
        try {
            setLoading(true);
            setError("");

            // =========================================
            // 1. Load Exam
            // =========================================

            const { data: examData, error: examError } =
                await supabase
                    .from("exams")
                    .select("id, name")
                    .eq("id", examId)
                    .single();

            if (examError) throw examError;

            // =========================================
            // 2. Load Track
            // =========================================

            const { data: trackData, error: trackError } =
                await supabase
                    .from("tracks")
                    .select("id, name, exam_id")
                    .eq("id", trackId)
                    .eq("exam_id", examId)
                    .single();

            if (trackError) throw trackError;

            // =========================================
            // 3. Load Subject
            // =========================================

            const { data: subjectData, error: subjectError } =
                await supabase
                    .from("study_material_subjects")
                    .select(`
            id,
            exam_id,
            track_id,
            name,
            slug,
            description
          `)
                    .eq("exam_id", examId)
                    .eq("track_id", trackId)
                    .eq("slug", subjectSlug)
                    .eq("is_active", true)
                    .single();

            if (subjectError) throw subjectError;

            // =========================================
            // 4. Load Material
            // =========================================

            const { data: materialData, error: materialError } =
                await supabase
                    .from("study_materials")
                    .select(`
            id,
            exam_id,
            track_id,
            study_material_subject_id,
            title,
            description,
            pdf_path,
            pdf_file_name,
            file_size_bytes,
            estimated_minutes,
            display_order,
            is_published
          `)
                    .eq("id", materialId)
                    .eq("exam_id", examId)
                    .eq("track_id", trackId)
                    .eq(
                        "study_material_subject_id",
                        subjectData.id
                    )
                    .eq("is_published", true)
                    .single();

            if (materialError) throw materialError;

            if (!materialData.pdf_path) {
                throw new Error(
                    "PDF file is not available for this material."
                );
            }

            // =========================================
            // 5. Create Signed URL
            // =========================================

            const {
                data: signedUrlData,
                error: signedUrlError,
            } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(
                    materialData.pdf_path,
                    60 * 60
                );

            if (signedUrlError) {
                throw signedUrlError;
            }

            if (!signedUrlData?.signedUrl) {
                throw new Error(
                    "Unable to generate PDF access URL."
                );
            }

            setExam(examData);
            setTrack(trackData);
            setSubject(subjectData);
            setMaterial(materialData);
            setPdfUrl(signedUrlData.signedUrl);
        } catch (err) {
            console.error(
                "Study material viewer error:",
                err
            );

            setError(
                err?.message ||
                "Unable to open this study material."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // Loading
    // =========================================

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#081426]">
                <Header />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-5">
                        <div className="h-5 w-80 rounded bg-gray-200 dark:bg-gray-700" />

                        <div className="h-10 w-96 rounded bg-gray-200 dark:bg-gray-700" />

                        <div className="h-[70vh] rounded-2xl bg-gray-200 dark:bg-gray-700" />
                    </div>
                </main>
            </div>
        );
    }

    // =========================================
    // Error
    // =========================================

    if (error) {
        return (
            <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#081426]">
                <Header />

                <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl dark:bg-red-900/40">
                            ⚠️
                        </div>

                        <h2 className="text-xl font-bold text-red-700 dark:text-red-300">
                            Unable to Open PDF
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-red-600 dark:text-red-400">
                            {error}
                        </p>

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={loadMaterial}
                                className="rounded-xl bg-[#003B82] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#002d65]"
                            >
                                Try Again
                            </button>

                            <Link
                                to={`/study-materials/${examId}/${trackId}/${subjectSlug}`}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-[#101E33] dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Back to Materials
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] dark:bg-[#081426] dark:text-white">
            <Header />

            <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6">

                {/* =========================================
            BREADCRUMB
        ========================================== */}

                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <Link
                        to="/"
                        className="text-gray-500 hover:text-[#003B82] dark:text-gray-400 dark:hover:text-[#19B8F2]"
                    >
                        Home
                    </Link>

                    <span className="text-gray-400">
                        /
                    </span>

                    <Link
                        to={`/study-materials/${examId}/${trackId}`}
                        className="text-gray-500 hover:text-[#003B82] dark:text-gray-400 dark:hover:text-[#19B8F2]"
                    >
                        Study Materials
                    </Link>

                    <span className="text-gray-400">
                        /
                    </span>

                    <Link
                        to={`/study-materials/${examId}/${trackId}/${subjectSlug}`}
                        className="text-gray-500 hover:text-[#003B82] dark:text-gray-400 dark:hover:text-[#19B8F2]"
                    >
                        {subject?.name}
                    </Link>

                    <span className="text-gray-400">
                        /
                    </span>

                    <span className="max-w-[250px] truncate font-semibold text-gray-900 dark:text-white">
                        {material?.title}
                    </span>
                </div>

                {/* =========================================
            MATERIAL HEADER
        ========================================== */}

                <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-700 dark:bg-[#101E33] sm:px-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-300">
                                    PDF
                                </span>

                                {material?.estimated_minutes > 0 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        ⏱ {material.estimated_minutes} min
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-2 truncate text-lg font-bold text-[#10233F] dark:text-white sm:text-xl">
                                {material?.title}
                            </h1>

                            {material?.description && (
                                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                                    {material.description}
                                </p>
                            )}
                        </div>

                        <Link
                            to={`/study-materials/${examId}/${trackId}/${subjectSlug}`}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-[#17263D] dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            ← Back
                        </Link>
                    </div>
                </div>

                {/* =========================================
            PDF VIEWER
        ========================================== */}

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-[#101E33]">

                    <div
                        className="w-full"
                        style={{
                            height:
                                "calc(100vh - 220px)",
                            minHeight: "600px",
                        }}
                    >
                        <Worker
                            workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"
                        >
                            <Viewer
                                fileUrl={pdfUrl}
                                plugins={[
                                    defaultLayoutPluginInstance,
                                ]}
                            />
                        </Worker>
                    </div>

                </section>

                {/* =========================================
            STUDY TIP
        ========================================== */}

                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-[#0B1D36]">
                    <div className="flex gap-3">
                        <div className="text-lg">
                            💡
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[#003B82] dark:text-[#19B8F2]">
                                Study Tip
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                                Read the material carefully and make short revision notes
                                for important concepts before attempting practice questions.
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default StudyMaterialViewerPage;