import { SessionProvider, useSession } from './context/SessionContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Login from './pages/Login.jsx';
import AdminPortal from './pages/AdminPortal.jsx';
import TeacherPortal from './pages/TeacherPortal.jsx';

function Router() {
  const { session } = useSession();

  if (!session) return <Login />;
  if (session.role === 'admin') return <AdminPortal />;
  if (session.role === 'teacher') return <TeacherPortal />;
  return <Login />;
}

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <Router />
        {/* Hidden print area, populated dynamically before window.print() */}
        <div id="printArea"></div>
      </ToastProvider>
    </SessionProvider>
  );
}
