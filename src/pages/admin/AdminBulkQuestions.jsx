import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Database,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const REQUIRED_COLUMNS = [
  "test_id",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "question_type",
  "marks",
  "negative_marks",
  "display_order",
  "active",
];

const MAX_PREVIEW_ROWS = 100;

function AdminBulkQuestions() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);

  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  const [step, setStep] = useState("upload");

  const [loadingTests, setLoadingTests] = useState(true);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  /*
   * --------------------------------------------------
   * LOAD TESTS
   * --------------------------------------------------
   */

  async function loadTests() {
    try {
      setLoadingTests(true);

      const { data, error: testsError } = await supabase
        .from("tests")
        .select("id, title, set_number")
        .order("title", { ascending: true });

      if (testsError) {
        throw testsError;
      }

      setTests(data || []);
    } catch (err) {
      console.error("Tests loading failed:", err);

      setError(
        err?.message ||
          "Unable to load tests."
      );
    } finally {
      setLoadingTests(false);
    }
  }

  useEffect(() => {
    loadTests();
  }, []);

  /*
   * --------------------------------------------------
   * TEST MAP
   * --------------------------------------------------
   */

  const testMap = useMemo(() => {
    const map = {};

    tests.forEach((test) => {
      map[test.id] = test;
    });

    return map;
  }, [tests]);

  /*
   * --------------------------------------------------
   * CSV PARSER
   * --------------------------------------------------
   */

  function parseCSV(text) {
    const result = [];
    let row = [];
    let cell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && insideQuotes && next === '"') {
        cell += '"';
        i++;
        continue;
      }

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === "," && !insideQuotes) {
        row.push(cell);
        cell = "";
        continue;
      }

      if (
        (char === "\n" || char === "\r") &&
        !insideQuotes
      ) {
        if (char === "\r" && next === "\n") {
          i++;
        }

        row.push(cell);
        cell = "";

        if (
          row.some(
            (value) => value.trim() !== ""
          )
        ) {
          result.push(row);
        }

        row = [];
        continue;
      }

      cell += char;
    }

    row.push(cell);

    if (
      row.some(
        (value) => value.trim() !== ""
      )
    ) {
      result.push(row);
    }

    return result;
  }

  /*
   * --------------------------------------------------
   * FILE SELECT
   * --------------------------------------------------
   */

  function handleFileChange(event) {
    const selectedFile =
      event.target.files?.[0];

    setError("");
    setSuccess("");
    setErrors([]);
    setWarnings([]);
    setRows([]);
    setHeaders([]);
    setStep("upload");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "Please upload a CSV file."
      );

      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  /*
   * --------------------------------------------------
   * READ CSV
   * --------------------------------------------------
   */

  async function readCSV() {
    if (!file) {
      setError(
        "Please select a CSV file first."
      );
      return;
    }

    try {
      setValidating(true);
      setError("");
      setErrors([]);
      setWarnings([]);

      const text = await file.text();

      const parsed = parseCSV(text);

      if (parsed.length < 2) {
        throw new Error(
          "The CSV file must contain a header row and at least one question."
        );
      }

      const csvHeaders = parsed[0].map((header) =>
        header.trim().toLowerCase()
      );

      const missingColumns =
        REQUIRED_COLUMNS.filter(
          (column) =>
            !csvHeaders.includes(column)
        );

      if (missingColumns.length > 0) {
        setErrors([
          `Missing required columns: ${missingColumns.join(
            ", "
          )}`,
        ]);

        setStep("error");
        return;
      }

      const dataRows = parsed
        .slice(1)
        .map((values, index) => {
          const row = {
            _rowNumber: index + 2,
          };

          csvHeaders.forEach(
            (header, columnIndex) => {
              row[header] =
                values[columnIndex] ?? "";
            }
          );

          return row;
        });

      setHeaders(csvHeaders);
      setRows(dataRows);

      validateRows(dataRows);

      setStep("preview");
    } catch (err) {
      console.error(
        "CSV reading failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to read the CSV file."
      );

      setStep("error");
    } finally {
      setValidating(false);
    }
  }

  /*
   * --------------------------------------------------
   * VALIDATE ROWS
   * --------------------------------------------------
   */

  function validateRows(dataRows) {
    const rowErrors = [];
    const rowWarnings = [];

    const displayOrders = new Map();

    dataRows.forEach((row) => {
      const rowNumber =
        row._rowNumber;

      if (!row.test_id?.trim()) {
        rowErrors.push(
          `Row ${rowNumber}: test_id is required.`
        );
      } else if (!testMap[row.test_id.trim()]) {
        rowErrors.push(
          `Row ${rowNumber}: test_id "${row.test_id}" was not found.`
        );
      }

      if (!row.question_text?.trim()) {
        rowErrors.push(
          `Row ${rowNumber}: question_text is required.`
        );
      }

      if (!row.option_a?.trim()) {
        rowErrors.push(
          `Row ${rowNumber}: option_a is required.`
        );
      }

      if (!row.option_b?.trim()) {
        rowErrors.push(
          `Row ${rowNumber}: option_b is required.`
        );
      }

      if (!row.option_c?.trim()) {
        rowErrors.push(
          `Row ${rowNumber}: option_c is required.`
        );
      }

      if (!row.option_d?.trim()) {
        rowErrors.push(
          `Row ${rowNumber}: option_d is required.`
        );
      }

      const answer = Number(
        row.correct_answer
      );

      if (
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer > 3
      ) {
        rowErrors.push(
          `Row ${rowNumber}: correct_answer must be 0, 1, 2 or 3.`
        );
      }

      if (
        row.marks === "" ||
        Number.isNaN(Number(row.marks))
      ) {
        rowErrors.push(
          `Row ${rowNumber}: marks must be a valid number.`
        );
      }

      if (
        row.negative_marks === "" ||
        Number.isNaN(
          Number(row.negative_marks)
        )
      ) {
        rowErrors.push(
          `Row ${rowNumber}: negative_marks must be a valid number.`
        );
      }

      const displayOrder = Number(
        row.display_order
      );

      if (
        !Number.isInteger(displayOrder)
      ) {
        rowErrors.push(
          `Row ${rowNumber}: display_order must be a whole number.`
        );
      }

      const activeValue =
        String(row.active)
          .trim()
          .toLowerCase();

      if (
        !["true", "false"].includes(
          activeValue
        )
      ) {
        rowErrors.push(
          `Row ${rowNumber}: active must be true or false.`
        );
      }

      /*
       * Detect duplicate display orders
       * inside the uploaded file.
       */
      if (
        row.test_id &&
        Number.isInteger(displayOrder)
      ) {
        const key = `${row.test_id.trim()}-${displayOrder}`;

        if (displayOrders.has(key)) {
          rowErrors.push(
            `Row ${rowNumber}: duplicate display_order ${displayOrder} for the same test.`
          );
        } else {
          displayOrders.set(
            key,
            rowNumber
          );
        }
      }

      if (!row.question_type?.trim()) {
        rowWarnings.push(
          `Row ${rowNumber}: question_type is empty.`
        );
      }
    });

    setErrors(rowErrors);
    setWarnings(rowWarnings);

    return rowErrors.length === 0;
  }

  /*
   * --------------------------------------------------
   * VALID ROWS
   * --------------------------------------------------
   */

  const validRows = useMemo(() => {
    return rows.filter((row) => {
      const rowNumber =
        row._rowNumber;

      const rowHasError =
        errors.some((message) =>
          message.startsWith(
            `Row ${rowNumber}:`
          )
        );

      return !rowHasError;
    });
  }, [rows, errors]);

  /*
   * --------------------------------------------------
   * IMPORT
   * --------------------------------------------------
   */

  async function handleImport() {
    if (validRows.length === 0) {
      setError(
        "There are no valid questions to import."
      );
      return;
    }

    try {
      setImporting(true);
      setError("");
      setSuccess("");

      const payload = validRows.map(
        (row) => ({
          test_id: row.test_id.trim(),
          question_text:
            row.question_text.trim(),
          option_a: row.option_a.trim(),
          option_b: row.option_b.trim(),
          option_c: row.option_c.trim(),
          option_d: row.option_d.trim(),
          correct_answer: Number(
            row.correct_answer
          ),
          question_type:
            row.question_type?.trim() ||
            "mcq",
          marks: Number(row.marks),
          negative_marks: Number(
            row.negative_marks
          ),
          display_order: Number(
            row.display_order
          ),
          active:
            String(row.active)
              .trim()
              .toLowerCase() ===
            "true",
        })
      );

      const { data, error: insertError } =
        await supabase
          .from("questions")
          .insert(payload)
          .select("id");

      if (insertError) {
        throw insertError;
      }

      const importedCount =
        data?.length || payload.length;

      setSuccess(
        `${importedCount} question${
          importedCount === 1
            ? ""
            : "s"
        } imported successfully.`
      );

      setRows([]);
      setHeaders([]);
      setFile(null);
      setErrors([]);
      setWarnings([]);

      setStep("success");
    } catch (err) {
      console.error(
        "Bulk import failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to import questions."
      );
    } finally {
      setImporting(false);
    }
  }

  /*
   * --------------------------------------------------
   * DOWNLOAD TEMPLATE
   * --------------------------------------------------
   */

  function downloadTemplate() {
    const header =
      REQUIRED_COLUMNS.join(",");

    const example =
      'TEST-ID-HERE,"Example question?","Option A","Option B","Option C","Option D",0,"mcq",1,0,1,true';

    const csv =
      `${header}\n${example}\n`;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "exam-quiz-question-template.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }

  /*
   * --------------------------------------------------
   * RESET
   * --------------------------------------------------
   */

  function resetUpload() {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setErrors([]);
    setWarnings([]);
    setError("");
    setSuccess("");
    setStep("upload");
  }

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* HEADER */}

      <section>
        <button
          type="button"
          onClick={() =>
            navigate("/admin/questions")
          }
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#003B82] transition hover:text-[#009FE3]"
        >
          <ArrowLeft size={17} />
          Back to Question Bank
        </button>

        <p className="text-sm font-semibold text-[#009FE3]">
          Question Bank
        </p>

        <h1 className="mt-1 text-2xl font-extrabold text-[#10233F] sm:text-3xl">
          Bulk Question Upload
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Import multiple questions from a CSV file.
        </p>
      </section>

      {/* SUCCESS */}

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* STEP 1 - UPLOAD */}
      {/* ------------------------------------------------ */}

      {step === "upload" && (
        <>
          {/* Upload card */}

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="font-extrabold text-[#10233F]">
                Upload CSV
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a CSV file containing your questions.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-[#009FE3]">
              <Upload
                size={40}
                className="mx-auto text-[#009FE3]"
              />

              <h3 className="mt-4 font-bold text-[#10233F]">
                Choose your CSV file
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                CSV files only
              </p>

              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#003B82] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#002F68]">
                <Upload size={17} />
                Select CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm">
                  <FileText
                    size={22}
                    className="shrink-0 text-[#003B82]"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#10233F]">
                      {file.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {(
                        file.size / 1024
                      ).toFixed(1)}{" "}
                      KB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#003B82] transition hover:bg-slate-50"
              >
                <Download size={17} />
                Download Template
              </button>

              <button
                type="button"
                disabled={
                  !file || validating
                }
                onClick={readCSV}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#002F68] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Reading...
                  </>
                ) : (
                  <>
                    <FileText size={17} />
                    Preview Questions
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Format */}

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="font-extrabold text-[#10233F]">
              CSV Format
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your CSV must contain these columns:
            </p>

            <div className="mt-4 overflow-x-auto rounded-xl bg-slate-50 p-4">
              <code className="whitespace-nowrap text-xs text-slate-600">
                {REQUIRED_COLUMNS.join(", ")}
              </code>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-bold text-[#003B82]">
                  Correct Answer
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  A = 0 · B = 1 · C = 2 · D = 3
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-700">
                  Active
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  Use only true or false.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ------------------------------------------------ */}
      {/* STEP 2 - PREVIEW */}
      {/* ------------------------------------------------ */}

      {step === "preview" && (
        <>
          {/* Summary */}

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                CSV Rows
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#10233F]">
                {rows.length}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-semibold text-green-700">
                Valid Rows
              </p>

              <p className="mt-2 text-3xl font-extrabold text-green-800">
                {validRows.length}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-semibold text-red-600">
                Errors
              </p>

              <p className="mt-2 text-3xl font-extrabold text-red-700">
                {errors.length}
              </p>
            </div>
          </section>

          {/* Validation */}

          {errors.length > 0 && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2">
                <XCircle
                  size={20}
                  className="text-red-600"
                />

                <h2 className="font-extrabold text-red-700">
                  Validation Errors
                </h2>
              </div>

              <div className="mt-4 max-h-64 overflow-y-auto rounded-xl bg-white p-4">
                <ul className="space-y-2 text-sm text-red-700">
                  {errors
                    .slice(0, 100)
                    .map(
                      (
                        message,
                        index
                      ) => (
                        <li
                          key={index}
                          className="border-b border-red-50 pb-2 last:border-0"
                        >
                          {message}
                        </li>
                      )
                    )}
                </ul>

                {errors.length > 100 && (
                  <p className="mt-3 text-xs font-semibold text-red-500">
                    Showing first 100 errors.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Warnings */}

          {warnings.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={20}
                  className="text-amber-600"
                />

                <h2 className="font-extrabold text-amber-700">
                  Warnings
                </h2>
              </div>

              <p className="mt-2 text-sm text-amber-700">
                These warnings will not prevent import.
              </p>
            </section>
          )}

          {/* Preview */}

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-extrabold text-[#10233F]">
                  Question Preview
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Showing up to {MAX_PREVIEW_ROWS} rows.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Database size={15} />
                {validRows.length} ready to import
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">
                      Row
                    </th>

                    <th className="px-4 py-3">
                      Question
                    </th>

                    <th className="px-4 py-3">
                      Test
                    </th>

                    <th className="px-4 py-3">
                      Answer
                    </th>

                    <th className="px-4 py-3">
                      Marks
                    </th>

                    <th className="px-4 py-3">
                      Order
                    </th>

                    <th className="px-4 py-3">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows
                    .slice(
                      0,
                      MAX_PREVIEW_ROWS
                    )
                    .map((row) => {
                      const hasError =
                        errors.some(
                          (message) =>
                            message.startsWith(
                              `Row ${row._rowNumber}:`
                            )
                        );

                      return (
                        <tr
                          key={
                            row._rowNumber
                          }
                          className={`border-b border-slate-50 ${
                            hasError
                              ? "bg-red-50/50"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-4 text-sm font-bold text-slate-500">
                            {row._rowNumber}
                          </td>

                          <td className="max-w-[400px] px-4 py-4">
                            <div className="line-clamp-2 text-sm font-semibold leading-6 text-[#10233F]">
                              {
                                row.question_text
                              }
                            </div>
                          </td>

                          <td className="max-w-[220px] px-4 py-4">
                            <div className="truncate text-xs font-semibold text-[#10233F]">
                              {testMap[
                                row.test_id?.trim()
                              ]?.title ||
                                row.test_id}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-extrabold text-green-700">
                              {["A", "B", "C", "D"][
                                Number(
                                  row.correct_answer
                                )
                              ] || "?"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold text-[#10233F]">
                            {row.marks}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-500">
                            {row.display_order}
                          </td>

                          <td className="px-4 py-4">
                            {hasError ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                <XCircle size={12} />
                                Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                <CheckCircle2 size={12} />
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Actions */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={resetUpload}
              disabled={importing}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Choose Another File
            </button>

            <button
              type="button"
              disabled={
                importing ||
                validRows.length === 0 ||
                errors.length > 0
              }
              onClick={handleImport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003B82] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#002F68] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={17} />
                  Import {validRows.length} Questions
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ------------------------------------------------ */}
      {/* ERROR STEP */}
      {/* ------------------------------------------------ */}

      {step === "error" && (
        <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <XCircle
            size={48}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-xl font-extrabold text-[#10233F]">
            CSV Validation Failed
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Check the required column names and
            upload the corrected CSV file.
          </p>

          {errors.length > 0 && (
            <div className="mx-auto mt-5 max-w-2xl rounded-xl bg-red-50 p-4 text-left">
              {errors.map(
                (message, index) => (
                  <p
                    key={index}
                    className="text-sm font-semibold text-red-700"
                  >
                    {message}
                  </p>
                )
              )}
            </div>
          )}

          <button
            type="button"
            onClick={resetUpload}
            className="mt-6 rounded-xl bg-[#003B82] px-5 py-3 text-sm font-bold text-white"
          >
            Choose Another File
          </button>
        </section>
      )}

      {/* ------------------------------------------------ */}
      {/* SUCCESS STEP */}
      {/* ------------------------------------------------ */}

      {step === "success" && (
        <section className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2
              size={36}
              className="text-green-600"
            />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-[#10233F]">
            Import Completed
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {success}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/questions")
              }
              className="rounded-xl bg-[#003B82] px-5 py-3 text-sm font-bold text-white"
            >
              Go to Question Bank
            </button>

            <button
              type="button"
              onClick={resetUpload}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600"
            >
              Import Another File
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminBulkQuestions;