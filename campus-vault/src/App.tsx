import { lazy, Suspense, type ReactElement } from "react";
import { Route, Routes } from "react-router-dom";
import StudentLayout from "@/components/layout/StudentLayout";
import LandingPage from "@/pages/LandingPage";
import { ToastProvider } from "@/components/feedback/ToastProvider";

const AuthPage = lazy(() => import("@/pages/AuthPage"));
const CompleteProfilePage = lazy(() => import("@/pages/CompleteProfilePage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const FeatureStatusPage = lazy(() => import("@/pages/FeatureStatusPage"));
const AdminUploadPage = lazy(() => import("@/pages/AdminUploadPage"));

function studentPage(element: ReactElement) {
  return (
    <Suspense
      fallback={<p className="auth-loading">Loading your student space…</p>}
    >
      {element}
    </Suspense>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <Suspense
              fallback={<p className="auth-loading">Loading sign in…</p>}
            >
              <AuthPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense
              fallback={<p className="auth-loading">Loading account setup…</p>}
            >
              <AuthPage />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense
              fallback={<p className="auth-loading">Loading password reset…</p>}
            >
              <AuthPage />
            </Suspense>
          }
        />
        <Route
          path="/verify-email"
          element={
            <Suspense
              fallback={<p className="auth-loading">Loading verification…</p>}
            >
              <AuthPage />
            </Suspense>
          }
        />
        <Route
          path="/complete-profile"
          element={
            <Suspense
              fallback={<p className="auth-loading">Loading your profile…</p>}
            >
              <CompleteProfilePage />
            </Suspense>
          }
        />
        <Route element={<StudentLayout />}>
          <Route path="/dashboard" element={studentPage(<DashboardPage />)} />
          <Route path="/library" element={studentPage(<LibraryPage />)} />
          <Route
            path="/admin/resources"
            element={studentPage(<AdminUploadPage />)}
          />
          <Route
            path="/contribute"
            element={studentPage(<FeatureStatusPage />)}
          />
          <Route
            path="/my-submissions"
            element={studentPage(<FeatureStatusPage />)}
          />
        </Route>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </ToastProvider>
  );
}
