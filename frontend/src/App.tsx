import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { AnnouncementBanner } from './components/AnnouncementBanner';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SellPage } from './pages/SellPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CommentCaMarchePage } from './pages/CommentCaMarchePage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { CmsPageView } from './pages/CmsPageView';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSellerRoute = location.pathname.startsWith('/seller');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isStorefront = !isAdminRoute && !isSellerRoute && !isAuthPage;

  return (
    <div className="flex flex-col min-h-screen">
      {isStorefront && (
        <>
          <AnnouncementBanner />
          <Navbar />
        </>
      )}
      <main className="flex-1">
        <Routes>
          {/* Authentification Split Screen Moderne */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 1. VITRINE CLIENT & SHOPPING */}
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Achats & Suivi Client */}
          <Route
            path="/checkout/:productId"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 2. ESPACE VENDEUR DÉDIÉ (SELLER HUB) */}
          <Route
            path="/seller"
            element={
              <ProtectedRoute>
                <SellerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sell"
            element={
              <ProtectedRoute>
                <SellPage />
              </ProtectedRoute>
            }
          />

          {/* 3. CONSOLE ADMINISTRATEUR SAAS */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* 4. PAGES PUBLIQUES : AIDE, CONTACT & LÉGAL */}
          <Route path="/comment-ca-marche" element={<CommentCaMarchePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cgu" element={<CmsPageView fixedSlug="cgu" />} />
          <Route path="/confidentialite" element={<CmsPageView fixedSlug="confidentialite" />} />
          <Route path="/mentions-legales" element={<CmsPageView fixedSlug="mentions-legales" />} />
          <Route path="/p/:slug" element={<CmsPageView />} />

          {/* Redirection 404 vers l'accueil vitrine */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isStorefront && <Footer />}
      <AuthModal />
      <CartDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <AppLayout />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
