import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Loader2,
  Maximize,
  Minimize,
  Minus,
  Plus,
  Printer,
  Search,
  X,
} from "lucide-react";

import Header from "../components/Header";
import { supabase } from "../services/supabase";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

/* =========================================================
   PDF.JS WORKER
========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const STORAGE_BUCKET = "study-materials";

/* =========================================================
   PDF VIEWER
========================================================= */

function PDFViewer({ pdfUrl, fileName }) {
  const viewerRootRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const [pdfDocument, setPdfDocument] = useState(null);

  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);

  const [containerWidth, setContainerWidth] = useState(900);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [searching, setSearching] = useState(false);

  const [documentTitle, setDocumentTitle] = useState(
    fileName || "Study Material"
  );

  /* =======================================================
     LOAD PDF
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      if (!pdfUrl) {
        return;
      }

      setLoading(true);
      setError("");
      setPdfDocument(null);
      setPageNumber(1);
      setPageInput("1");

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
          useWorkerFetch: true,
          isEvalSupported: true,
        });

        const pdf = await loadingTask.promise;

        /*
         * IMPORTANT:
         * Do not call loadingTask.destroy() here.
         * React development cleanup can otherwise
         * cause "Loading aborted".
         */

        if (cancelled) {
          return;
        }

        setPdfDocument(pdf);

        try {
          const metadata = await pdf.getMetadata();

          if (
            !cancelled &&
            metadata?.info?.Title
          ) {
            setDocumentTitle(
              metadata.info.Title
            );
          }
        } catch {
          // Metadata is optional.
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "PDF.js load error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load this PDF."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  /* =======================================================
     OBSERVE VIEWER WIDTH
  ======================================================= */

  useEffect(() => {
    const element =
      scrollContainerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(
        element.clientWidth || 900
      );
    };

    updateWidth();

    const observer =
      new ResizeObserver(updateWidth);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  /* =======================================================
     RENDER PAGE
  ======================================================= */

  useEffect(() => {
    if (
      !pdfDocument ||
      !canvasRef.current
    ) {
      return;
    }

    let cancelled = false;
    let renderTask = null;

    async function renderPage() {
      setRendering(true);

      try {
        const page =
          await pdfDocument.getPage(
            pageNumber
          );

        if (cancelled) {
          return;
        }

        const baseViewport =
          page.getViewport({
            scale: 1,
          });

        let actualScale = zoom;

        if (fitWidth) {
          const availableWidth =
            Math.max(
              containerWidth - 32,
              280
            );

          actualScale =
            availableWidth /
            baseViewport.width;

          actualScale = Math.min(
            Math.max(actualScale, 0.35),
            3
          );
        }

        const viewport =
          page.getViewport({
            scale: actualScale,
          });

        const canvas =
          canvasRef.current;

        if (!canvas) {
          return;
        }

        const context =
          canvas.getContext("2d", {
            alpha: false,
          });

        const devicePixelRatio =
          window.devicePixelRatio || 1;

        canvas.width = Math.floor(
          viewport.width *
            devicePixelRatio
        );

        canvas.height = Math.floor(
          viewport.height *
            devicePixelRatio
        );

        canvas.style.width =
          `${viewport.width}px`;

        canvas.style.height =
          `${viewport.height}px`;

        context.setTransform(
          devicePixelRatio,
          0,
          0,
          devicePixelRatio,
          0,
          0
        );

        context.fillStyle = "#FFFFFF";

        context.fillRect(
          0,
          0,
          viewport.width,
          viewport.height
        );

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;

        if (!cancelled) {
          setRendering(false);
        }
      } catch (err) {
        if (
          err?.name ===
          "RenderingCancelledException"
        ) {
          return;
        }

        console.error(
          "PDF.js render error:",
          err
        );

        if (!cancelled) {
          setRendering(false);

          setError(
            "Unable to render this PDF page."
          );
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;

      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore cancellation errors.
        }
      }
    };
  }, [
    pdfDocument,
    pageNumber,
    zoom,
    fitWidth,
    containerWidth,
  ]);

  /* =======================================================
     PAGE NAVIGATION
  ======================================================= */

  const totalPages =
    pdfDocument?.numPages || 0;

  const goToPage = (page) => {
    if (!totalPages) {
      return;
    }

    const parsedPage =
      Number(page);

    const nextPage = Math.min(
      Math.max(
        Number.isFinite(parsedPage)
          ? parsedPage
          : 1,
        1
      ),
      totalPages
    );

    setPageNumber(nextPage);
    setPageInput(
      String(nextPage)
    );
  };

  const previousPage = () => {
    goToPage(pageNumber - 1);
  };

  const nextPage = () => {
    goToPage(pageNumber + 1);
  };

  const handlePageInput = (event) => {
    if (event.key === "Enter") {
      goToPage(pageInput);
    }
  };

  /* =======================================================
     ZOOM
  ======================================================= */

  const zoomOut = () => {
    setFitWidth(false);

    setZoom((current) =>
      Math.max(
        0.5,
        Number(
          (current - 0.1).toFixed(2)
        )
      )
    );
  };

  const zoomIn = () => {
    setFitWidth(false);

    setZoom((current) =>
      Math.min(
        3,
        Number(
          (current + 0.1).toFixed(2)
        )
      )
    );
  };

  const resetZoom = () => {
    setFitWidth(false);
    setZoom(1);
  };

  const enableFitWidth = () => {
    setFitWidth(true);
  };

  /* =======================================================
     FULLSCREEN
  ======================================================= */

  const toggleFullscreen =
    async () => {
      const element =
        viewerRootRef.current;

      if (!element) {
        return;
      }

      try {
        if (
          !document.fullscreenElement
        ) {
          await element.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error(
          "Fullscreen error:",
          err
        );
      }
    };

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        setIsFullscreen(
          Boolean(
            document.fullscreenElement
          )
        );
      };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const downloadPdf = () => {
    const link =
      document.createElement("a");

    link.href = pdfUrl;

    link.download =
      fileName ||
      "study-material.pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();
  };

  /* =======================================================
     PRINT
  ======================================================= */

  const printPdf = () => {
    const printWindow =
      window.open(
        pdfUrl,
        "_blank",
        "noopener,noreferrer"
      );

    if (printWindow) {
      printWindow.focus();
    }
  };

  /* =======================================================
     SEARCH PDF
  ======================================================= */

  const searchPdf = async () => {
    const query =
      searchText
        .trim()
        .toLowerCase();

    if (
      !query ||
      !pdfDocument
    ) {
      setSearchResults([]);
      setSearchIndex(0);
      return;
    }

    setSearching(true);

    try {
      const results = [];

      for (
        let page = 1;
        page <= pdfDocument.numPages;
        page += 1
      ) {
        const pdfPage =
          await pdfDocument.getPage(
            page
          );

        const textContent =
          await pdfPage.getTextContent();

        const text =
          textContent.items
            .map(
              (item) =>
                item.str || ""
            )
            .join(" ");

        if (
          text
            .toLowerCase()
            .includes(query)
        ) {
          results.push(page);
        }
      }

      setSearchResults(results);
      setSearchIndex(0);

      if (results.length > 0) {
        goToPage(results[0]);
      }
    } catch (err) {
      console.error(
        "PDF search error:",
        err
      );
    } finally {
      setSearching(false);
    }
  };

  const nextSearchResult = () => {
    if (!searchResults.length) {
      return;
    }

    const nextIndex =
      (searchIndex + 1) %
      searchResults.length;

    setSearchIndex(nextIndex);

    goToPage(
      searchResults[nextIndex]
    );
  };

  const previousSearchResult =
    () => {
      if (!searchResults.length) {
        return;
      }

      const previousIndex =
        (searchIndex -
          1 +
          searchResults.length) %
        searchResults.length;

      setSearchIndex(
        previousIndex
      );

      goToPage(
        searchResults[
          previousIndex
        ]
      );
    };

  /* =======================================================
     KEYBOARD SHORTCUTS
  ======================================================= */

  useEffect(() => {
    const handleKeyboard = (
      event
    ) => {
      if (
        event.target instanceof
          HTMLInputElement ||
        event.target instanceof
          HTMLTextAreaElement
      ) {
        return;
      }

      if (
        event.key === "ArrowLeft"
      ) {
        previousPage();
      }

      if (
        event.key === "ArrowRight"
      ) {
        nextPage();
      }

      if (
        event.key === "+" ||
        event.key === "="
      ) {
        zoomIn();
      }

      if (event.key === "-") {
        zoomOut();
      }

      if (
        event.key.toLowerCase() ===
        "f"
      ) {
        toggleFullscreen();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  });

  /* =======================================================
     PDF ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="flex min-h-[520px] h-full items-center justify-center bg-[#07111F] p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-400">
            <FileText size={28} />
          </div>

          <h3 className="mt-5 text-lg font-black text-white">
            Unable to display PDF
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#009FE3] px-5 py-3 text-sm font-black text-white"
          >
            Open PDF
          </a>
        </div>
      </div>
    );
  }

  /* =======================================================
     VIEWER
  ======================================================= */

  return (
    <div
      ref={viewerRootRef}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#172235] text-white"
    >
      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <div className="relative z-30 shrink-0 border-b border-white/10 bg-[#0B1728]">

        <div className="flex min-h-[52px] items-center gap-1 px-2 sm:px-3">

          {/* FILE NAME */}

          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#009FE3]/10 text-[#19B8F2]">
              <FileText size={16} />
            </div>

            <span className="truncate text-xs font-bold text-slate-300">
              {documentTitle}
            </span>
          </div>

          {/* SEARCH */}

          <button
            type="button"
            onClick={() =>
              setSearchOpen(
                (value) => !value
              )
            }
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Search"
          >
            <Search size={17} />
          </button>

          {/* PAGE NAVIGATION */}

          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">

            <button
              type="button"
              onClick={previousPage}
              disabled={
                pageNumber <= 1
              }
              className="grid h-8 w-8 place-items-center rounded-md text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              title="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <div className="flex items-center gap-1 px-1">

              <input
                value={pageInput}
                onChange={(event) =>
                  setPageInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handlePageInput
                }
                onBlur={() =>
                  goToPage(pageInput)
                }
                inputMode="numeric"
                className="h-7 w-10 rounded-md border border-white/10 bg-[#07111F] text-center text-xs font-bold text-white outline-none focus:border-[#009FE3]"
              />

              <span className="text-xs font-bold text-slate-500">
                /
              </span>

              <span className="min-w-[28px] text-center text-xs font-bold text-slate-300">
                {totalPages || "—"}
              </span>

            </div>

            <button
              type="button"
              onClick={nextPage}
              disabled={
                pageNumber >=
                totalPages
              }
              className="grid h-8 w-8 place-items-center rounded-md text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              title="Next page"
            >
              <ChevronRight size={17} />
            </button>

          </div>

          {/* ZOOM */}

          <div className="hidden items-center gap-1 rounded-lg bg-white/5 p-1 sm:flex">

            <button
              type="button"
              onClick={zoomOut}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-300 transition hover:bg-white/10"
              title="Zoom out"
            >
              <Minus size={16} />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="min-w-[52px] rounded-md px-2 py-1.5 text-[11px] font-black text-slate-300 transition hover:bg-white/10"
              title="Reset zoom"
            >
              {fitWidth
                ? "Fit"
                : `${Math.round(
                    zoom * 100
                  )}%`}
            </button>

            <button
              type="button"
              onClick={zoomIn}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-300 transition hover:bg-white/10"
              title="Zoom in"
            >
              <Plus size={16} />
            </button>

          </div>

          {/* FIT WIDTH */}

          <button
            type="button"
            onClick={
              enableFitWidth
            }
            className={`hidden h-9 shrink-0 items-center rounded-lg px-3 text-[11px] font-black transition sm:flex ${
              fitWidth
                ? "bg-[#009FE3]/15 text-[#19B8F2]"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Fit Width
          </button>

          <div className="flex-1 md:hidden" />

          {/* PRINT */}

          <button
            type="button"
            onClick={printPdf}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Print"
          >
            <Printer size={16} />
          </button>

          {/* DOWNLOAD */}

          <button
            type="button"
            onClick={downloadPdf}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Download"
          >
            <Download size={16} />
          </button>

          {/* FULLSCREEN */}

          <button
            type="button"
            onClick={
              toggleFullscreen
            }
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            title="Fullscreen"
          >
            {isFullscreen ? (
              <Minimize size={16} />
            ) : (
              <Maximize size={16} />
            )}
          </button>

        </div>

        {/* =================================================
            SEARCH BAR
        ================================================= */}

        {searchOpen && (
          <div className="border-t border-white/10 bg-[#0A1424] px-3 py-2">

            <div className="flex items-center gap-2">

              <div className="relative min-w-0 flex-1">

                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  autoFocus
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      searchPdf();
                    }
                  }}
                  placeholder="Search in PDF..."
                  className="h-9 w-full rounded-lg border border-white/10 bg-[#07111F] pl-9 pr-3 text-xs font-medium text-white outline-none placeholder:text-slate-500 focus:border-[#009FE3]"
                />

              </div>

              <button
                type="button"
                onClick={searchPdf}
                disabled={searching}
                className="h-9 shrink-0 rounded-lg bg-[#009FE3] px-4 text-xs font-black text-white disabled:opacity-50"
              >
                {searching
                  ? "Searching..."
                  : "Search"}
              </button>

              {searchResults.length >
                0 && (
                <>
                  <button
                    type="button"
                    onClick={
                      previousSearchResult
                    }
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
                    title="Previous result"
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  <span className="hidden whitespace-nowrap text-[11px] font-bold text-slate-400 sm:block">
                    {searchIndex + 1} /{" "}
                    {searchResults.length}
                  </span>

                  <button
                    type="button"
                    onClick={
                      nextSearchResult
                    }
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
                    title="Next result"
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setSearchOpen(
                    false
                  );
                  setSearchText("");
                  setSearchResults([]);
                  setSearchIndex(0);
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Close search"
              >
                <X size={16} />
              </button>

            </div>

            {searchText &&
              !searching &&
              searchResults.length ===
                0 && (
                <p className="px-1 pt-2 text-[11px] text-slate-500">
                  No matching pages found.
                </p>
              )}

          </div>
        )}

      </div>

      {/* ===================================================
          PDF AREA
      =================================================== */}

      <div
        ref={scrollContainerRef}
        className="relative min-h-0 flex-1 overflow-auto bg-[#172235] p-4 sm:p-6"
      >

        {/* LOADING */}

        {loading && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-[#07111F]">

            <div className="flex flex-col items-center gap-4">

              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#009FE3]/10 text-[#009FE3]">
                <Loader2
                  size={26}
                  className="animate-spin"
                />
              </div>

              <div className="text-center">

                <p className="text-sm font-black text-white">
                  Loading PDF
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Preparing your study material...
                </p>

              </div>

            </div>

          </div>
        )}

        {/* PDF CANVAS */}

        {!loading &&
          pdfDocument && (
            <div className="flex min-h-full items-start justify-center">

              <div className="relative">

                {rendering && (
                  <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">

                    <div className="flex items-center gap-2 rounded-full bg-[#001F4F]/90 px-3 py-2 text-[10px] font-black text-white shadow-lg">

                      <Loader2
                        size={13}
                        className="animate-spin"
                      />

                      Rendering

                    </div>

                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  className="block bg-white shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
                />

              </div>

            </div>
          )}

        {/* PAGE STATUS */}

        {!loading &&
          pdfDocument && (
            <div className="pointer-events-none sticky bottom-2 mt-4 flex justify-center">

              <div className="rounded-full border border-white/10 bg-[#001F4F]/90 px-4 py-2 text-[11px] font-black text-white shadow-xl backdrop-blur">
                Page {pageNumber} of{" "}
                {totalPages}
              </div>

            </div>
          )}

      </div>

      {/* ===================================================
          MOBILE CONTROLS
      =================================================== */}

      <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-[#0B1728] px-2 py-2 sm:hidden">

        <button
          type="button"
          onClick={zoomOut}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 active:bg-white/10"
        >
          <Minus size={17} />
        </button>

        <button
          type="button"
          onClick={enableFitWidth}
          className="rounded-lg px-3 py-2 text-[10px] font-black text-slate-300"
        >
          {fitWidth
            ? "FIT"
            : `${Math.round(
                zoom * 100
              )}%`}
        </button>

        <button
          type="button"
          onClick={zoomIn}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 active:bg-white/10"
        >
          <Plus size={17} />
        </button>

        <div className="h-5 w-px bg-white/10" />

        <button
          type="button"
          onClick={previousPage}
          disabled={
            pageNumber <= 1
          }
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-[10px] font-black text-slate-300">
          {pageNumber} /{" "}
          {totalPages || "—"}
        </span>

        <button
          type="button"
          onClick={nextPage}
          disabled={
            pageNumber >=
            totalPages
          }
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

function StudyMaterialViewerPage() {
  const {
    examId,
    trackId,
    subjectSlug,
    materialId,
  } = useParams();

  const [exam, setExam] =
    useState(null);

  const [track, setTrack] =
    useState(null);

  const [subject, setSubject] =
    useState(null);

  const [material, setMaterial] =
    useState(null);

  const [pdfUrl, setPdfUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD MATERIAL
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadMaterial() {
      setLoading(true);
      setError("");

      try {
        /* =================================================
           EXAM
        ================================================= */

        const {
          data: examData,
          error: examError,
        } = await supabase
          .from("exams")
          .select("id, name")
          .eq("id", examId)
          .single();

        if (examError) {
          throw examError;
        }

        /* =================================================
           TRACK
        ================================================= */

        const {
          data: trackData,
          error: trackError,
        } = await supabase
          .from("tracks")
          .select(
            "id, name, exam_id"
          )
          .eq("id", trackId)
          .eq("exam_id", examId)
          .single();

        if (trackError) {
          throw trackError;
        }

        /* =================================================
           STUDY MATERIAL SUBJECT
        ================================================= */

        const {
          data: subjectData,
          error: subjectError,
        } = await supabase
          .from(
            "study_material_subjects"
          )
          .select(
            `
              id,
              exam_id,
              track_id,
              name,
              slug,
              description
            `
          )
          .eq("exam_id", examId)
          .eq("track_id", trackId)
          .eq("slug", subjectSlug)
          .eq("is_active", true)
          .single();

        if (subjectError) {
          throw subjectError;
        }

        /* =================================================
           STUDY MATERIAL
        ================================================= */

        const {
          data: materialData,
          error: materialError,
        } = await supabase
          .from("study_materials")
          .select(
            `
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
              display_order
            `
          )
          .eq("id", materialId)
          .eq("exam_id", examId)
          .eq("track_id", trackId)
          .eq(
            "study_material_subject_id",
            subjectData.id
          )
          .eq("is_published", true)
          .single();

        if (materialError) {
          throw materialError;
        }

        if (
          !materialData?.pdf_path
        ) {
          throw new Error(
            "PDF file is not available."
          );
        }

        /* =================================================
           SIGNED URL
        ================================================= */

        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(
            materialData.pdf_path,
            60 * 60
          );

        if (signedError) {
          throw signedError;
        }

        if (
          !signedData?.signedUrl
        ) {
          throw new Error(
            "Unable to create PDF URL."
          );
        }

        if (!mounted) {
          return;
        }

        setExam(examData);
        setTrack(trackData);
        setSubject(subjectData);
        setMaterial(materialData);
        setPdfUrl(
          signedData.signedUrl
        );
      } catch (err) {
        console.error(
          "Study material viewer error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err?.message ||
            "Unable to load this study material."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMaterial();

    return () => {
      mounted = false;
    };
  }, [
    examId,
    trackId,
    subjectSlug,
    materialId,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F]">
        <Header />

        <div className="grid min-h-[70vh] place-items-center px-4">

          <div className="flex flex-col items-center gap-4 text-center">

            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#009FE3]/10 text-[#009FE3]">
              <Loader2
                size={30}
                className="animate-spin"
              />
            </div>

            <div>

              <h2 className="text-lg font-black text-[#001F4F] dark:text-white">
                Loading study material
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-[#A8B4C5]">
                Please wait...
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !material ||
    !pdfUrl
  ) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F]">

        <Header />

        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">

          <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/40 dark:bg-[#0D1B2E]">

            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
              <FileText size={28} />
            </div>

            <h2 className="mt-5 text-xl font-black text-[#001F4F] dark:text-white">
              Unable to open PDF
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
              {error ||
                "This study material could not be loaded."}
            </p>

            <Link
              to={`/study-materials/${examId}/${trackId}/${subjectSlug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#009FE3] px-5 py-3 text-sm font-black text-white transition hover:bg-[#008DCA]"
            >
              <ArrowLeft size={17} />
              Back to Materials
            </Link>

          </div>

        </div>

      </div>
    );
  }

  /* =======================================================
     FILE SIZE
  ======================================================= */

  const formattedFileSize =
    material.file_size_bytes
      ? `${(
          material.file_size_bytes /
          (1024 * 1024)
        ).toFixed(1)} MB`
      : null;

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F]">

      <Header />

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-bold text-slate-500 dark:text-[#A8B4C5]">

          <Link
            to={`/study-materials/${examId}/${trackId}`}
            className="shrink-0 transition hover:text-[#009FE3]"
          >
            {exam?.name ||
              "Exam"}
          </Link>

          <ChevronRight
            size={14}
            className="shrink-0"
          />

          <Link
            to={`/study-materials/${examId}/${trackId}`}
            className="shrink-0 transition hover:text-[#009FE3]"
          >
            Study Materials
          </Link>

          <ChevronRight
            size={14}
            className="shrink-0"
          />

          <Link
            to={`/study-materials/${examId}/${trackId}/${subjectSlug}`}
            className="shrink-0 transition hover:text-[#009FE3]"
          >
            {subject?.name ||
              "Subject"}
          </Link>

          <ChevronRight
            size={14}
            className="shrink-0"
          />

          <span className="max-w-[220px] truncate text-[#001F4F] dark:text-white">
            {material.title}
          </span>

        </div>

        {/* =================================================
            MATERIAL HEADER
        ================================================= */}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0D1B2E] sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#009FE3]">
                <BookOpen size={15} />
                Study Material
              </div>

              <h1 className="mt-2 text-xl font-black tracking-tight text-[#001F4F] dark:text-white sm:text-2xl">
                {material.title}
              </h1>

              {material.description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-[#A8B4C5]">
                  {material.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">

                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#009FE3]/10 px-3 py-1.5 text-[11px] font-black text-[#0087C4] dark:text-[#19B8F2]">
                  <FileText size={13} />
                  PDF
                </span>

                {material.estimated_minutes && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 dark:bg-white/5 dark:text-[#A8B4C5]">
                    <Clock3 size={13} />
                    {material.estimated_minutes} min
                  </span>
                )}

                {formattedFileSize && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 dark:bg-white/5 dark:text-[#A8B4C5]">
                    {formattedFileSize}
                  </span>
                )}

              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex shrink-0 gap-2">

              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-[#001F4F] transition hover:border-[#009FE3] hover:text-[#009FE3] dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <Maximize size={15} />

                <span className="hidden sm:inline">
                  Open
                </span>
              </a>

              <a
                href={pdfUrl}
                download={
                  material.pdf_file_name ||
                  "study-material.pdf"
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#009FE3] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#008DCA]"
              >
                <Download size={15} />

                <span className="hidden sm:inline">
                  Download
                </span>
              </a>

            </div>

          </div>

        </section>

        {/* =================================================
            PDF VIEWER
        ================================================= */}

        <section
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#172235] shadow-xl dark:border-white/10"
          style={{
            height:
              "calc(100dvh - 250px)",
            minHeight: "520px",
          }}
        >

          <PDFViewer
            pdfUrl={pdfUrl}
            fileName={
              material.pdf_file_name ||
              material.title ||
              "study-material.pdf"
            }
          />

        </section>

        {/* =================================================
            STUDY TIP
        ================================================= */}

        <div className="mt-4 rounded-2xl border border-[#FFD23F]/30 bg-[#FFFBEA] p-4 dark:border-[#FFD23F]/20 dark:bg-[#211D0B]">

          <div className="flex gap-3">

            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFD23F] text-[#001F4F]">
              <BookOpen size={17} />
            </div>

            <div>

              <p className="text-xs font-black uppercase tracking-wider text-[#806000] dark:text-[#FFD23F]">
                Study Tip
              </p>

              <p className="mt-1 text-sm leading-6 text-[#665A24] dark:text-[#D9CC8A]">
                Read the material once for understanding,
                then revisit important facts and definitions
                during revision.
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default StudyMaterialViewerPage;