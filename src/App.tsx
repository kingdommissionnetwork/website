import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
import ScrollToTop from "./components/ScrollToTop";
import Toast from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, AdminGuard } from "./lib/auth";
import { ToastContext } from "./lib/toast";

const Home = lazy(() => import("./pages/Home"));
const PrayerWall = lazy(() => import("./pages/PrayerWall"));
const BibleReader = lazy(() => import("./pages/BibleReader"));
const Sermons = lazy(() => import("./pages/Sermons"));
const Events = lazy(() => import("./pages/Events"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DonationHistory = lazy(() => import("./pages/DonationHistory"));
const SubscriptionPortal = lazy(() => import("./pages/SubscriptionPortal"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const location = useLocation();
  const isAdminDomain = typeof window !== "undefined" && window.location.hostname.startsWith("admin.");
  const isAdminRoute = location.pathname.startsWith("/admin") || isAdminDomain;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ message, type });
  };

  return (
    <AuthProvider>
      <ToastContext.Provider value={{ showToast }}>
        <div className="min-h-screen bg-cloud-blue">
          <ScrollToTop />
          {!isAdminRoute && <ScrollProgress />}
          {!isAdminRoute && <Navigation />}
          <main>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={isAdminDomain ? <AdminGuard><AdminDashboard /></AdminGuard> : <Home />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/accessibility" element={<Accessibility />} />
                  <Route path="/prayer-wall" element={<PrayerWall />} />
                  <Route path="/bible" element={<BibleReader />} />
                  <Route path="/bible/:book/:chapter" element={<BibleReader />} />
                  <Route path="/sermons" element={<Sermons />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/donations" element={<DonationHistory />} />
                  <Route path="/subscribe" element={<SubscriptionPortal />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/*"
                    element={
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          {!isAdminRoute && <Footer />}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
      </ToastContext.Provider>
    </AuthProvider>
  );
}
