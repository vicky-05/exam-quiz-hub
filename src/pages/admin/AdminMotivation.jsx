import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CircleOff,
  Edit3,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const PAGE_SIZE = 20;

const emptyForm = {
  day_number: "",
  person_name: "",
  person_title: "",
  quote: "",
  story: "",
  active: true,
};

function AdminMotivation() {
  const [motivations, setMotivations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [totalCount, setTotalCount] =
    useState(0);

  const [showModal, setShowModal] =
    useState(false);

  const [editingMotivation, setEditingMotivation] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [deleteId, setDeleteId] =
    useState(null);

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalCount / PAGE_SIZE
    )
  );

  const from =
    (page - 1) * PAGE_SIZE;

  const to =
    from + PAGE_SIZE - 1;

  // ==========================================
  // LOAD MOTIVATIONS
  // ==========================================

  async function loadMotivations() {
    try {
      setLoading(true);
      setError("");

      let query = supabase
        .from("daily_motivation")
        .select(
          `
            id,
            day_number,
            person_name,
            person_title,
            quote,
            story,
            active,
            created_at,
            updated_at
          `,
          {
            count: "exact",
          }
        )
        .order("day_number", {
          ascending: true,
        })
        .range(from, to);

      if (search.trim()) {
        const value =
          search.trim();

        query = query.or(
          `person_name.ilike.%${value}%,person_title.ilike.%${value}%,quote.ilike.%${value}%`
        );
      }

      if (
        statusFilter === "active"
      ) {
        query = query.eq(
          "active",
          true
        );
      }

      if (
        statusFilter === "inactive"
      ) {
        query = query.eq(
          "active",
          false
        );
      }

      const {
        data,
        error: fetchError,
        count,
      } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setMotivations(
        data || []
      );

      setTotalCount(
        count || 0
      );
    } catch (err) {
      console.error(
        "Error loading motivation:",
        err
      );

      setError(
        err.message ||
          "Failed to load motivation."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMotivations();
  }, [
    page,
    search,
    statusFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
  ]);

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  function openAddModal() {
    setEditingMotivation(
      null
    );

    setForm({
      ...emptyForm,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  }

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  function openEditModal(item) {
    setEditingMotivation(
      item
    );

    setForm({
      day_number:
        item.day_number ??
        "",
      person_name:
        item.person_name ||
        "",
      person_title:
        item.person_title ||
        "",
      quote:
        item.quote ||
        "",
      story:
        item.story ||
        "",
      active:
        item.active !== false,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingMotivation(
      null
    );
    setForm({
      ...emptyForm,
    });
    setError("");
  }

  // ==========================================
  // FORM CHANGE
  // ==========================================

  function updateForm(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==========================================
  // SAVE
  // ==========================================

  async function handleSave(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const dayNumber =
        Number(
          form.day_number
        );

      if (
        !Number.isInteger(
          dayNumber
        ) ||
        dayNumber <= 0
      ) {
        throw new Error(
          "Day number must be a positive whole number."
        );
      }

      if (
        !form.person_name.trim()
      ) {
        throw new Error(
          "Person name is required."
        );
      }

      if (!form.quote.trim()) {
        throw new Error(
          "Quote is required."
        );
      }

      if (!form.story.trim()) {
        throw new Error(
          "Story is required."
        );
      }

      const payload = {
        day_number:
          dayNumber,

        person_name:
          form.person_name.trim(),

        person_title:
          form.person_title.trim() ||
          null,

        quote:
          form.quote.trim(),

        story:
          form.story.trim(),

        active:
          form.active,
      };

      if (
        editingMotivation
      ) {
        const {
          error: updateError,
        } = await supabase
          .from(
            "daily_motivation"
          )
          .update({
            ...payload,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            editingMotivation.id
          );

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Motivation updated successfully."
        );
      } else {
        const {
          error: insertError,
        } = await supabase
          .from(
            "daily_motivation"
          )
          .insert(
            payload
          );

        if (insertError) {
          if (
            insertError.code ===
            "23505"
          ) {
            throw new Error(
              "This day number already exists."
            );
          }

          throw insertError;
        }

        setSuccess(
          "Motivation added successfully."
        );
      }

      setShowModal(false);

      setEditingMotivation(
        null
      );

      setForm({
        ...emptyForm,
      });

      await loadMotivations();
    } catch (err) {
      console.error(
        "Error saving motivation:",
        err
      );

      setError(
        err.message ||
          "Failed to save motivation."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // TOGGLE ACTIVE
  // ==========================================

  async function toggleActive(
    item
  ) {
    const action =
      item.active
        ? "deactivate"
        : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} Day ${item.day_number}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const {
        error: updateError,
      } = await supabase
        .from(
          "daily_motivation"
        )
        .update({
          active:
            !item.active,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          item.id
        );

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        `Day ${item.day_number} ${action}d successfully.`
      );

      await loadMotivations();
    } catch (err) {
      console.error(
        "Error updating motivation status:",
        err
      );

      setError(
        err.message ||
          "Failed to update status."
      );
    }
  }

  // ==========================================
  // DELETE
  // ==========================================

  async function handleDelete(
    item
  ) {
    const confirmed =
      window.confirm(
        `Delete Day ${item.day_number} motivation permanently?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteId(
        item.id
      );

      setError("");
      setSuccess("");

      const {
        error: deleteError,
      } = await supabase
        .from(
          "daily_motivation"
        )
        .delete()
        .eq(
          "id",
          item.id
        );

      if (deleteError) {
        throw deleteError;
      }

      setSuccess(
        `Day ${item.day_number} deleted successfully.`
      );

      await loadMotivations();
    } catch (err) {
      console.error(
        "Error deleting motivation:",
        err
      );

      setError(
        err.message ||
          "Failed to delete motivation."
      );
    } finally {
      setDeleteId(null);
    }
  }

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  function clearFilters() {
    setSearch("");
    setStatusFilter(
      "all"
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      style={{
        padding:
          "28px",
        background:
          "#F7F9FC",
        minHeight:
          "100vh",
      }}
    >
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap:
            "16px",
          marginBottom:
            "22px",
          flexWrap:
            "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color:
                "#10233F",
              fontSize:
                "28px",
              fontWeight:
                700,
            }}
          >
            Motivation & Content
          </h1>

          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "#667085",
              fontSize:
                "14px",
            }}
          >
            Manage daily motivation
            and inspirational content.
          </p>
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              "10px",
          }}
        >
          <button
            onClick={
              loadMotivations
            }
            disabled={
              loading
            }
            style={
              secondaryButton
            }
          >
            <RefreshCw
              size={16}
            />
            Refresh
          </button>

          <button
            onClick={
              openAddModal
            }
            style={
              primaryButton
            }
          >
            <Plus
              size={17}
            />
            Add Motivation
          </button>
        </div>
      </div>

      {/* ====================================== */}
      {/* ALERTS */}
      {/* ====================================== */}

      {error && !showModal && (
        <div
          style={
            errorBox
          }
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={
            successBox
          }
        >
          {success}
        </div>
      )}

      {/* ====================================== */}
      {/* STATS */}
      {/* ====================================== */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap:
            "16px",
          marginBottom:
            "20px",
        }}
      >
        <StatCard
          icon={
            <BookOpen
              size={22}
            />
          }
          title="Total Motivation"
          value={
            totalCount
          }
        />

        <StatCard
          icon={
            <CheckCircle2
              size={22}
            />
          }
          title="Active"
          value={
            motivations.filter(
              (item) =>
                item.active
            ).length
          }
        />

        <StatCard
          icon={
            <CircleOff
              size={22}
            />
          }
          title="Inactive"
          value={
            motivations.filter(
              (item) =>
                !item.active
            ).length
          }
        />
      </div>

      {/* ====================================== */}
      {/* FILTERS */}
      {/* ====================================== */}

      <div
        style={{
          background:
            "#FFFFFF",
          border:
            "1px solid #E4E7EC",
          borderRadius:
            "10px",
          padding:
            "16px",
          marginBottom:
            "18px",
        }}
      >
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(250px, 1fr) 180px auto",
            gap:
              "10px",
          }}
        >
          <div
            style={{
              position:
                "relative",
            }}
          >
            <Search
              size={17}
              style={{
                position:
                  "absolute",
                left:
                  "12px",
                top:
                  "50%",
                transform:
                  "translateY(-50%)",
                color:
                  "#98A2B3",
              }}
            />

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search person, title or quote..."
              style={{
                ...inputStyle,
                paddingLeft:
                  "38px",
              }}
            />
          </div>

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value
              )
            }
            style={
              inputStyle
            }
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

          <button
            onClick={
              clearFilters
            }
            style={
              clearButton
            }
          >
            Clear
          </button>
        </div>
      </div>

      {/* ====================================== */}
      {/* TABLE */}
      {/* ====================================== */}

      <div
        style={{
          background:
            "#FFFFFF",
          border:
            "1px solid #E4E7EC",
          borderRadius:
            "10px",
          overflow:
            "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding:
                "60px",
              display:
                "flex",
              justifyContent:
                "center",
              color:
                "#667085",
            }}
          >
            <Loader2
              size={26}
              style={{
                animation:
                  "adminMotivationSpin 1s linear infinite",
              }}
            />
          </div>
        ) : motivations.length ===
          0 ? (
          <div
            style={{
              padding:
                "60px",
              textAlign:
                "center",
              color:
                "#667085",
            }}
          >
            <BookOpen
              size={35}
              style={{
                color:
                  "#98A2B3",
                marginBottom:
                  "10px",
              }}
            />

            <div
              style={{
                fontWeight:
                  600,
                color:
                  "#344054",
                marginBottom:
                  "5px",
              }}
            >
              No motivation found
            </div>

            <div
              style={{
                fontSize:
                  "13px",
              }}
            >
              Add your first daily
              motivation.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "1100px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#F9FAFB",
                      borderBottom:
                        "1px solid #E4E7EC",
                    }}
                  >
                    <th
                      style={
                        thStyle
                      }
                    >
                      Day
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Person
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Quote
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
                      Story
                    </th>

                    <th
                      style={
                        thStyle
                      }
                    >
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
                  {motivations.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                        style={{
                          borderBottom:
                            "1px solid #EAECF0",
                        }}
                      >
                        {/* DAY */}
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              700,
                            color:
                              "#003B82",
                          }}
                        >
                          Day{" "}
                          {
                            item.day_number
                          }
                        </td>

                        {/* PERSON */}
                        <td
                          style={
                            tdStyle
                          }
                        >
                          <div
                            style={{
                              fontWeight:
                                600,
                              color:
                                "#10233F",
                            }}
                          >
                            {
                              item.person_name
                            }
                          </div>

                          {item.person_title && (
                            <div
                              style={{
                                marginTop:
                                  "4px",
                                color:
                                  "#667085",
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                item.person_title
                              }
                            </div>
                          )}
                        </td>

                        {/* QUOTE */}
                        <td
                          style={{
                            ...tdStyle,
                            maxWidth:
                              "350px",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#344054",
                              lineHeight:
                                1.5,
                              display:
                                "-webkit-box",
                              WebkitLineClamp:
                                3,
                              WebkitBoxOrient:
                                "vertical",
                              overflow:
                                "hidden",
                            }}
                          >
                            "
                            {
                              item.quote
                            }
                            "
                          </div>
                        </td>

                        {/* STORY */}
                        <td
                          style={{
                            ...tdStyle,
                            maxWidth:
                              "350px",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#667085",
                              lineHeight:
                                1.5,
                              display:
                                "-webkit-box",
                              WebkitLineClamp:
                                3,
                              WebkitBoxOrient:
                                "vertical",
                              overflow:
                                "hidden",
                            }}
                          >
                            {
                              item.story
                            }
                          </div>
                        </td>

                        {/* STATUS */}
                        <td
                          style={
                            tdStyle
                          }
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              padding:
                                "5px 9px",
                              borderRadius:
                                "999px",
                              background:
                                item.active
                                  ? "#ECFDF3"
                                  : "#F2F4F7",
                              color:
                                item.active
                                  ? "#027A48"
                                  : "#667085",
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                            }}
                          >
                            {item.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* ACTIONS */}
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
                              gap:
                                "7px",
                            }}
                          >
                            {/* EDIT */}
                            <button
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                              title="Edit"
                              style={
                                iconButtonStyle
                              }
                            >
                              <Edit3
                                size={16}
                              />
                            </button>

                            {/* ACTIVE */}
                            <button
                              onClick={() =>
                                toggleActive(
                                  item
                                )
                              }
                              title={
                                item.active
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              style={
                                iconButtonStyle
                              }
                            >
                              <Power
                                size={16}
                              />
                            </button>

                            {/* DELETE */}
                            <button
                              onClick={() =>
                                handleDelete(
                                  item
                                )
                              }
                              disabled={
                                deleteId ===
                                item.id
                              }
                              title="Delete"
                              style={{
                                ...iconButtonStyle,
                                color:
                                  "#BE123C",
                              }}
                            >
                              {deleteId ===
                              item.id ? (
                                <Loader2
                                  size={
                                    16
                                  }
                                  style={{
                                    animation:
                                      "adminMotivationSpin 1s linear infinite",
                                  }}
                                />
                              ) : (
                                <Trash2
                                  size={
                                    16
                                  }
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div
              style={{
                padding:
                  "13px 16px",
                borderTop:
                  "1px solid #EAECF0",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap:
                  "12px",
                flexWrap:
                  "wrap",
              }}
            >
              <span
                style={{
                  color:
                    "#667085",
                  fontSize:
                    "13px",
                }}
              >
                Showing{" "}
                {from + 1}–
                {Math.min(
                  from +
                    motivations.length,
                  totalCount
                )}{" "}
                of{" "}
                {totalCount}
              </span>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                }}
              >
                <button
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      Math.max(
                        1,
                        page - 1
                      )
                    )
                  }
                  style={{
                    ...paginationButton,
                    opacity:
                      page <=
                      1
                        ? 0.5
                        : 1,
                  }}
                >
                  Previous
                </button>

                <span
                  style={{
                    minWidth:
                      "70px",
                    textAlign:
                      "center",
                    fontSize:
                      "13px",
                    color:
                      "#344054",
                  }}
                >
                  {page} /{" "}
                  {
                    totalPages
                  }
                </span>

                <button
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      Math.min(
                        totalPages,
                        page +
                          1
                      )
                    )
                  }
                  style={{
                    ...paginationButton,
                    opacity:
                      page >=
                      totalPages
                        ? 0.5
                        : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ====================================== */}
      {/* ADD / EDIT MODAL */}
      {/* ====================================== */}

      {showModal && (
        <div
          style={
            modalOverlay
          }
        >
          <div
            style={
              modalBox
            }
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding:
                  "18px 20px",
                borderBottom:
                  "1px solid #EAECF0",
                display:
                  "flex",
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
                    color:
                      "#10233F",
                    fontSize:
                      "20px",
                  }}
                >
                  {editingMotivation
                    ? "Edit Motivation"
                    : "Add Motivation"}
                </h2>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    color:
                      "#667085",
                    fontSize:
                      "13px",
                  }}
                >
                  {editingMotivation
                    ? "Update this daily motivation."
                    : "Create a new daily motivation."}
                </p>
              </div>

              <button
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                style={
                  closeButton
                }
              >
                <X
                  size={20}
                />
              </button>
            </div>

            {/* MODAL BODY */}
            <form
              onSubmit={
                handleSave
              }
            >
              <div
                style={{
                  padding:
                    "20px",
                  display:
                    "grid",
                  gap:
                    "16px",
                }}
              >
                {error && (
                  <div
                    style={
                      errorBox
                    }
                  >
                    {error}
                  </div>
                )}

                {/* DAY */}
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Day Number *
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.day_number
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "day_number",
                        event.target
                          .value
                      )
                    }
                    placeholder="Example: 1"
                    style={
                      inputStyle
                    }
                    required
                  />
                </div>

                {/* PERSON NAME + TITLE */}
                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap:
                      "12px",
                  }}
                >
                  <div>
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Person Name *
                    </label>

                    <input
                      value={
                        form.person_name
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "person_name",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Example: Dr. A.P.J. Abdul Kalam"
                      style={
                        inputStyle
                      }
                      required
                    />
                  </div>

                  <div>
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Person Title
                    </label>

                    <input
                      value={
                        form.person_title
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "person_title",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Example: Former President of India"
                      style={
                        inputStyle
                      }
                    />
                  </div>
                </div>

                {/* QUOTE */}
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Quote *
                  </label>

                  <textarea
                    value={
                      form.quote
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "quote",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Enter the motivational quote..."
                    rows={4}
                    style={
                      textareaStyle
                    }
                    required
                  />
                </div>

                {/* STORY */}
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Story *
                  </label>

                  <textarea
                    value={
                      form.story
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "story",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Enter the motivational story..."
                    rows={7}
                    style={
                      textareaStyle
                    }
                    required
                  />
                </div>

                {/* ACTIVE */}
                <label
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "9px",
                    cursor:
                      "pointer",
                    color:
                      "#344054",
                    fontSize:
                      "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      form.active
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "active",
                        event
                          .target
                          .checked
                      )
                    }
                  />

                  Active
                </label>
              </div>

              {/* MODAL FOOTER */}
              <div
                style={{
                  padding:
                    "14px 20px",
                  borderTop:
                    "1px solid #EAECF0",
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
                  style={
                    cancelButton
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  style={{
                    ...primaryButton,
                    opacity:
                      saving
                        ? 0.7
                        : 1,
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        style={{
                          animation:
                            "adminMotivationSpin 1s linear infinite",
                        }}
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={16}
                      />

                      {editingMotivation
                        ? "Save Changes"
                        : "Add Motivation"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes adminMotivationSpin {
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

// ==============================================
// STAT CARD
// ==============================================

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#FFFFFF",
        border:
          "1px solid #E4E7EC",
        borderRadius:
          "10px",
        padding:
          "18px",
        display:
          "flex",
        alignItems:
          "center",
        gap:
          "14px",
      }}
    >
      <div
        style={{
          width:
            "42px",
          height:
            "42px",
          borderRadius:
            "9px",
          background:
            "#EAF4FF",
          color:
            "#003B82",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color:
              "#667085",
            fontSize:
              "13px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop:
              "3px",
            color:
              "#10233F",
            fontSize:
              "24px",
            fontWeight:
              700,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ==============================================
// STYLES
// ==============================================

const inputStyle = {
  width:
    "100%",
  boxSizing:
    "border-box",
  height:
    "42px",
  border:
    "1px solid #D0D5DD",
  borderRadius:
    "8px",
  padding:
    "0 12px",
  background:
    "#FFFFFF",
  color:
    "#10233F",
  outline:
    "none",
  fontSize:
    "14px",
};

const textareaStyle = {
  ...inputStyle,
  height:
    "auto",
  minHeight:
    "100px",
  padding:
    "10px 12px",
  resize:
    "vertical",
  lineHeight:
    "1.5",
};

const labelStyle = {
  display:
    "block",
  marginBottom:
    "6px",
  color:
    "#344054",
  fontSize:
    "13px",
  fontWeight:
    600,
};

const thStyle = {
  padding:
    "12px 16px",
  textAlign:
    "left",
  color:
    "#667085",
  fontSize:
    "12px",
  fontWeight:
    600,
  textTransform:
    "uppercase",
  letterSpacing:
    "0.03em",
  whiteSpace:
    "nowrap",
};

const tdStyle = {
  padding:
    "14px 16px",
  color:
    "#344054",
  fontSize:
    "14px",
  verticalAlign:
    "middle",
};

const primaryButton = {
  border:
    "none",
  background:
    "#003B82",
  color:
    "#FFFFFF",
  padding:
    "10px 16px",
  borderRadius:
    "8px",
  cursor:
    "pointer",
  display:
    "flex",
  alignItems:
    "center",
  gap:
    "7px",
  fontWeight:
    600,
};

const secondaryButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#10233F",
  padding:
    "10px 14px",
  borderRadius:
    "8px",
  cursor:
    "pointer",
  display:
    "flex",
  alignItems:
    "center",
  gap:
    "7px",
  fontWeight:
    600,
};

const clearButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#344054",
  padding:
    "0 14px",
  borderRadius:
    "8px",
  cursor:
    "pointer",
};

const iconButtonStyle = {
  width:
    "34px",
  height:
    "34px",
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#475467",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
};

const paginationButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#344054",
  padding:
    "7px 11px",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  fontSize:
    "12px",
};

const cancelButton = {
  border:
    "1px solid #D0D5DD",
  background:
    "#FFFFFF",
  color:
    "#344054",
  padding:
    "10px 16px",
  borderRadius:
    "8px",
  cursor:
    "pointer",
};

const closeButton = {
  border:
    "none",
  background:
    "transparent",
  color:
    "#667085",
  cursor:
    "pointer",
};

const errorBox = {
  background:
    "#FFF1F2",
  border:
    "1px solid #FECDD3",
  color:
    "#BE123C",
  padding:
    "12px 14px",
  borderRadius:
    "8px",
  marginBottom:
    "18px",
};

const successBox = {
  background:
    "#ECFDF3",
  border:
    "1px solid #ABEFC6",
  color:
    "#027A48",
  padding:
    "12px 14px",
  borderRadius:
    "8px",
  marginBottom:
    "18px",
};

const modalOverlay = {
  position:
    "fixed",
  inset: 0,
  background:
    "rgba(16, 35, 63, 0.45)",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  padding:
    "20px",
  zIndex: 1000,
};

const modalBox = {
  width:
    "100%",
  maxWidth:
    "780px",
  maxHeight:
    "92vh",
  overflowY:
    "auto",
  background:
    "#FFFFFF",
  borderRadius:
    "12px",
  boxShadow:
    "0 20px 50px rgba(0,0,0,0.15)",
};

export default AdminMotivation;