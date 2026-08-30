import AdminRoute from "./components/AdminRoute";
import GovernmentRoute from "./components/GovernmentRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import AIVisionCenter from "./pages/AIVisionCenter";
import EmergencyResponse from "./pages/EmergencyResponse";
import AdminCenter from "./pages/AdminCenter";
import IncidentManagement from "./pages/IncidentManagement";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./components/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { ThemeProvider } from "./theme/ThemeContext";
import "./theme/themes.css";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* =================================================
              PUBLIC
              ================================================= */}

          <Route
            path="/"
            element={<Login />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* =================================================
              AUTHENTICATED USERS
              ================================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <IncidentManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              OWN PROFILE
              ================================================= */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              GOVERNMENT + ADMIN
              ================================================= */}

          <Route
            path="/emergency-response"
            element={
              <GovernmentRoute>
                <EmergencyResponse />
              </GovernmentRoute>
            }
          />

          <Route
            path="/ai-vision"
            element={
              <GovernmentRoute>
                <AIVisionCenter />
              </GovernmentRoute>
            }
          />

          {/* =================================================
              ADMIN ONLY
              ================================================= */}

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminCenter />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;