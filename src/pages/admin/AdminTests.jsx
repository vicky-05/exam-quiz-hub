import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    CircleOff,
    FileText,
    Loader2,
    Pencil,
    Plus,
    Power,
    RefreshCw,
    Search,
    X,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const emptyForm = {
    id: "",
    exam_id: "",
    track_id: "",
    subject_id: "",
    title: "",
    set_number: 1,
    total_questions: 0,
    duration_minutes: 0,
    marks_per_question: 1,
    negative_marks: 0,
    active: true,
    test_type: "practice",
};

function AdminTests() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [exams, setExams] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [examFilter, setExamFilter] = useState("");
    const [trackFilter, setTrackFilter] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [showModal, setShowModal] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState("");

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [
                { data: examData, error: examError },
                { data: trackData, error: trackError },
                { data: subjectData, error: subjectError },
                { data: testData, error: testError },
            ] = await Promise.all([
                supabase
                    .from("exams")
                    .select("id, name, full_name, active")
                    .order("name", { ascending: true }),

                supabase
                    .from("tracks")
                    .select("id, exam_id, name, active")
                    .order("name", { ascending: true }),

                supabase
                    .from("subjects")
                    .select(
                        "id, track_id, name, display_order, active"
                    )
                    .order("display_order", { ascending: true }),

                supabase
                    .from("tests")
                    .select(
                        `
              id,
              subject_id,
              track_id,
              title,
              set_number,
              total_questions,
              duration_minutes,
              marks_per_question,
              negative_marks,
              active,
              test_type,
              created_at
            `
                    )
                    .order("title", { ascending: true }),
            ]);

            if (examError) throw examError;
            if (trackError) throw trackError;
            if (subjectError) throw subjectError;
            if (testError) throw testError;

            setExams(examData || []);
            setTracks(trackData || []);
            setSubjects(subjectData || []);
            setTests(testData || []);
        } catch (err) {
            console.error("Error loading tests:", err);
            setError(err.message || "Failed to load tests.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const examMap = useMemo(
        () => Object.fromEntries(exams.map((item) => [item.id, item])),
        [exams]
    );

    const trackMap = useMemo(
        () => Object.fromEntries(tracks.map((item) => [item.id, item])),
        [tracks]
    );

    const subjectMap = useMemo(
        () =>
            Object.fromEntries(
                subjects.map((item) => [item.id, item])
            ),
        [subjects]
    );

    const formTracks = useMemo(() => {
        if (!form.exam_id) return [];

        return tracks.filter(
            (track) => track.exam_id === form.exam_id
        );
    }, [tracks, form.exam_id]);

    const formSubjects = useMemo(() => {
        if (!form.track_id) return [];

        return subjects.filter(
            (subject) => subject.track_id === form.track_id
        );
    }, [subjects, form.track_id]);

    const filterTracks = useMemo(() => {
        if (!examFilter) return tracks;

        return tracks.filter(
            (track) => track.exam_id === examFilter
        );
    }, [tracks, examFilter]);

    const filterSubjects = useMemo(() => {
        if (!trackFilter) return subjects;

        return subjects.filter(
            (subject) => subject.track_id === trackFilter
        );
    }, [subjects, trackFilter]);

    const filteredTests = useMemo(() => {
        const text = search.trim().toLowerCase();

        return tests.filter((test) => {
            const subject = test.subject_id
                ? subjectMap[test.subject_id]
                : null;

            const track = trackMap[test.track_id];

            const exam = track
                ? examMap[track.exam_id]
                : subject
                    ? examMap[trackMap[subject.track_id]?.exam_id]
                    : null;

            const matchesSearch =
                !text ||
                test.id.toLowerCase().includes(text) ||
                test.title.toLowerCase().includes(text) ||
                String(test.set_number).includes(text) ||
                (subject?.name || "").toLowerCase().includes(text) ||
                (track?.name || "").toLowerCase().includes(text) ||
                (exam?.name || "").toLowerCase().includes(text);

            const matchesExam =
                !examFilter ||
                track?.exam_id === examFilter ||
                subject &&
                trackMap[subject.track_id]?.exam_id === examFilter;

            const matchesTrack =
                !trackFilter || test.track_id === trackFilter;

            const matchesSubject =
                !subjectFilter || test.subject_id === subjectFilter;

            const matchesType =
                !typeFilter || test.test_type === typeFilter;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && test.active) ||
                (statusFilter === "inactive" && !test.active);

            return (
                matchesSearch &&
                matchesExam &&
                matchesTrack &&
                matchesSubject &&
                matchesType &&
                matchesStatus
            );
        });
    }, [
        tests,
        search,
        examFilter,
        trackFilter,
        subjectFilter,
        typeFilter,
        statusFilter,
        examMap,
        trackMap,
        subjectMap,
    ]);

    const totalTests = tests.length;
    const activeTests = tests.filter((test) => test.active).length;
    const inactiveTests = tests.filter((test) => !test.active).length;

    function openAddModal() {
        setEditingTest(null);
        setForm(emptyForm);
        setError("");
        setShowModal(true);
    }

    function openEditModal(test) {
        const subject = test.subject_id
            ? subjectMap[test.subject_id]
            : null;

        const trackId =
            test.track_id || subject?.track_id || "";

        const track = trackMap[trackId];

        setEditingTest(test);

        setForm({
            id: test.id,
            exam_id: track?.exam_id || "",
            track_id: trackId,
            subject_id: test.subject_id || "",
            title: test.title,
            set_number: test.set_number ?? 1,
            total_questions: test.total_questions ?? 0,
            duration_minutes: test.duration_minutes ?? 0,
            marks_per_question: test.marks_per_question ?? 1,
            negative_marks: test.negative_marks ?? 0,
            active: test.active,
            test_type: test.test_type || "practice",
        });

        setError("");
        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;

        setShowModal(false);
        setEditingTest(null);
        setForm(emptyForm);
        setError("");
    }

    function handleFormChange(e) {
        const { name, value, type, checked } = e.target;

        if (name === "test_type") {
            setForm((prev) => ({
                ...prev,
                test_type: value,
                subject_id:
                    value === "mock" ? "" : prev.subject_id,
            }));

            return;
        }

        if (name === "exam_id") {
            setForm((prev) => ({
                ...prev,
                exam_id: value,
                track_id: "",
                subject_id: "",
            }));

            return;
        }

        if (name === "track_id") {
            setForm((prev) => ({
                ...prev,
                track_id: value,
                subject_id: "",
            }));

            return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleSave(e) {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            if (!form.id.trim()) {
                throw new Error("Test ID is required.");
            }

            if (!form.title.trim()) {
                throw new Error("Test title is required.");
            }

            if (!form.exam_id) {
                throw new Error("Please select an exam.");
            }

            if (!form.track_id) {
                throw new Error("Please select a track.");
            }

            if (form.test_type === "practice" && !form.subject_id) {
                throw new Error(
                    "Subject is required for a practice test."
                );
            }

            const selectedTrack = trackMap[form.track_id];

            if (!selectedTrack) {
                throw new Error("Selected track was not found.");
            }

            if (selectedTrack.exam_id !== form.exam_id) {
                throw new Error(
                    "Selected track does not belong to the selected exam."
                );
            }

            if (form.test_type === "practice") {
                const selectedSubject = subjectMap[form.subject_id];

                if (!selectedSubject) {
                    throw new Error("Selected subject was not found.");
                }

                if (selectedSubject.track_id !== form.track_id) {
                    throw new Error(
                        "Selected subject does not belong to the selected track."
                    );
                }
            }

            const setNumber = Number(form.set_number);
            const totalQuestions = Number(form.total_questions);
            const durationMinutes = Number(form.duration_minutes);
            const marksPerQuestion = Number(
                form.marks_per_question
            );
            const negativeMarks = Number(form.negative_marks);

            if (!Number.isInteger(setNumber) || setNumber < 1) {
                throw new Error(
                    "Set number must be a positive integer."
                );
            }

            if (
                !Number.isInteger(totalQuestions) ||
                totalQuestions < 0
            ) {
                throw new Error(
                    "Total questions must be a valid non-negative integer."
                );
            }

            if (
                !Number.isInteger(durationMinutes) ||
                durationMinutes < 0
            ) {
                throw new Error(
                    "Duration must be a valid non-negative integer."
                );
            }

            if (
                !Number.isFinite(marksPerQuestion) ||
                marksPerQuestion < 0
            ) {
                throw new Error(
                    "Marks per question must be a valid number."
                );
            }

            if (
                !Number.isFinite(negativeMarks) ||
                negativeMarks < 0
            ) {
                throw new Error(
                    "Negative marks must be a valid number."
                );
            }

            const payload = {
                id: form.id.trim(),
                subject_id:
                    form.test_type === "mock"
                        ? null
                        : form.subject_id,
                track_id: form.track_id,
                title: form.title.trim(),
                set_number: setNumber,
                total_questions: totalQuestions,
                duration_minutes: durationMinutes,
                marks_per_question: marksPerQuestion,
                negative_marks: negativeMarks,
                active: form.active,
                test_type: form.test_type,
            };

            if (editingTest) {
                const { error: updateError } = await supabase
                    .from("tests")
                    .update({
                        subject_id: payload.subject_id,
                        track_id: payload.track_id,
                        title: payload.title,
                        set_number: payload.set_number,
                        total_questions: payload.total_questions,
                        duration_minutes: payload.duration_minutes,
                        marks_per_question:
                            payload.marks_per_question,
                        negative_marks: payload.negative_marks,
                        active: payload.active,
                        test_type: payload.test_type,
                    })
                    .eq("id", editingTest.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("tests")
                    .insert(payload);

                if (insertError) throw insertError;
            }

            closeModal();
            await loadData();
        } catch (err) {
            console.error("Error saving test:", err);

            if (err.code === "23505") {
                setError("A test with this ID already exists.");
            } else {
                setError(err.message || "Failed to save test.");
            }
        } finally {
            setSaving(false);
        }
    }

    async function toggleTest(test) {
        const action = test.active
            ? "deactivate"
            : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} "${test.title}"?`
        );

        if (!confirmed) return;

        try {
            const { error: updateError } = await supabase
                .from("tests")
                .update({
                    active: !test.active,
                })
                .eq("id", test.id);

            if (updateError) throw updateError;

            await loadData();
        } catch (err) {
            console.error("Error updating test:", err);
            setError(err.message || "Failed to update test.");
        }
    }

    function clearFilters() {
        setSearch("");
        setExamFilter("");
        setTrackFilter("");
        setSubjectFilter("");
        setTypeFilter("");
        setStatusFilter("all");
    }

    return (
        <div
            style={{
                padding: "28px",
                background: "#F7F9FC",
                minHeight: "100vh",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            color: "#10233F",
                            fontSize: "28px",
                            fontWeight: 700,
                        }}
                    >
                        Tests / Sets
                    </h1>

                    <p
                        style={{
                            margin: "6px 0 0",
                            color: "#667085",
                            fontSize: "14px",
                        }}
                    >
                        Create and manage practice tests and mock tests.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                    }}
                >
                    <button
                        onClick={loadData}
                        disabled={loading}
                        style={secondaryButton}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        onClick={openAddModal}
                        style={primaryButton}
                    >
                        <Plus size={17} />
                        Add Test
                    </button>
                </div>
            </div>

            {error && !showModal && (
                <div style={errorBox}>
                    {error}
                </div>
            )}

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",
                    gap: "16px",
                    marginBottom: "22px",
                }}
            >
                <StatCard
                    icon={<FileText size={22} />}
                    title="Total Tests"
                    value={totalTests}
                />

                <StatCard
                    icon={<CheckCircle2 size={22} />}
                    title="Active Tests"
                    value={activeTests}
                />

                <StatCard
                    icon={<CircleOff size={22} />}
                    title="Inactive Tests"
                    value={inactiveTests}
                />
            </div>

            {/* Filters */}
            <div
                style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E7EC",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "18px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(220px, 1.5fr) repeat(4, minmax(140px, 1fr)) auto",
                        gap: "10px",
                    }}
                >
                    <div style={{ position: "relative" }}>
                        <Search
                            size={17}
                            style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#98A2B3",
                            }}
                        />

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search test..."
                            style={{
                                ...inputStyle,
                                paddingLeft: "38px",
                            }}
                        />
                    </div>

                    <select
                        value={examFilter}
                        onChange={(e) => {
                            setExamFilter(e.target.value);
                            setTrackFilter("");
                            setSubjectFilter("");
                        }}
                        style={inputStyle}
                    >
                        <option value="">All Exams</option>

                        {exams.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                                {exam.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={trackFilter}
                        onChange={(e) => {
                            setTrackFilter(e.target.value);
                            setSubjectFilter("");
                        }}
                        style={inputStyle}
                    >
                        <option value="">All Tracks</option>

                        {filterTracks.map((track) => (
                            <option
                                key={track.id}
                                value={track.id}
                            >
                                {track.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={subjectFilter}
                        onChange={(e) =>
                            setSubjectFilter(e.target.value)
                        }
                        style={inputStyle}
                    >
                        <option value="">All Subjects</option>

                        {filterSubjects.map((subject) => (
                            <option
                                key={subject.id}
                                value={subject.id}
                            >
                                {subject.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(e.target.value)
                        }
                        style={inputStyle}
                    >
                        <option value="">All Types</option>
                        <option value="practice">Practice</option>
                        <option value="mock">Mock</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        style={inputStyle}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <button
                        onClick={clearFilters}
                        style={clearButton}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div
                style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E7EC",
                    borderRadius: "10px",
                    overflow: "hidden",
                }}
            >
                {loading ? (
                    <div
                        style={{
                            padding: "60px",
                            display: "flex",
                            justifyContent: "center",
                            color: "#667085",
                        }}
                    >
                        <Loader2
                            size={25}
                            style={{
                                animation:
                                    "adminTestsSpin 1s linear infinite",
                            }}
                        />
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: "1250px",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background: "#F9FAFB",
                                        borderBottom:
                                            "1px solid #E4E7EC",
                                    }}
                                >
                                    <th style={thStyle}>ID</th>
                                    <th style={thStyle}>Test</th>
                                    <th style={thStyle}>Exam</th>
                                    <th style={thStyle}>Track</th>
                                    <th style={thStyle}>Subject</th>
                                    <th style={thStyle}>Type</th>
                                    <th style={thStyle}>Set</th>
                                    <th style={thStyle}>Questions</th>
                                    <th style={thStyle}>Duration</th>
                                    <th style={thStyle}>Status</th>
                                    <th
                                        style={{
                                            ...thStyle,
                                            textAlign: "right",
                                        }}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTests.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="11"
                                            style={{
                                                padding: "50px",
                                                textAlign: "center",
                                                color: "#667085",
                                            }}
                                        >
                                            No tests found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTests.map((test) => {
                                        const subject = test.subject_id
                                            ? subjectMap[test.subject_id]
                                            : null;

                                        const track =
                                            trackMap[test.track_id] ||
                                            (subject
                                                ? trackMap[subject.track_id]
                                                : null);

                                        const exam = track
                                            ? examMap[track.exam_id]
                                            : null;

                                        return (
                                            <tr
                                                key={test.id}
                                                style={{
                                                    borderBottom:
                                                        "1px solid #EAECF0",
                                                }}
                                            >
                                                <td style={tdStyle}>
                                                    <span
                                                        style={{
                                                            fontFamily: "monospace",
                                                            fontSize: "12px",
                                                            color: "#475467",
                                                        }}
                                                    >
                                                        {test.id}
                                                    </span>
                                                </td>

                                                <td style={tdStyle}>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            color: "#10233F",
                                                        }}
                                                    >
                                                        {test.title}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#98A2B3",
                                                            marginTop: "3px",
                                                        }}
                                                    >
                                                        {test.marks_per_question} mark
                                                        {test.marks_per_question !== 1
                                                            ? "s"
                                                            : ""}
                                                        {" • "}
                                                        -{test.negative_marks}
                                                    </div>
                                                </td>

                                                <td style={tdStyle}>
                                                    {exam?.name || "—"}
                                                </td>

                                                <td style={tdStyle}>
                                                    {track?.name || "—"}
                                                </td>

                                                <td style={tdStyle}>
                                                    {subject?.name || "—"}
                                                </td>

                                                <td style={tdStyle}>
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            padding: "5px 9px",
                                                            borderRadius: "999px",
                                                            background:
                                                                test.test_type ===
                                                                    "mock"
                                                                    ? "#FFF7E6"
                                                                    : "#EAF4FF",
                                                            color:
                                                                test.test_type ===
                                                                    "mock"
                                                                    ? "#B54708"
                                                                    : "#175CD3",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {test.test_type === "mock"
                                                            ? "Mock"
                                                            : "Practice"}
                                                    </span>
                                                </td>

                                                <td style={tdStyle}>
                                                    {test.set_number}
                                                </td>

                                                <td style={tdStyle}>
                                                    {test.total_questions}
                                                </td>

                                                <td style={tdStyle}>
                                                    {test.duration_minutes} min
                                                </td>

                                                <td style={tdStyle}>
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            padding: "5px 9px",
                                                            borderRadius: "999px",
                                                            background: test.active
                                                                ? "#ECFDF3"
                                                                : "#F2F4F7",
                                                            color: test.active
                                                                ? "#027A48"
                                                                : "#667085",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {test.active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>

                                                <td
                                                    style={{
                                                        ...tdStyle,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "flex-end",
                                                            gap: "7px",
                                                        }}

                                                    >
                                                        {/* Manage Questions */}
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/tests/${test.id}/questions`
                                                                )
                                                            }
                                                            title="Manage Questions"
                                                            style={iconButtonStyle}
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(test)
                                                            }
                                                            title="Edit"
                                                            style={iconButtonStyle}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                toggleTest(test)
                                                            }
                                                            title={
                                                                test.active
                                                                    ? "Deactivate"
                                                                    : "Activate"
                                                            }
                                                            style={iconButtonStyle}
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && (
                    <div
                        style={{
                            padding: "13px 16px",
                            borderTop:
                                "1px solid #EAECF0",
                            color: "#667085",
                            fontSize: "13px",
                        }}
                    >
                        Showing {filteredTests.length} of{" "}
                        {tests.length} tests
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background:
                            "rgba(16, 35, 63, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "700px",
                            maxHeight: "92vh",
                            overflowY: "auto",
                            background: "#FFFFFF",
                            borderRadius: "12px",
                            boxShadow:
                                "0 20px 50px rgba(0,0,0,0.15)",
                        }}
                    >
                        <div
                            style={{
                                padding: "18px 20px",
                                borderBottom:
                                    "1px solid #EAECF0",
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        margin: 0,
                                        color: "#10233F",
                                        fontSize: "20px",
                                    }}
                                >
                                    {editingTest
                                        ? "Edit Test"
                                        : "Add Test"}
                                </h2>

                                <p
                                    style={{
                                        margin: "4px 0 0",
                                        color: "#667085",
                                        fontSize: "13px",
                                    }}
                                >
                                    Configure test and set details.
                                </p>
                            </div>

                            <button
                                onClick={closeModal}
                                disabled={saving}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: "#667085",
                                }}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div style={{ padding: "20px" }}>
                                {error && (
                                    <div
                                        style={{
                                            ...errorBox,
                                            marginBottom: "16px",
                                        }}
                                    >
                                        {error}
                                    </div>
                                )}

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(2, minmax(0, 1fr))",
                                        gap: "15px",
                                    }}
                                >
                                    <FormField
                                        label="Test ID"
                                        required
                                    >
                                        <input
                                            name="id"
                                            value={form.id}
                                            onChange={handleFormChange}
                                            disabled={!!editingTest}
                                            placeholder="e.g. tn-admin-test-1"
                                            style={inputStyle}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Test Type"
                                        required
                                    >
                                        <select
                                            name="test_type"
                                            value={form.test_type}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        >
                                            <option value="practice">
                                                Practice
                                            </option>
                                            <option value="mock">
                                                Mock
                                            </option>
                                        </select>
                                    </FormField>

                                    <FormField label="Exam" required>
                                        <select
                                            name="exam_id"
                                            value={form.exam_id}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        >
                                            <option value="">
                                                Select Exam
                                            </option>

                                            {exams.map((exam) => (
                                                <option
                                                    key={exam.id}
                                                    value={exam.id}
                                                >
                                                    {exam.name}
                                                </option>
                                            ))}
                                        </select>
                                    </FormField>

                                    <FormField label="Track" required>
                                        <select
                                            name="track_id"
                                            value={form.track_id}
                                            onChange={handleFormChange}
                                            disabled={!form.exam_id}
                                            style={inputStyle}
                                        >
                                            <option value="">
                                                {form.exam_id
                                                    ? "Select Track"
                                                    : "Select Exam First"}
                                            </option>

                                            {formTracks.map((track) => (
                                                <option
                                                    key={track.id}
                                                    value={track.id}
                                                >
                                                    {track.name}
                                                </option>
                                            ))}
                                        </select>
                                    </FormField>

                                    <div
                                        style={{
                                            gridColumn: "1 / -1",
                                        }}
                                    >
                                        <FormField
                                            label="Subject"
                                            required={
                                                form.test_type ===
                                                "practice"
                                            }
                                        >
                                            <select
                                                name="subject_id"
                                                value={form.subject_id}
                                                onChange={handleFormChange}
                                                disabled={
                                                    !form.track_id ||
                                                    form.test_type === "mock"
                                                }
                                                style={inputStyle}
                                            >
                                                <option value="">
                                                    {form.test_type === "mock"
                                                        ? "Not required for Mock"
                                                        : form.track_id
                                                            ? "Select Subject"
                                                            : "Select Track First"}
                                                </option>

                                                {formSubjects.map(
                                                    (subject) => (
                                                        <option
                                                            key={subject.id}
                                                            value={subject.id}
                                                        >
                                                            {subject.name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </FormField>
                                    </div>

                                    <div
                                        style={{
                                            gridColumn: "1 / -1",
                                        }}
                                    >
                                        <FormField
                                            label="Test Title"
                                            required
                                        >
                                            <input
                                                name="title"
                                                value={form.title}
                                                onChange={handleFormChange}
                                                placeholder="e.g. TN Administration Test - 1"
                                                style={inputStyle}
                                            />
                                        </FormField>
                                    </div>

                                    <FormField
                                        label="Set Number"
                                        required
                                    >
                                        <input
                                            type="number"
                                            min="1"
                                            name="set_number"
                                            value={form.set_number}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Total Questions"
                                        required
                                    >
                                        <input
                                            type="number"
                                            min="0"
                                            name="total_questions"
                                            value={
                                                form.total_questions
                                            }
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Duration (minutes)"
                                        required
                                    >
                                        <input
                                            type="number"
                                            min="0"
                                            name="duration_minutes"
                                            value={
                                                form.duration_minutes
                                            }
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Marks / Question"
                                        required
                                    >
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="marks_per_question"
                                            value={
                                                form.marks_per_question
                                            }
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Negative Marks"
                                        required
                                    >
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            name="negative_marks"
                                            value={form.negative_marks}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        />
                                    </FormField>

                                    <div
                                        style={{
                                            gridColumn: "1 / -1",
                                        }}
                                    >
                                        <label
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "9px",
                                                color: "#344054",
                                                fontSize: "14px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={form.active}
                                                onChange={handleFormChange}
                                            />
                                            Active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: "15px 20px",
                                    borderTop:
                                        "1px solid #EAECF0",
                                    display: "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap: "10px",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    style={cancelButton}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={primaryButton}
                                >
                                    {saving && <Loader2 size={16} />}

                                    {editingTest
                                        ? "Save Changes"
                                        : "Create Test"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>
                {`
          @keyframes adminTestsSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
}

function StatCard({ icon, title, value }) {
    return (
        <div
            style={{
                background: "#FFFFFF",
                border: "1px solid #E4E7EC",
                borderRadius: "10px",
                padding: "18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
            }}
        >
            <div
                style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "9px",
                    background: "#EAF4FF",
                    color: "#003B82",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {icon}
            </div>

            <div>
                <div
                    style={{
                        color: "#667085",
                        fontSize: "13px",
                    }}
                >
                    {title}
                </div>

                <div
                    style={{
                        marginTop: "3px",
                        color: "#10233F",
                        fontSize: "24px",
                        fontWeight: 700,
                    }}
                >
                    {value}
                </div>
            </div>
        </div>
    );
}

function FormField({ label, required, children }) {
    return (
        <div>
            <label
                style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#344054",
                    fontSize: "13px",
                    fontWeight: 600,
                }}
            >
                {label}{" "}
                {required && (
                    <span style={{ color: "#D92D20" }}>*</span>
                )}
            </label>

            {children}
        </div>
    );
}

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    height: "42px",
    border: "1px solid #D0D5DD",
    borderRadius: "8px",
    padding: "0 12px",
    background: "#FFFFFF",
    color: "#10233F",
    outline: "none",
    fontSize: "14px",
};

const thStyle = {
    padding: "12px 16px",
    textAlign: "left",
    color: "#667085",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    whiteSpace: "nowrap",
};

const tdStyle = {
    padding: "14px 16px",
    color: "#344054",
    fontSize: "14px",
    verticalAlign: "middle",
};

const primaryButton = {
    border: "none",
    background: "#003B82",
    color: "#FFFFFF",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontWeight: 600,
};

const secondaryButton = {
    border: "1px solid #D0D5DD",
    background: "#FFFFFF",
    color: "#10233F",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "7px",
};

const cancelButton = {
    border: "1px solid #D0D5DD",
    background: "#FFFFFF",
    color: "#344054",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
};

const clearButton = {
    border: "1px solid #D0D5DD",
    background: "#FFFFFF",
    color: "#344054",
    padding: "0 14px",
    borderRadius: "8px",
    cursor: "pointer",
    whiteSpace: "nowrap",
};

const errorBox = {
    background: "#FFF1F2",
    border: "1px solid #FECDD3",
    color: "#BE123C",
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "18px",
};

const iconButtonStyle = {
    width: "34px",
    height: "34px",
    border: "1px solid #D0D5DD",
    background: "#FFFFFF",
    color: "#475467",
    borderRadius: "7px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

export default AdminTests;