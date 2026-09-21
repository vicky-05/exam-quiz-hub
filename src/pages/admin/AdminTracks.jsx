import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Power,
  RefreshCw,
  X,
  Loader2,
  GitBranch,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const emptyForm = {
  id: "",
  exam_id: "",
  name: "",
  description: "",
  active: true,
};

function AdminTracks() {
  const [tracks, setTracks] = useState([]);
  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // LOAD EXAMS
  // --------------------------------------------------

  async function loadExams() {
    try {
      setLoadingExams(true);

      const { data, error: fetchError } = await supabase
        .from("exams")
        .select("id, name, full_name, active")
        .order("name", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setExams(data || []);
    } catch (err) {
      console.error("Error loading exams:", err);
      setError(err.message || "Failed to load exams.");
    } finally {
      setLoadingExams(false);
    }
  }

  // --------------------------------------------------
  // LOAD TRACKS
  // --------------------------------------------------

  async function loadTracks() {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("tracks")
        .select(
          "id, exam_id, name, description, active, created_at"
        )
        .order("name", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setTracks(data || []);
    } catch (err) {
      console.error("Error loading tracks:", err);
      setError(err.message || "Failed to load tracks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
    loadTracks();
  }, []);

  // --------------------------------------------------
  // STATS
  // --------------------------------------------------

  const totalTracks = tracks.length;

  const activeTracks = tracks.filter(
    (track) => track.active === true
  ).length;

  const inactiveTracks = tracks.filter(
    (track) => track.active === false
  ).length;

  // --------------------------------------------------
  // EXAM LOOKUP
  // --------------------------------------------------

  function getExamName(examId) {
    const exam = exams.find(
      (item) => item.id === examId
    );

    return exam?.name || examId || "Unknown Exam";
  }

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tracks.filter((track) => {
      const exam = exams.find(
        (item) => item.id === track.exam_id
      );

      const matchesSearch =
        !query ||
        track.id?.toLowerCase().includes(query) ||
        track.name?.toLowerCase().includes(query) ||
        track.description
          ?.toLowerCase()
          .includes(query) ||
        exam?.name?.toLowerCase().includes(query) ||
        exam?.full_name?.toLowerCase().includes(query);

      const matchesExam =
        examFilter === "all" ||
        track.exam_id === examFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && track.active) ||
        (statusFilter === "inactive" && !track.active);

      return (
        matchesSearch &&
        matchesExam &&
        matchesStatus
      );
    });
  }, [
    tracks,
    exams,
    search,
    examFilter,
    statusFilter,
  ]);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  }

  function openAddModal() {
    setEditingTrack(null);

    setForm({
      ...emptyForm,
      exam_id:
        examFilter !== "all"
          ? examFilter
          : "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(track) {
    setEditingTrack(track);

    setForm({
      id: track.id || "",
      exam_id: track.exam_id || "",
      name: track.name || "",
      description: track.description || "",
      active: track.active ?? true,
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingTrack(null);
    setForm(emptyForm);
  }

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const id = form.id.trim();
    const examId = form.exam_id;
    const name = form.name.trim();

    if (!id) {
      setError("Track ID is required.");
      return;
    }

    if (!examId) {
      setError("Please select an exam.");
      return;
    }

    if (!name) {
      setError("Track name is required.");
      return;
    }

    try {
      setSaving(true);

      if (editingTrack) {
        // --------------------------------------------
        // UPDATE
        // --------------------------------------------

        const { error: updateError } =
          await supabase
            .from("tracks")
            .update({
              exam_id: examId,
              name,
              description:
                form.description.trim() || null,
              active: form.active,
            })
            .eq("id", editingTrack.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Track updated successfully."
        );
      } else {
        // --------------------------------------------
        // INSERT
        // --------------------------------------------

        const { error: insertError } =
          await supabase
            .from("tracks")
            .insert({
              id,
              exam_id: examId,
              name,
              description:
                form.description.trim() || null,
              active: form.active,
            });

        if (insertError) {
          throw insertError;
        }

        setSuccess(
          "Track added successfully."
        );
      }

      await loadTracks();

      setTimeout(() => {
        setModalOpen(false);
        setEditingTrack(null);
        setForm(emptyForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Error saving track:", err);

      if (err.code === "23505") {
        setError(
          "A track with this ID already exists."
        );
      } else {
        setError(
          err.message || "Failed to save track."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------

  async function toggleActive(track) {
    try {
      setError("");
      setSuccess("");

      const { error: updateError } =
        await supabase
          .from("tracks")
          .update({
            active: !track.active,
          })
          .eq("id", track.id);

      if (updateError) {
        throw updateError;
      }

      setTracks((previous) =>
        previous.map((item) =>
          item.id === track.id
            ? {
                ...item,
                active: !item.active,
              }
            : item
        )
      );

      setSuccess(
        track.active
          ? "Track deactivated."
          : "Track activated."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error(
        "Error updating track status:",
        err
      );

      setError(
        err.message ||
          "Failed to update track status."
      );
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#F7F9FC",
        padding: "28px",
      }}
    >
      {/* HEADER */}

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
              fontSize: "28px",
              fontWeight: 800,
              color: "#10233F",
            }}
          >
            Tracks
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748B",
              fontSize: "14px",
            }}
          >
            Manage exam preparation tracks.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              loadExams();
              loadTracks();
            }}
            disabled={loading}
            style={{
              border: "1px solid #D7E0EA",
              background: "#FFFFFF",
              color: "#10233F",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            disabled={loadingExams}
            style={{
              border: "none",
              background: "#003B82",
              color: "#FFFFFF",
              borderRadius: "10px",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: loadingExams
                ? "not-allowed"
                : "pointer",
              fontWeight: 700,
            }}
          >
            <Plus size={18} />
            Add Track
          </button>
        </div>
      </div>

      {/* SUCCESS */}

      {success && (
        <div
          style={{
            marginBottom: "18px",
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#047857",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {success}
        </div>
      )}

      {/* ERROR */}

      {error && !modalOpen && (
        <div
          style={{
            marginBottom: "18px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* STATS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <StatCard
          icon={<GitBranch size={22} />}
          label="Total Tracks"
          value={totalTracks}
          iconBg="#E8F1FF"
          iconColor="#003B82"
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Active"
          value={activeTracks}
          iconBg="#ECFDF5"
          iconColor="#059669"
        />

        <StatCard
          icon={<CircleOff size={22} />}
          label="Inactive"
          value={inactiveTracks}
          iconBg="#FFF7ED"
          iconColor="#EA580C"
        />
      </div>

      {/* FILTER BAR */}

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "18px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* SEARCH */}

        <div
          style={{
            position: "relative",
            flex: "1 1 280px",
          }}
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform:
                "translateY(-50%)",
              color: "#94A3B8",
            }}
          />

          <input
            type="text"
            placeholder="Search tracks..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding:
                "11px 12px 11px 40px",
              border:
                "1px solid #D7E0EA",
              borderRadius: "9px",
              outline: "none",
              fontSize: "14px",
              color: "#10233F",
            }}
          />
        </div>

        {/* EXAM FILTER */}

        <select
          value={examFilter}
          onChange={(event) =>
            setExamFilter(event.target.value)
          }
          style={{
            minWidth: "180px",
            padding: "11px 12px",
            border:
              "1px solid #D7E0EA",
            borderRadius: "9px",
            background: "#FFFFFF",
            color: "#10233F",
            fontSize: "14px",
          }}
        >
          <option value="all">
            All Exams
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

        {/* STATUS FILTER */}

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
          style={{
            minWidth: "150px",
            padding: "11px 12px",
            border:
              "1px solid #D7E0EA",
            borderRadius: "9px",
            background: "#FFFFFF",
            color: "#10233F",
            fontSize: "14px",
          }}
        >
          <option value="all">
            All Status
          </option>
          <option value="active">
            Active
          </option>
          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      {/* TABLE */}

      <div
        style={{
          background: "#FFFFFF",
          border:
            "1px solid #E2E8F0",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              minHeight: "260px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "#64748B",
            }}
          >
            <Loader2 size={20} />
            Loading tracks...
          </div>
        ) : filteredTracks.length ===
          0 ? (
          <div
            style={{
              minHeight: "260px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "8px",
              color: "#64748B",
              padding: "30px",
              textAlign: "center",
            }}
          >
            <GitBranch size={32} />

            <strong>
              No tracks found
            </strong>

            <span
              style={{
                fontSize: "14px",
              }}
            >
              Try changing your search
              or filters.
            </span>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth: "850px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      "#F8FAFC",
                    borderBottom:
                      "1px solid #E2E8F0",
                  }}
                >
                  <th style={thStyle}>
                    ID
                  </th>

                  <th style={thStyle}>
                    Track
                  </th>

                  <th style={thStyle}>
                    Exam
                  </th>

                  <th style={thStyle}>
                    Status
                  </th>

                  <th
                    style={{
                      ...thStyle,
                      textAlign:
                        "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTracks.map(
                  (track) => (
                    <tr
                      key={track.id}
                      style={{
                        borderBottom:
                          "1px solid #EEF2F7",
                      }}
                    >
                      <td
                        style={tdStyle}
                      >
                        <code
                          style={{
                            background:
                              "#F1F5F9",
                            padding:
                              "4px 7px",
                            borderRadius:
                              "6px",
                            fontSize:
                              "12px",
                            color:
                              "#334155",
                          }}
                        >
                          {track.id}
                        </code>
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <div
                          style={{
                            fontWeight:
                              700,
                            color:
                              "#10233F",
                          }}
                        >
                          {track.name}
                        </div>

                        {track.description && (
                          <div
                            style={{
                              marginTop:
                                "4px",
                              color:
                                "#64748B",
                              fontSize:
                                "12px",
                              maxWidth:
                                "320px",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              track.description
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color:
                            "#475569",
                        }}
                      >
                        {getExamName(
                          track.exam_id
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            padding:
                              "5px 9px",
                            borderRadius:
                              "999px",
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            background:
                              track.active
                                ? "#ECFDF5"
                                : "#F1F5F9",
                            color:
                              track.active
                                ? "#047857"
                                : "#64748B",
                          }}
                        >
                          {track.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "flex-end",
                            gap: "8px",
                          }}
                        >
                          <ActionButton
                            title="Edit track"
                            onClick={() =>
                              openEditModal(
                                track
                              )
                            }
                          >
                            <Pencil
                              size={16}
                            />
                          </ActionButton>

                          <ActionButton
                            title={
                              track.active
                                ? "Deactivate track"
                                : "Activate track"
                            }
                            onClick={() =>
                              toggleActive(
                                track
                              )
                            }
                            danger={
                              track.active
                            }
                          >
                            <Power
                              size={16}
                            />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESULT COUNT */}

      {!loading && (
        <div
          style={{
            marginTop: "12px",
            color: "#64748B",
            fontSize: "13px",
          }}
        >
          Showing{" "}
          {filteredTracks.length}{" "}
          of {totalTracks} tracks
        </div>
      )}

      {/* MODAL */}

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              background:
                "#FFFFFF",
              borderRadius:
                "16px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.18)",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                padding:
                  "20px 22px",
                borderBottom:
                  "1px solid #E2E8F0",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "20px",
                    color:
                      "#10233F",
                  }}
                >
                  {editingTrack
                    ? "Edit Track"
                    : "Add Track"}
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "#64748B",
                    fontSize:
                      "13px",
                  }}
                >
                  {editingTrack
                    ? "Update track information."
                    : "Create a new exam track."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                style={{
                  border:
                    "none",
                  background:
                    "#F1F5F9",
                  width: "36px",
                  height: "36px",
                  borderRadius:
                    "9px",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  color:
                    "#475569",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div
                style={{
                  padding:
                    "22px",
                  display:
                    "grid",
                  gap:
                    "16px",
                }}
              >
                {error && (
                  <div
                    style={{
                      background:
                        "#FEF2F2",
                      border:
                        "1px solid #FECACA",
                      color:
                        "#B91C1C",
                      borderRadius:
                        "9px",
                      padding:
                        "11px 12px",
                      fontSize:
                        "13px",
                      fontWeight:
                        600,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* TRACK ID */}

                <Field
                  label="Track ID"
                  required
                  hint={
                    editingTrack
                      ? "Track ID cannot be changed."
                      : "Use a unique ID such as group-4 or aao."
                  }
                >
                  <input
                    name="id"
                    value={
                      form.id
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      !!editingTrack
                    }
                    placeholder="e.g. group-4"
                    style={
                      inputStyle
                    }
                  />
                </Field>

                {/* EXAM */}

                <Field
                  label="Exam"
                  required
                >
                  <select
                    name="exam_id"
                    value={
                      form.exam_id
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      loadingExams
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      Select Exam
                    </option>

                    {exams.map(
                      (exam) => (
                        <option
                          key={
                            exam.id
                          }
                          value={
                            exam.id
                          }
                        >
                          {exam.name}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                {/* NAME */}

                <Field
                  label="Track Name"
                  required
                >
                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Group 4"
                    style={
                      inputStyle
                    }
                  />
                </Field>

                {/* DESCRIPTION */}

                <Field label="Description">
                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter a short description..."
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize:
                        "vertical",
                    }}
                  />
                </Field>

                {/* ACTIVE */}

                <label
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "10px",
                    cursor:
                      "pointer",
                    color:
                      "#10233F",
                    fontWeight:
                      600,
                    fontSize:
                      "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    name="active"
                    checked={
                      form.active
                    }
                    onChange={
                      handleChange
                    }
                    style={{
                      width:
                        "17px",
                      height:
                        "17px",
                    }}
                  />

                  Active Track
                </label>
              </div>

              {/* FOOTER */}

              <div
                style={{
                  padding:
                    "16px 22px",
                  borderTop:
                    "1px solid #E2E8F0",
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "10px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  style={{
                    border:
                      "1px solid #D7E0EA",
                    background:
                      "#FFFFFF",
                    color:
                      "#334155",
                    borderRadius:
                      "9px",
                    padding:
                      "10px 16px",
                    fontWeight:
                      600,
                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingExams
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "#003B82",
                    color:
                      "#FFFFFF",
                    borderRadius:
                      "9px",
                    padding:
                      "10px 18px",
                    fontWeight:
                      700,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "8px",
                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {saving && (
                    <Loader2
                      size={16}
                    />
                  )}

                  {editingTrack
                    ? "Save Changes"
                    : "Add Track"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

// --------------------------------------------------
// COMPONENTS
// --------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border:
          "1px solid #E2E8F0",
        borderRadius: "14px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "11px",
          background: iconBg,
          color: iconColor,
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
            color: "#64748B",
            fontSize: "13px",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: "#10233F",
            fontSize: "24px",
            fontWeight: 800,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          color: "#10233F",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color: "#DC2626",
            }}
          >
            {" "}
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <div
          style={{
            marginTop: "5px",
            color: "#94A3B8",
            fontSize: "11px",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "8px",
        border:
          "1px solid #D7E0EA",
        background: "#FFFFFF",
        color: danger
          ? "#DC2626"
          : "#003B82",
        display: "inline-flex",
        alignItems: "center",
        justifyContent:
          "center",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const thStyle = {
  padding: "13px 16px",
  textAlign: "left",
  color: "#64748B",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: "14px",
  verticalAlign: "middle",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border:
    "1px solid #D7E0EA",
  borderRadius: "9px",
  outline: "none",
  fontSize: "14px",
  color: "#10233F",
  background: "#FFFFFF",
};

export default AdminTracks;