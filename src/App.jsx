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
import MotivationPage from "./pages/MotivationPage";
import ExamDashboard from "./components/ExamDashboard";
import { SubjectSets } from "./components/LearningFlow";
import ResultPage from "./components/ResultPage";
import QuizPage from "./components/QuizPage";
import SupabaseTest from "./components/SupabaseTest";
import SupabaseHierarchyTest from "./components/SupabaseHierarchyTest";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

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


        {/* =========================
            PROTECTED DASHBOARD ROUTES
        ========================= */}

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


        {/* =========================
            PROTECTED EXAM ROUTES
        ========================= */}

        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute>
              <ExamDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam/:examId/:trackId"
          element={
            <ProtectedRoute>
              <ExamDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam/:examId/:trackId/subject/:subjectId"
          element={
            <ProtectedRoute>
              <SubjectSets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam/:examId/:trackId/quiz/:subjectId/:setId"
          element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          }
        />

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


        {/* =========================
            404
        ========================= */}

        <Route
          path="*"
          element={<NotFoundPage />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route
            path="exams"
            element={<AdminExams />}
          />
          <Route
            path="tracks"
            element={<AdminTracks />}
          />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="tests" element={<AdminTests />} />
          <Route
            path="tests/:testId/questions"
            element={<AdminTestQuestions />}
          />
          <Route
            path="attempts"
            element={<AdminAttempts />}
          />
          <Route
            path="attempts/:attemptId"
            element={<AdminAttemptDetails />}
          />
          <Route
            path="motivation"
            element={<AdminMotivation />}
          />
          <Route
            path="settings"
            element={<AdminSettings />}
          />
          <Route path="questions" element={<AdminQuestions />} />
          <Route
            path="questions/new"
            element={<AdminAddQuestion />}
          />
          <Route
            path="questions/bulk-upload"
            element={<AdminBulkQuestions />}
          />
          <Route
            path="questions/:questionId/edit"
            element={<AdminEditQuestion />}
          />
        </Route>


      </Routes>
    </AuthProvider>
  );
}

export default App;