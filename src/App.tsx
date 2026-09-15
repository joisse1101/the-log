import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "@joisse1101/ui-library/ui-library.css";
import './styles/main.scss';
import 'sonner/dist/styles.css';
import { MainLayout } from '@/layouts/MainLayout';

import Home from './pages/Home';
import { Toaster } from 'sonner';
import TheBoard from './pages/TheBoard';
import TicketDetails from './pages/TicketDetails';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* Parent route using the layout */}
        <Route path="/the-log" element={<MainLayout />}>
          {/* <Route path="about" element={<About />} /> */}
          <Route path="" element={<Home />} />
          <Route path="the-board" element={<TheBoard />} />
          <Route path="the-board/tickets/:ticketId" element={<TicketDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}