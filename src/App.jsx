import { Route, Routes } from "react-router-dom";
import UserDashboard from "./pages/UserDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import AttemptsPage from "./pages/AttemptsPage";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Header from "./components/Header";
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
        <Route path="/" element={<HomePage />} />
        <Route path="/exam/:examId" element={<ExamDashboard />} />
        <Route path="/exam/:examId/:trackId" element={<ExamDashboard />} />
        <Route
          path="/exam/:examId/:trackId/subject/:subjectId"
          element={<SubjectSets />}
        />
        <Route
          path="/exam/:examId/:trackId/quiz/:subjectId/:setId"
          element={<QuizPage />}
        />
        <Route
          path="/exam/:examId/:trackId/result/:subjectId/:setId"
          element={<ResultPage />}
        />
        <Route path="/supabase-test" element={<SupabaseTest />} />
        <Route
          path="/supabase-hierarchy-test"
          element={<SupabaseHierarchyTest />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
        <Route
          path="/exam/:examId/:trackId/mock/:mockId"
          element={<QuizPage />}
        />
        <Route path="/motivation" element={<MotivationPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
