import { useEffect, useState } from "react";

import {
  getExams,
  getTracks,
  getSubjects,
  getTests,
} from "../services/examService";

export default function SupabaseHierarchyTest() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHierarchy() {
      try {
        // 1. Get RRB
        const exams = await getExams();
        const rrb = exams.find((exam) => exam.id === "rrb");

        // 2. Get NTPC
        const tracks = await getTracks(rrb.id);
        const ntpc = tracks.find(
          (track) => track.id === "ntpc"
        );

        // 3. Get History
        const subjects = await getSubjects(ntpc.id);
        const history = subjects.find(
          (subject) => subject.id === "history"
        );

        // 4. Get History test sets
        const tests = await getTests(history.id);

        const hierarchy = {
          exam: rrb,
          track: ntpc,
          subject: history,
          tests,
        };

        console.log(
          "SUPABASE HIERARCHY:",
          hierarchy
        );

        setResult(hierarchy);
      } catch (err) {
        console.error(
          "SUPABASE HIERARCHY ERROR:",
          err
        );

        setError(err.message);
      }
    }

    loadHierarchy();
  }, []);

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-8">
        Loading database...
      </div>
    );
  }

  return (
    <div className="max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-bold">
        Supabase Hierarchy Test
      </h1>

      <div className="space-y-4">
        <div>
          <strong>Exam:</strong>{" "}
          {result.exam.name}
        </div>

        <div>
          <strong>Track:</strong>{" "}
          {result.track.name}
        </div>

        <div>
          <strong>Subject:</strong>{" "}
          {result.subject.name}
        </div>

        <div>
          <strong>Test Sets:</strong>
          <ul className="mt-2 list-disc pl-6">
            {result.tests.map((test) => (
              <li key={test.id}>
                {test.title} —{" "}
                {test.total_questions} Questions
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}