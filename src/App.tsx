import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

export default App;