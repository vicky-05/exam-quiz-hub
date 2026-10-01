import { Route, Routes } from "react-router-dom";

import UserDashboard from "./pages/UserDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import AttemptsPage from "./pages/AttemptsPage";

import { AuthProvider } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import AccessPendingPage from "./pages/AccessPendingPage";

import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminEditQuestion from "./pages/admin/AdminEditQuestion";
import AdminAddQuestion from "./pages/admin/AdminAddQuestion";
import AdminBulkQuestions from "./pages/admin/AdminBulkQuestions";
import AdminExams from "./pages/admin/AdminExams";
import AdminTracks from "./pages/admin/AdminTracks";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminTests from "./pages/admin/AdminTests";
import AdminTestQuestions from "./pages/admin/AdminTestQuestions";
import AdminAttempts from "./pages/admin/AdminAttempts";
import AdminAttemptDetails from "./pages/admin/AdminAttemptDetails";
import AdminMotivation from "./pages/admin/AdminMotivation";
import AdminSettings from "./pages/admin/AdminSettings";
import QuestionReportsPage from "./pages/admin/QuestionReportsPage";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";

import MotivationPage from "./pages/MotivationPage";

import ExamDashboard from "./components/ExamDashboard";
import { SubjectSets } from "./components/LearningFlow";
import ResultPage from "./components/ResultPage";
import QuizPage from "./components/QuizPage";

import SupabaseTest from "./components/SupabaseTest";
import SupabaseHierarchyTest from "./components/SupabaseHierarchyTest";

import HomePage from "./pages/HomePage";

/* =========================================
   STUDY MATERIALS
========================================= */

import StudyMaterialsPage from "./pages/StudyMaterialsPage";
import StudyMaterialSubjectPage from "./pages/StudyMaterialSubjectPage";
import StudyMaterialViewerPage from "./pages/StudyMaterialViewerPage";

/* =========================================
   ADMIN - STUDY MATERIALS
========================================= */

import AdminStudyMaterialSubjects from "./pages/admin/AdminStudyMaterialSubjects";
import AdminStudyMaterials from "./pages/admin/AdminStudyMaterials";


function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* =========================================
            PUBLIC ROUTES
        ========================================== */}

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        <Route
          path="/access-pending"
          element={<AccessPendingPage />}
        />

        <Route
          path="/motivation"
          element={<MotivationPage />}
        />

        {/* Supabase testing pages */}

        <Route
          path="/supabase-test"
          element={<SupabaseTest />}
        />

        <Route
          path="/supabase-hierarchy-test"
          element={<SupabaseHierarchyTest />}
        />


        {/* =========================================
            PROTECTED DASHBOARD ROUTES
        ========================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/attempts"
          element={
            <ProtectedRoute>
              <AttemptsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />


        {/* =========================================
            PROTECTED EXAM ROUTES
        ========================================== */}

        {/* Exam dashboard */}

        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute>
              <ExamDashboard />
            </ProtectedRoute>
          }
        />

        {/* Exam + Track dashboard */}

        <Route
          path="/exam/:examId/:trackId"
          element={
            <ProtectedRoute>
              <ExamDashboard />
            </ProtectedRoute>
          }
        />

        {/* Subject test sets */}

        <Route
          path="/exam/:examId/:trackId/subject/:subjectId"
          element={
            <ProtectedRoute>
              <SubjectSets />
            </ProtectedRoute>
          }
        />

        {/* Quiz */}

        <Route
          path="/exam/:examId/:trackId/quiz/:subjectId/:setId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />

        {/* Result */}

        <Route
          path="/exam/:examId/:trackId/result/:subjectId/:setId"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />

        {/* Mock Exam */}

        <Route
          path="/exam/:examId/:trackId/mock/:mockId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />


        {/* =========================================
            PROTECTED STUDY MATERIAL ROUTES
        ========================================== */}

        {/* Study Material Subjects */}

        <Route
          path="/study-materials/:examId/:trackId"
          element={
            <ProtectedRoute>
              <StudyMaterialsPage />
            </ProtectedRoute>
          }
        />

        {/* Materials inside a Study Material Subject */}

        <Route
          path="/study-materials/:examId/:trackId/:subjectSlug"
          element={
            <ProtectedRoute>
              <StudyMaterialSubjectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/study-materials/:examId/:trackId/:subjectSlug/:materialId"
          element={
            <ProtectedRoute>
              <StudyMaterialViewerPage />
            </ProtectedRoute>
          }
        />


        {/* =========================================
            ADMIN ROUTES
        ========================================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >

          {/* Admin Dashboard */}

          <Route
            index
            element={<AdminDashboard />}
          />

          {/* Users */}

          <Route
            path="users"
            element={<AdminUsers />}
          />

          {/* Exams */}

          <Route
            path="exams"
            element={<AdminExams />}
          />

          {/* Tracks */}

          <Route
            path="tracks"
            element={<AdminTracks />}
          />

          {/* Existing Test Subjects */}

          <Route
            path="subjects"
            element={<AdminSubjects />}
          />

          {/* Study Material Subjects */}

          <Route
            path="study-material-subjects"
            element={<AdminStudyMaterialSubjects />}
          />

          {/* Study Materials */}

          <Route
            path="study-materials"
            element={<AdminStudyMaterials />}
          />

          {/* Tests */}

          <Route
            path="tests"
            element={<AdminTests />}
          />

          {/* Test Questions */}

          <Route
            path="tests/:testId/questions"
            element={<AdminTestQuestions />}
          />

          {/* Attempts */}

          <Route
            path="attempts"
            element={<AdminAttempts />}
          />

          {/* Attempt Details */}

          <Route
            path="attempts/:attemptId"
            element={<AdminAttemptDetails />}
          />

          {/* Motivation */}

          <Route
            path="motivation"
            element={<AdminMotivation />}
          />

          {/* Settings */}

          <Route
            path="settings"
            element={<AdminSettings />}
          />

          {/* Question Bank */}

          <Route
            path="questions"
            element={<AdminQuestions />}
          />

          {/* Add Question */}

          <Route
            path="questions/new"
            element={<AdminAddQuestion />}
          />

          {/* Bulk Upload */}

          <Route
            path="questions/bulk-upload"
            element={<AdminBulkQuestions />}
          />

          {/* Edit Question */}

          <Route
            path="questions/:questionId/edit"
            element={<AdminEditQuestion />}
          />

          {/* Question Reports */}

          <Route
            path="question-reports"
            element={<QuestionReportsPage />}
          />

          {/* Announcements */}

          <Route
            path="announcements"
            element={<AdminAnnouncements />}
          />

        </Route>


        {/* =========================================
            404 - KEEP LAST
        ========================================== */}

        <Route
          path="*"
          element={<NotFoundPage />}
        />

      </Routes>
    </AuthProvider>
  );
}

export default App;