import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import PrivateLayout from './components/Layout/PrivateLayout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import MainPage from './components/MainPage/MainPage';
import Profile from './components/Profile/Profile';
import ProfileEdit from './components/Profile/ProfileEdit';
import Rules from './components/Rules/Rules';
import CreateMessagePage from './components/MainPage/CreateMessagePage';
import MessagePage from './components/MainPage/MessagePage';
import MyMessagesPage from './components/MessagesPage/MyMessagesPage';
import AllMessagesPage from './components/MessagesPage/AllMessagesPage';
import { MessagesProvider } from './contexts/MessagesContext';
import DraftsPage from './components/DraftsPage/DraftsPage';
import EditDraftPage from './components/DraftsPage/EditDraftPage';
import AdminPanel from './components/MainPage/AdminPanel';
import { ThemeProvider } from './contexts/ThemeContext';
import AboutProject from './components/AboutProject/AboutProject';
import Notifications from './components/Notifications/Notifications';
import EditMessagePage from './components/MainPage/EditMessagePage';
import UnifiedMessagesPage from './components/MessagesPage/UnifiedMessagesPage';
import './styles/theme.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider> {/* ← обёртка для всей темы */}
        <MessagesProvider>
          <Routes>
            <Route path="/" element={<Layout><Login /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
            <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
            <Route path="/rules" element={<Rules />} />

            <Route path="/main" element={<PrivateLayout><MainPage /></PrivateLayout>} />
            <Route path="/profile" element={<PrivateLayout><Profile /></PrivateLayout>} />
            <Route path="/profile/edit" element={<PrivateLayout><ProfileEdit /></PrivateLayout>} />
            <Route path="/create-message" element={<PrivateLayout><CreateMessagePage /></PrivateLayout>} />
            <Route path="/create-message/:id" element={<PrivateLayout><CreateMessagePage /></PrivateLayout>} />
            <Route path="/message/:id" element={<PrivateLayout><MessagePage /></PrivateLayout>} />
            <Route path="/my-messages" element={<PrivateLayout><MyMessagesPage /></PrivateLayout>} />
            <Route path="/all-messages" element={<PrivateLayout><AllMessagesPage /></PrivateLayout>} />
            <Route path="/drafts" element={<PrivateLayout><DraftsPage /></PrivateLayout>} />
            <Route path="/edit-draft/:id" element={<PrivateLayout><EditDraftPage /></PrivateLayout>} />
            <Route path="/admin" element={<PrivateLayout><AdminPanel /></PrivateLayout>} />
            <Route path="/about" element={<PrivateLayout><AboutProject /></PrivateLayout>} />
            <Route path="/notifications" element={<PrivateLayout><Notifications /></PrivateLayout>} />
            <Route path="/edit/:id" element={<PrivateLayout><EditMessagePage /></PrivateLayout>} />
            <Route path="/unified" element={<PrivateLayout><UnifiedMessagesPage /></PrivateLayout>} />
          </Routes>
        </MessagesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;