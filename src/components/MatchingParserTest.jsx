import { useState } from "react";
import {
  parseMatchingQuestion,
  isMatchingQuestion,
} from "../utils/matchingQuestionParser";

export default function MatchingParserTest() {
  const [text, setText] = useState(`Match the following:
A) Punjab
B) Sindhu
C) Ganga
D) Yamuna
1) River
2) State
3) City
4) Mountain`);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const testParser = () => {
    console.log("TEST BUTTON CLICKED");

    setError("");
    setResult(null);

    try {
      const matching = isMatchingQuestion(text);
      const parsed = parseMatchingQuestion(text);

      console.log("Matching:", matching);
      console.log("Parsed:", parsed);

      setResult({
        matching,
        parsed,
      });
    } catch (err) {
      console.error("Parser error:", err);

      setError(
        err?.message || "Unknown parser error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-black text-[#10233F]">
          Matching Question Parser Test
        </h1>

        <p className="mb-5 text-sm text-slate-500">
          Paste a real matching question below and test it.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[300px] w-full rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm text-[#10233F] outline-none focus:border-[#003B82]"
        />

        <button
          type="button"
          onClick={testParser}
          className="mt-4 rounded-xl bg-[#003B82] px-6 py-3 font-bold text-white transition hover:bg-[#002D63]"
        >
          Test Question
        </button>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-5">
            <h2 className="font-black text-red-700">
              Parser Error
            </h2>

            <pre className="mt-2 whitespace-pre-wrap text-sm text-red-600">
              {error}
            </pre>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 rounded-xl border border-slate-300 bg-white p-6">
            <h2 className="mb-5 text-xl font-black text-[#10233F]">
              Result
            </h2>

            <div className="mb-5 rounded-lg bg-slate-100 p-4">
              <p className="font-bold">
                Matching Question:
              </p>

              <p className="mt-1 text-lg font-black">
                {result.matching ? (
                  <span className="text-green-600">
                    YES ✅
                  </span>
                ) : (
                  <span className="text-red-600">
                    NO ❌
                  </span>
                )}
              </p>
            </div>

            {result.parsed ? (
              <>
                <div className="mb-5">
                  <p className="font-bold">
                    Format:
                  </p>

                  <p className="mt-1">
                    {result.parsed.format}
                  </p>
                </div>

                <div className="mb-5">
                  <h3 className="mb-2 text-lg font-black">
                    First List
                  </h3>

                  <pre className="overflow-auto rounded-lg bg-slate-100 p-4 text-sm">
                    {JSON.stringify(
                      result.parsed.firstList,
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-black">
                    Second List
                  </h3>

                  <pre className="overflow-auto rounded-lg bg-slate-100 p-4 text-sm">
                    {JSON.stringify(
                      result.parsed.secondList,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-red-50 p-4 text-red-700">
                Parser returned <strong>null</strong>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}