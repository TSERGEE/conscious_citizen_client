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

function App() {
  return (
    <BrowserRouter>
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
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;