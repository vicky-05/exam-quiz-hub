import { useEffect, useState } from "react";
import { getExams } from "../services/examService";

export default function SupabaseTest() {
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExams()
      .then((data) => {
        console.log("SUPABASE EXAMS:", data);
        setExams(data);
      })
      .catch((err) => {
        console.error("SUPABASE ERROR:", err);
        setError(err.message);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">
        Supabase Connection Test
      </h1>

      {error && (
        <p className="text-red-600">
          Error: {error}
        </p>
      )}

      {exams.map((exam) => (
        <div key={exam.id} className="mb-2">
          {exam.name}
        </div>
      ))}
    </div>
  );
}