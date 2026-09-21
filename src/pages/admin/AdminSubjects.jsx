import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CircleOff,
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
  name: "",
  description: "",
  display_order: 0,
  active: true,
};

function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [tracks, setTracks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
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
            "id, track_id, name, description, display_order, active, created_at"
          )
          .order("display_order", { ascending: true }),
      ]);

      if (examError) throw examError;
      if (trackError) throw trackError;
      if (subjectError) throw subjectError;

      setExams(examData || []);
      setTracks(trackData || []);
      setSubjects(subjectData || []);
    } catch (err) {
      console.error("Error loading subjects:", err);
      setError(err.message || "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const trackMap = useMemo(() => {
    return Object.fromEntries(tracks.map((track) => [track.id, track]));
  }, [tracks]);

  const examMap = useMemo(() => {
    return Object.fromEntries(exams.map((exam) => [exam.id, exam]));
  }, [exams]);

  const filteredTracks = useMemo(() => {
    if (!form.exam_id) return tracks;

    return tracks.filter((track) => track.exam_id === form.exam_id);
  }, [tracks, form.exam_id]);

  const filterTracks = useMemo(() => {
    if (!examFilter) return tracks;

    return tracks.filter((track) => track.exam_id === examFilter);
  }, [tracks, examFilter]);

  const filteredSubjects = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const track = trackMap[subject.track_id];
      const exam = track ? examMap[track.exam_id] : null;

      const matchesSearch =
        !searchText ||
        subject.id.toLowerCase().includes(searchText) ||
        subject.name.toLowerCase().includes(searchText) ||
        (track?.name || "").toLowerCase().includes(searchText) ||
        (exam?.name || "").toLowerCase().includes(searchText);

      const matchesExam =
        !examFilter || track?.exam_id === examFilter;

      const matchesTrack =
        !trackFilter || subject.track_id === trackFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && subject.active) ||
        (statusFilter === "inactive" && !subject.active);

      return (
        matchesSearch &&
        matchesExam &&
        matchesTrack &&
        matchesStatus
      );
    });
  }, [
    subjects,
    search,
    examFilter,
    trackFilter,
    statusFilter,
    trackMap,
    examMap,
  ]);

  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter((s) => s.active).length;
  const inactiveSubjects = subjects.filter((s) => !s.active).length;

  function openAddModal() {
    setEditingSubject(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(subject) {
    const track = trackMap[subject.track_id];

    setEditingSubject(subject);

    setForm({
      id: subject.id,
      exam_id: track?.exam_id || "",
      track_id: subject.track_id,
      name: subject.name,
      description: subject.description || "",
      display_order: subject.display_order ?? 0,
      active: subject.active,
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingSubject(null);
    setForm(emptyForm);
    setError("");
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;

    if (name === "exam_id") {
      setForm((prev) => ({
        ...prev,
        exam_id: value,
        track_id: "",
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
        throw new Error("Subject ID is required.");
      }

      if (!form.exam_id) {
        throw new Error("Please select an exam.");
      }

      if (!form.track_id) {
        throw new Error("Please select a track.");
      }

      if (!form.name.trim()) {
        throw new Error("Subject name is required.");
      }

      const selectedTrack = tracks.find(
        (track) => track.id === form.track_id
      );

      if (!selectedTrack) {
        throw new Error("Selected track was not found.");
      }

      if (selectedTrack.exam_id !== form.exam_id) {
        throw new Error("Selected track does not belong to the selected exam.");
      }

      const displayOrder = Number(form.display_order);

      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        throw new Error("Display order must be a valid non-negative integer.");
      }

      const payload = {
        id: form.id.trim(),
        track_id: form.track_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        display_order: displayOrder,
        active: form.active,
      };

      if (editingSubject) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update({
            track_id: payload.track_id,
            name: payload.name,
            description: payload.description,
            display_order: payload.display_order,
            active: payload.active,
          })
          .eq("id", editingSubject.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("subjects")
          .insert(payload);

        if (insertError) throw insertError;
      }

      closeModal();
      await loadData();
    } catch (err) {
      console.error("Error saving subject:", err);

      if (err.code === "23505") {
        setError("A subject with this ID already exists.");
      } else {
        setError(err.message || "Failed to save subject.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleSubject(subject) {
    const action = subject.active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${subject.name}"?`
    );

    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from("subjects")
        .update({
          active: !subject.active,
        })
        .eq("id", subject.id);

      if (updateError) throw updateError;

      await loadData();
    } catch (err) {
      console.error("Error updating subject:", err);
      setError(err.message || "Failed to update subject.");
    }
  }

  function clearFilters() {
    setSearch("");
    setExamFilter("");
    setTrackFilter("");
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
            Subjects
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#667085",
              fontSize: "14px",
            }}
          >
            Manage subjects under each track.
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
            style={{
              border: "1px solid #D0D5DD",
              background: "#FFFFFF",
              color: "#10233F",
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            style={{
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
            }}
          >
            <Plus size={17} />
            Add Subject
          </button>
        </div>
      </div>

      {/* Error */}
      {error && !showModal && (
        <div
          style={{
            background: "#FFF1F2",
            border: "1px solid #FECDD3",
            color: "#BE123C",
            padding: "12px 14px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <StatCard
          icon={<BookOpen size={22} />}
          title="Total Subjects"
          value={totalSubjects}
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          title="Active Subjects"
          value={activeSubjects}
        />

        <StatCard
          icon={<CircleOff size={22} />}
          title="Inactive Subjects"
          value={inactiveSubjects}
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
              "minmax(220px, 1.5fr) repeat(3, minmax(150px, 1fr)) auto",
            gap: "10px",
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, track or exam..."
              style={inputStyle({
                paddingLeft: "38px",
              })}
            />
          </div>

          <select
            value={examFilter}
            onChange={(e) => {
              setExamFilter(e.target.value);
              setTrackFilter("");
            }}
            style={inputStyle()}
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
            onChange={(e) => setTrackFilter(e.target.value)}
            style={inputStyle()}
          >
            <option value="">All Tracks</option>

            {filterTracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={inputStyle()}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={clearFilters}
            style={{
              border: "1px solid #D0D5DD",
              background: "#FFFFFF",
              color: "#344054",
              padding: "0 14px",
              borderRadius: "8px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
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
              size={24}
              style={{
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F9FAFB",
                    borderBottom: "1px solid #E4E7EC",
                  }}
                >
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Subject</th>
                  <th style={thStyle}>Track</th>
                  <th style={thStyle}>Exam</th>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        padding: "50px",
                        textAlign: "center",
                        color: "#667085",
                      }}
                    >
                      No subjects found.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject) => {
                    const track = trackMap[subject.track_id];
                    const exam = track
                      ? examMap[track.exam_id]
                      : null;

                    return (
                      <tr
                        key={subject.id}
                        style={{
                          borderBottom: "1px solid #EAECF0",
                        }}
                      >
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "13px",
                              color: "#475467",
                            }}
                          >
                            {subject.id}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#10233F",
                            }}
                          >
                            {subject.name}
                          </div>

                          {subject.description && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#98A2B3",
                                marginTop: "3px",
                              }}
                            >
                              {subject.description}
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          {track?.name || "—"}
                        </td>

                        <td style={tdStyle}>
                          {exam?.name || "—"}
                        </td>

                        <td style={tdStyle}>
                          {subject.display_order}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "5px 9px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: subject.active
                                ? "#ECFDF3"
                                : "#F2F4F7",
                              color: subject.active
                                ? "#027A48"
                                : "#667085",
                            }}
                          >
                            {subject.active
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
                              justifyContent: "flex-end",
                              gap: "7px",
                            }}
                          >
                            <button
                              onClick={() =>
                                openEditModal(subject)
                              }
                              title="Edit"
                              style={iconButtonStyle}
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() =>
                                toggleSubject(subject)
                              }
                              title={
                                subject.active
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
              borderTop: "1px solid #EAECF0",
              color: "#667085",
              fontSize: "13px",
            }}
          >
            Showing {filteredSubjects.length} of {subjects.length} subjects
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(16, 35, 63, 0.45)",
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
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #EAECF0",
                display: "flex",
                justifyContent: "space-between",
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
                  {editingSubject
                    ? "Edit Subject"
                    : "Add Subject"}
                </h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#667085",
                    fontSize: "13px",
                  }}
                >
                  Configure subject details and placement.
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
                      background: "#FFF1F2",
                      border: "1px solid #FECDD3",
                      color: "#BE123C",
                      padding: "11px 13px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      fontSize: "14px",
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
                  <FormField label="Subject ID" required>
                    <input
                      name="id"
                      value={form.id}
                      onChange={handleFormChange}
                      disabled={!!editingSubject}
                      placeholder="e.g. polity"
                      style={inputStyle()}
                    />
                  </FormField>

                  <FormField label="Display Order" required>
                    <input
                      type="number"
                      min="0"
                      name="display_order"
                      value={form.display_order}
                      onChange={handleFormChange}
                      style={inputStyle()}
                    />
                  </FormField>

                  <FormField label="Exam" required>
                    <select
                      name="exam_id"
                      value={form.exam_id}
                      onChange={handleFormChange}
                      style={inputStyle()}
                    >
                      <option value="">Select Exam</option>

                      {exams.map((exam) => (
                        <option key={exam.id} value={exam.id}>
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
                      style={inputStyle()}
                    >
                      <option value="">
                        {form.exam_id
                          ? "Select Track"
                          : "Select Exam First"}
                      </option>

                      {filteredTracks.map((track) => (
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
                    <FormField label="Subject Name" required>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        placeholder="e.g. Indian Polity"
                        style={inputStyle()}
                      />
                    </FormField>
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                    }}
                  >
                    <FormField label="Description">
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleFormChange}
                        placeholder="Optional subject description"
                        rows="4"
                        style={{
                          ...inputStyle(),
                          resize: "vertical",
                        }}
                      />
                    </FormField>
                  </div>

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
                  borderTop: "1px solid #EAECF0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    border: "1px solid #D0D5DD",
                    background: "#FFFFFF",
                    color: "#344054",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: "none",
                    background: "#003B82",
                    color: "#FFFFFF",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  {saving && <Loader2 size={16} />}
                  {editingSubject
                    ? "Save Changes"
                    : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @media (max-width: 900px) {
            .admin-subject-filters {
              grid-template-columns: 1fr !important;
            }
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

const inputStyle = (extra = {}) => ({
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
  ...extra,
});

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

export default AdminSubjects;