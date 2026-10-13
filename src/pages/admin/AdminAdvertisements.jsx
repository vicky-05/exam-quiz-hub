
import { useCallback, useEffect, useState } from "react";
import {
  ImagePlus,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Megaphone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../services/supabase";

const BUCKET = "advertisement-banners";

const EMPTY_FORM = {
  title: "Premium Plan",
  description: "Take your exam preparation to the next level.",
  cta_text: "Explore Plans",
  target_url: "/dashboard/subscription",
  display_frequency: "session",
};

const AdminAdvertisements = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAdvertisements = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("advertisements")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAdvertisements(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdvertisements();
  }, [loadAdvertisements]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview("");
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const editAdvertisement = (ad) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title || "",
      description: ad.description || "",
      cta_text: ad.cta_text || "Explore Plans",
      target_url: ad.target_url || "/dashboard/subscription",
      display_frequency: ad.display_frequency || "session",
    });
    setFile(null);
    setPreview(ad.image_url || "");
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveAdvertisement = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!editingId && !file) {
      setError("Please select a banner image.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter an advertisement title.");
      return;
    }

    if (!form.target_url.trim()) {
      setError("Please enter a destination URL.");
      return;
    }

    if (
      !form.target_url.startsWith("/") &&
      !/^https?:\/\//i.test(form.target_url)
    ) {
      setError("Use a local path such as /plans or a valid https:// URL.");
      return;
    }

    if (file && !file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      setError("The banner image must be 5 MB or smaller.");
      return;
    }

    setSaving(true);

    let uploadedPath = null;

    try {
      let imageUrl = preview;

      if (file) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        uploadedPath = filePath;

        const { data: publicData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(filePath);

        imageUrl = publicData.publicUrl;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        image_url: imageUrl,
        cta_text: form.cta_text.trim() || "Explore Plans",
        target_url: form.target_url.trim(),
        display_frequency: form.display_frequency,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("advertisements")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("advertisements")
          .insert({ ...payload, is_active: false });

        if (insertError) throw insertError;
      }

      setSuccess(
        editingId
          ? "Advertisement updated successfully."
          : "Banner uploaded successfully. Activate it when you're ready to publish."
      );

      resetForm();
      setSuccess(
        editingId
          ? "Advertisement updated successfully."
          : "Banner uploaded successfully. Activate it when you're ready to publish."
      );
      await loadAdvertisements();
    } catch (err) {
      // Clean up a newly uploaded image if saving its database record failed.
      if (uploadedPath) {
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
      }

      setError(err.message || "Unable to save the advertisement.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAdvertisement = async (ad) => {
    setError("");
    setSuccess("");

    try {
      if (!ad.is_active) {
        // Ensure only one advertisement is active at a time.
        const { error: deactivateError } = await supabase
          .from("advertisements")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("is_active", true);

        if (deactivateError) throw deactivateError;
      }

      const { error: updateError } = await supabase
        .from("advertisements")
        .update({
          is_active: !ad.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ad.id);

      if (updateError) throw updateError;

      setSuccess(
        ad.is_active
          ? "Advertisement deactivated."
          : "Advertisement activated and published."
      );

      await loadAdvertisements();
    } catch (err) {
      setError(err.message || "Unable to change advertisement status.");
    }
  };

  const deleteAdvertisement = async (ad) => {
    const confirmed = window.confirm(
      `Delete "${ad.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", ad.id);

      if (deleteError) throw deleteError;

      // Remove the old image from Storage when possible.
      try {
        const url = new URL(ad.image_url);
        const marker = `/${BUCKET}/`;
        const index = url.pathname.indexOf(marker);

        if (index !== -1) {
          const storagePath = decodeURIComponent(
            url.pathname.slice(index + marker.length)
          );

          if (storagePath) {
            await supabase.storage.from(BUCKET).remove([storagePath]);
          }
        }
      } catch (storageError) {
        console.warn("Could not remove the old banner image:", storageError);
      }

      if (editingId === ad.id) resetForm();

      setSuccess("Advertisement deleted.");
      await loadAdvertisements();
    } catch (err) {
      setError(err.message || "Unable to delete the advertisement.");
    }
  };

  const activeCount = advertisements.filter((ad) => ad.is_active).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="text-blue-600" size={26} />
            <h1 className="text-2xl font-bold text-slate-900">
              Advertisement Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Upload and manage promotional banners shown to website visitors.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAdvertisements}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total banners</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {advertisements.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active banners</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Inactive banners</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">
            {advertisements.length - activeCount}
          </p>
        </div>
      </div>

      {(error || success) && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
          <span>{error || success}</span>
        </div>
      )}

      <form
        onSubmit={saveAdvertisement}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Edit advertisement" : "Upload a new banner"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            New advertisements start inactive, so you can preview them before
            publishing.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Banner image {!editingId && "*"}
              <span className="mt-1 block font-normal text-slate-500">
                JPG, PNG, WebP or another supported image type · Max 5 MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="mt-3 block w-full rounded-xl border border-slate-200 p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700"
              />
            </label>

            {preview ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={preview}
                  alt="Advertisement preview"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <ImagePlus size={36} />
                <p className="mt-2 text-sm">Banner preview appears here</p>
              </div>
            )}

            <label className="block text-sm font-semibold text-slate-700">
              Advertisement title *
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                required
                maxLength={150}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Unlock Premium Access"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows={3}
                maxLength={500}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Short promotional message"
              />
            </label>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              CTA button text
              <input
                name="cta_text"
                value={form.cta_text}
                onChange={updateField}
                maxLength={60}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Explore Plans"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Destination URL *
              <input
                name="target_url"
                value={form.target_url}
                onChange={updateField}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="/plans or https://example.com"
              />
              <span className="mt-1 block font-normal text-slate-500">
                Use a local route or a complete HTTPS URL.
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Display frequency
              <select
                name="display_frequency"
                value={form.display_frequency}
                onChange={updateField}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="session">Once per browser session</option>
                <option value="every_visit">Every page visit</option>
              </select>
            </label>

            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Publishing behavior</p>
              <p className="mt-1">
                Only the active advertisement is shown publicly. Activating
                one banner automatically deactivates the currently active
                banner.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload size={17} />
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Upload banner"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Your advertisements
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Activate a banner to publish it on the website.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading advertisements...
          </div>
        ) : advertisements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ImagePlus className="mx-auto text-slate-400" size={40} />
            <p className="mt-3 font-semibold text-slate-800">
              No advertisements yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Upload your first premium plan banner above.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {advertisements.map((ad) => (
              <article
                key={ad.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-video bg-slate-100">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                      ad.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {ad.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{ad.title}</h3>
                    {ad.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {ad.description}
                      </p>
                    )}
                  </div>

                  <p className="break-all text-xs text-slate-500">
                    CTA: {ad.cta_text} ·{" "}
                    {ad.display_frequency === "every_visit"
                      ? "Every visit"
                      : "Once per session"}
                  </p>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleAdvertisement(ad)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                        ad.is_active
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {ad.is_active ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                      {ad.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => editAdvertisement(ad)}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <a
                      href={ad.target_url}
                      target={ad.target_url.startsWith("http") ? "_blank" : undefined}
                      rel={ad.target_url.startsWith("http") ? "noreferrer" : undefined}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <ExternalLink size={14} />
                      Destination
                    </a>

                    <button
                      type="button"
                      onClick={() => deleteAdvertisement(ad)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAdvertisements;
