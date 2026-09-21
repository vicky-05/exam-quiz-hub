import { supabase } from "./supabase";

export async function getExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("id, name, full_name")
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data;
}

export async function getTracks(examId) {
  const { data, error } = await supabase
    .from("tracks")
    .select(`
      id,
      exam_id,
      name,
      description
    `)
    .eq("exam_id", examId)
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data;
}

export async function getSubjects(trackId) {
  const { data, error } = await supabase
    .from("subjects")
    .select(`
      id,
      track_id,
      name,
      description,
      display_order
    `)
    .eq("track_id", trackId)
    .eq("active", true)
    .order("display_order");

  if (error) throw error;

  return data;
}

export async function getTests(subjectId) {
  const { data, error } = await supabase
    .from("tests")
    .select(`
      id,
      subject_id,
      track_id,
      title,
      set_number,
      total_questions,
      duration_minutes,
      marks_per_question,
      negative_marks,
      test_type
    `)
    .eq("subject_id", subjectId)
    .eq("test_type", "practice")
    .eq("active", true)
    .order("set_number");

  if (error) throw error;

  return data;
}

/* =========================================================
   MOCK TESTS
   ---------------------------------------------------------
   Mock tests are NOT subjects.

   Example:

   TNPSC
   └── Mock Tests
       └── TNPSC Group 4 Full Mock Test - 1

   Database:
     track_id   = group-4
     subject_id = NULL
     test_type  = mock
========================================================= */

export async function getMockTests() {
  const { data, error } = await supabase
    .from("tests")
    .select(`
      id,
      track_id,
      title,
      set_number,
      total_questions,
      duration_minutes,
      marks_per_question,
      negative_marks,
      test_type
    `)
    .eq("test_type", "mock")
    .eq("active", true)
    .order("set_number");

  if (error) throw error;

  return data;
}

export async function getQuestions(testId) {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      test_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      question_type,
      marks,
      negative_marks,
      display_order
    `)
    .eq("test_id", testId)
    .eq("active", true)
    .order("display_order");

  if (error) throw error;

  return data;
}