import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { SeoProvider } from './contexts/SeoContext';
import { useTheme } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import SkillsPage from './pages/SkillsPage';
import SkillDetailPage from './pages/SkillDetailPage';
import AboutPage from './pages/AboutPage';
import DocsPage from './pages/DocsPage';
import DownloadPage from './pages/DownloadPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LicensePage from './pages/LicensePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import BlogEditPage from './pages/BlogEditPage';
import ProfileLayout from './components/ProfileLayout';
import ProfileInfoPage from './pages/profile/ProfileInfoPage';
import ProfileSkillsPage from './pages/profile/ProfileSkillsPage';
import ProfileAnalyticsPage from './pages/profile/ProfileAnalyticsPage';
import ProfileFavoritesPage from './pages/profile/ProfileFavoritesPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';
import ProtectedAdminLayout from './components/ProtectedAdminLayout';
import { DocumentHead } from './components/DocumentHead';

function App() {
  const { theme } = useTheme();
  return (
    <Tooltip.Provider delayDuration={300}>
    <SiteSettingsProvider>
    <SeoProvider>
    <AuthProvider>
      <Toaster 
        position="top-right" 
        theme={theme}
        richColors 
        closeButton 
        offset={80}
        expand
        visibleToasts={6}
        gap={10}
        toastOptions={{
          classNames: {
            toast: 'botskill-toast',
            closeButton: 'botskill-toast-close',
          },
        }}
      />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DocumentHead />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/skills" element={<Layout />}>
            <Route index element={<SkillsPage />} />
            <Route path=":id" element={<SkillDetailPage />} />
          </Route>
          <Route path="/about" element={<Layout />}>
            <Route index element={<AboutPage />} />
          </Route>
          <Route path="/contact" element={<Layout />}>
            <Route index element={<ContactPage />} />
          </Route>
          <Route path="/privacy" element={<Layout />}>
            <Route index element={<PrivacyPage />} />
          </Route>
          <Route path="/terms" element={<Layout />}>
            <Route index element={<TermsPage />} />
          </Route>
          <Route path="/license" element={<Layout />}>
            <Route index element={<LicensePage />} />
          </Route>
          <Route path="/docs" element={<Layout />}>
            <Route index element={<DocsPage />} />
          </Route>
          <Route path="/download" element={<Layout />}>
            <Route index element={<DownloadPage />} />
          </Route>
          <Route path="/login" element={<Layout />}>
            <Route index element={<LoginPage />} />
          </Route>
          <Route path="/register" element={<Layout />}>
            <Route index element={<RegisterPage />} />
          </Route>
          <Route path="/profile" element={<Layout />}>
            <Route element={<ProfileLayout />}>
              <Route index element={<ProfileInfoPage />} />
              <Route path="skills" element={<ProfileSkillsPage />} />
              <Route path="favorites" element={<ProfileFavoritesPage />} />
              <Route path="analytics" element={<ProfileAnalyticsPage />} />
            </Route>
          </Route>
          <Route path="/admin" element={<ProtectedAdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="dashboard" element={<AdminPage />} />
            <Route path="users" element={<AdminPage />} />
            <Route path="skills" element={<AdminPage />} />
            <Route path="blogs" element={<AdminPage />} />
            <Route path="categories" element={<AdminPage />} />
            <Route path="roles" element={<AdminPage />} />
            <Route path="permissions" element={<AdminPage />} />
            <Route path="settings" element={<AdminPage />} />
          </Route>
          <Route path="/blog" element={<Layout />}>
            <Route index element={<BlogPage />} />
            <Route path=":slug" element={<BlogDetailPage />} />
          </Route>
          <Route path="/blog/edit/:id" element={<BlogEditPage />} />
          <Route path="/blog/new" element={<BlogEditPage />} />
        </Routes>
      </Router>
    </AuthProvider>
    </SeoProvider>
    </SiteSettingsProvider>
    </Tooltip.Provider>
  );
}

export default App;