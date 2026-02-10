import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith('/admin');
  const isProfilePage = pathname.startsWith('/profile');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isAdminPage && !isProfilePage && <Footer />}
    </div>
  );
};

export default Layout;