import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Power,
  RefreshCw,
  X,
  Loader2,
  BookOpen,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const emptyForm = {
  id: "",
  name: "",
  full_name: "",
  description: "",
  logo_url: "",
  active: true,
};

function AdminExams() {
  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // LOAD EXAMS
  // --------------------------------------------------

  async function loadExams() {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("exams")
        .select(
          "id, name, full_name, description, logo_url, active, created_at"
        )
        .order("name", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setExams(data || []);
    } catch (err) {
      console.error("Error loading exams:", err);
      setError(err.message || "Failed to load exams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  // --------------------------------------------------
  // STATS
  // --------------------------------------------------

  const totalExams = exams.length;

  const activeExams = exams.filter(
    (exam) => exam.active === true
  ).length;

  const inactiveExams = exams.filter(
    (exam) => exam.active === false
  ).length;

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exams.filter((exam) => {
      const matchesSearch =
        !query ||
        exam.id?.toLowerCase().includes(query) ||
        exam.name?.toLowerCase().includes(query) ||
        exam.full_name?.toLowerCase().includes(query) ||
        exam.description?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && exam.active) ||
        (statusFilter === "inactive" && !exam.active);

      return matchesSearch && matchesStatus;
    });
  }, [exams, search, statusFilter]);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openAddModal() {
    setEditingExam(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(exam) {
    setEditingExam(exam);

    setForm({
      id: exam.id || "",
      name: exam.name || "",
      full_name: exam.full_name || "",
      description: exam.description || "",
      logo_url: exam.logo_url || "",
      active: exam.active ?? true,
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingExam(null);
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
    const name = form.name.trim();

    if (!id) {
      setError("Exam ID is required.");
      return;
    }

    if (!name) {
      setError("Exam name is required.");
      return;
    }

    try {
      setSaving(true);

      if (editingExam) {
        // --------------------------------------------
        // UPDATE
        // --------------------------------------------

        const { error: updateError } = await supabase
          .from("exams")
          .update({
            name,
            full_name: form.full_name.trim() || null,
            description: form.description.trim() || null,
            logo_url: form.logo_url.trim() || null,
            active: form.active,
          })
          .eq("id", editingExam.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Exam updated successfully.");
      } else {
        // --------------------------------------------
        // INSERT
        // --------------------------------------------

        const { error: insertError } = await supabase
          .from("exams")
          .insert({
            id,
            name,
            full_name: form.full_name.trim() || null,
            description: form.description.trim() || null,
            logo_url: form.logo_url.trim() || null,
            active: form.active,
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess("Exam added successfully.");
      }

      await loadExams();

      setTimeout(() => {
        setModalOpen(false);
        setEditingExam(null);
        setForm(emptyForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Error saving exam:", err);

      if (err.code === "23505") {
        setError(
          "An exam with this ID already exists."
        );
      } else {
        setError(
          err.message || "Failed to save exam."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------

  async function toggleActive(exam) {
    try {
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("exams")
        .update({
          active: !exam.active,
        })
        .eq("id", exam.id);

      if (updateError) {
        throw updateError;
      }

      setExams((previous) =>
        previous.map((item) =>
          item.id === exam.id
            ? {
                ...item,
                active: !item.active,
              }
            : item
        )
      );

      setSuccess(
        exam.active
          ? "Exam deactivated."
          : "Exam activated."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Error updating exam status:", err);
      setError(
        err.message || "Failed to update exam status."
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
            Exams
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748B",
              fontSize: "14px",
            }}
          >
            Manage exams available in Exam Quiz Hub.
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
            onClick={loadExams}
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
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            style={{
              border: "none",
              background: "#003B82",
              color: "#FFFFFF",
              borderRadius: "10px",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <Plus size={18} />
            Add Exam
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
          icon={<BookOpen size={22} />}
          label="Total Exams"
          value={totalExams}
          iconBg="#E8F1FF"
          iconColor="#003B82"
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Active"
          value={activeExams}
          iconBg="#ECFDF5"
          iconColor="#059669"
        />

        <StatCard
          icon={<CircleOff size={22} />}
          label="Inactive"
          value={inactiveExams}
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
        <div
          style={{
            position: "relative",
            flex: "1 1 300px",
          }}
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
            }}
          />

          <input
            type="text"
            placeholder="Search by ID, name or description..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 12px 11px 40px",
              border: "1px solid #D7E0EA",
              borderRadius: "9px",
              outline: "none",
              fontSize: "14px",
              color: "#10233F",
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          style={{
            minWidth: "150px",
            padding: "11px 12px",
            border: "1px solid #D7E0EA",
            borderRadius: "9px",
            background: "#FFFFFF",
            color: "#10233F",
            fontSize: "14px",
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
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
            <Loader2
              size={20}
              style={{
                animation: "spin 1s linear infinite",
              }}
            />
            Loading exams...
          </div>
        ) : filteredExams.length === 0 ? (
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
            <BookOpen size={32} />
            <strong>No exams found</strong>
            <span style={{ fontSize: "14px" }}>
              Try changing your search or status filter.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "850px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderBottom:
                      "1px solid #E2E8F0",
                  }}
                >
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Exam</th>
                  <th style={thStyle}>Full Name</th>
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
                {filteredExams.map((exam) => (
                  <tr
                    key={exam.id}
                    style={{
                      borderBottom:
                        "1px solid #EEF2F7",
                    }}
                  >
                    <td style={tdStyle}>
                      <code
                        style={{
                          background: "#F1F5F9",
                          padding: "4px 7px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#334155",
                        }}
                      >
                        {exam.id}
                      </code>
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#10233F",
                        }}
                      >
                        {exam.name}
                      </div>

                      {exam.description && (
                        <div
                          style={{
                            marginTop: "4px",
                            color: "#64748B",
                            fontSize: "12px",
                            maxWidth: "320px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {exam.description}
                        </div>
                      )}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        color: "#475569",
                      }}
                    >
                      {exam.full_name || "—"}
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "5px 9px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: exam.active
                            ? "#ECFDF5"
                            : "#F1F5F9",
                          color: exam.active
                            ? "#047857"
                            : "#64748B",
                        }}
                      >
                        {exam.active
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
                          gap: "8px",
                        }}
                      >
                        <ActionButton
                          title="Edit exam"
                          onClick={() =>
                            openEditModal(exam)
                          }
                        >
                          <Pencil size={16} />
                        </ActionButton>

                        <ActionButton
                          title={
                            exam.active
                              ? "Deactivate exam"
                              : "Activate exam"
                          }
                          onClick={() =>
                            toggleActive(exam)
                          }
                          danger={exam.active}
                        >
                          <Power size={16} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
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
          Showing {filteredExams.length} of{" "}
          {totalExams} exams
        </div>
      )}

      {/* MODAL */}

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
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
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: "16px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.18)",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                padding: "20px 22px",
                borderBottom:
                  "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    color: "#10233F",
                  }}
                >
                  {editingExam
                    ? "Edit Exam"
                    : "Add Exam"}
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#64748B",
                    fontSize: "13px",
                  }}
                >
                  {editingExam
                    ? "Update exam information."
                    : "Create a new exam."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={{
                  border: "none",
                  background: "#F1F5F9",
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  color: "#475569",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  padding: "22px",
                  display: "grid",
                  gap: "16px",
                }}
              >
                {error && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      border:
                        "1px solid #FECACA",
                      color: "#B91C1C",
                      borderRadius: "9px",
                      padding: "11px 12px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </div>
                )}

                <Field
                  label="Exam ID"
                  required
                  hint={
                    editingExam
                      ? "Exam ID cannot be changed."
                      : "Use a unique ID such as tnpsc or rrb-ntpc."
                  }
                >
                  <input
                    name="id"
                    value={form.id}
                    onChange={handleChange}
                    disabled={!!editingExam}
                    placeholder="e.g. tnpsc"
                    style={inputStyle}
                  />
                </Field>

                <Field
                  label="Exam Name"
                  required
                >
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. TNPSC"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Full Name">
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Tamil Nadu Public Service Commission"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter a short description..."
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </Field>

                <Field label="Logo URL">
                  <input
                    name="logo_url"
                    value={form.logo_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </Field>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    color: "#10233F",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    style={{
                      width: "17px",
                      height: "17px",
                    }}
                  />

                  Active Exam
                </label>
              </div>

              {/* MODAL FOOTER */}

              <div
                style={{
                  padding: "16px 22px",
                  borderTop:
                    "1px solid #E2E8F0",
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
                    border:
                      "1px solid #D7E0EA",
                    background: "#FFFFFF",
                    color: "#334155",
                    borderRadius: "9px",
                    padding: "10px 16px",
                    fontWeight: 600,
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
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
                    borderRadius: "9px",
                    padding: "10px 18px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {saving && (
                    <Loader2
                      size={16}
                      style={{
                        animation:
                          "spin 1s linear infinite",
                      }}
                    />
                  )}

                  {editingExam
                    ? "Save Changes"
                    : "Add Exam"}
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
// SMALL COMPONENTS
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
        border: "1px solid #E2E8F0",
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

function Field({ label, required, hint, children }) {
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
          <span style={{ color: "#DC2626" }}>
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
        border: "1px solid #D7E0EA",
        background: "#FFFFFF",
        color: danger ? "#DC2626" : "#003B82",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
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
  border: "1px solid #D7E0EA",
  borderRadius: "9px",
  outline: "none",
  fontSize: "14px",
  color: "#10233F",
  background: "#FFFFFF",
};

export default AdminExams;