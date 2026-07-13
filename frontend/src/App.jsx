import TrafficOperations from "./pages/TrafficOperations";
import EmergencyOperations from "./pages/EmergencyOperations";
import AISurveillance from "./pages/AISurveillance";
import GreenCorridor from "./pages/GreenCorridor";
import EmergencyRouting from "./pages/EmergencyRouting";

import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import AdminRoute from "./components/AdminRoute";
import GovernmentRoute from "./components/GovernmentRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import DemoControlCenter
from "./pages/DemoControlCenter";
import TrafficIntelligenceCenter from "./pages/TrafficIntelligenceCenter";
import TrafficControl from "./pages/TrafficControl";
import EmergencyCenter from "./pages/EmergencyCenter";
import AccidentDashboard from "./pages/AccidentDashboard";
import HeatmapDashboard from "./pages/HeatmapDashboard";
import PredictionDashboard from "./pages/PredictionDashboard";
import EmergencyDashboard from "./pages/EmergencyDashboard";
import MultiLaneDashboard from "./pages/MultiLaneDashboard";
import SmartSignalDashboard from "./pages/SmartSignalDashboard";
import AnalysisHistory
from "./pages/AnalysisHistory";
import AIVisionCenter from "./pages/AIVisionCenter";
import EmergencyResponse from "./pages/EmergencyResponse";
import AdminCenter from "./pages/AdminCenter";

import IncidentManagement from "./pages/IncidentManagement";

import { Navigate } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";




function App() {
  return (
   <BrowserRouter>
  <Routes>

    {/* Command Center = Home */}

    <Route
  path="/"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

    {/* Dashboard */}

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

   

    

    {/* Incident Management */}

    <Route
      path="/incidents"
      element={
        <ProtectedRoute>
          <IncidentManagement />
        </ProtectedRoute>
      }
    />

    

  <Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminCenter />
    </AdminRoute>
  }
/>

    <Route
  path="/emergency-response"
  element={
    <ProtectedRoute>
      <EmergencyResponse />
    </ProtectedRoute>
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

<Route
  path="/analysis-history"
  element={
     <ProtectedRoute>
    <AnalysisHistory />
     </ProtectedRoute>
  }
/>

<Route
  path="/smart-signal"
  element={
    <ProtectedRoute>
      <SmartSignalDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/multi-lane"
  element={
     <ProtectedRoute>
  <MultiLaneDashboard />
   </ProtectedRoute>
  }
/>

<Route
  path="/emergency"
  element={
   <ProtectedRoute>
  <EmergencyDashboard />
   </ProtectedRoute>
  }
/>

<Route
  path="/prediction"
  element={
   <ProtectedRoute>
  <PredictionDashboard />
   </ProtectedRoute>
  }
/>

<Route
  path="/heatmap"
  element={
   <ProtectedRoute>
  <HeatmapDashboard />
   </ProtectedRoute>
  }
/>

<Route
  path="/accident"
  element={
   <ProtectedRoute>
  <AccidentDashboard />
   </ProtectedRoute>
  }
/>

<Route
  path="/emergency-center"
  element={
    <GovernmentRoute>
      <EmergencyCenter />
    </GovernmentRoute>
  }
/>

<Route
  path="/traffic-control"
  element={
   <ProtectedRoute>
  <TrafficControl />
   </ProtectedRoute>
  }
/>

<Route
  path="/traffic-intelligence-center"
  element={
   <ProtectedRoute>
  <TrafficIntelligenceCenter />
   </ProtectedRoute>
  }
/>

<Route
  path="/demo-control"
  element={
    <GovernmentRoute>
      <DemoControlCenter />
    </GovernmentRoute>
  }
/>

<Route
  path="/advanced-analytics"
  element={
    <ProtectedRoute>
      <AdvancedAnalytics />
    </ProtectedRoute>
  }
/>



<Route
  path="/green-corridor"
  element={
    <GovernmentRoute>
      <GreenCorridor />
    </GovernmentRoute>
  }
/>

<Route
  path="/emergency-routing"
  element={
    <GovernmentRoute>
      <EmergencyRouting />
    </GovernmentRoute>
  }
/>

<Route
  path="/traffic-operations"
  element={<TrafficOperations />}
/>

<Route
  path="/emergency-operations"
  element={<EmergencyOperations />}
/>

<Route
  path="/ai-surveillance"
  element={<AISurveillance />}
/>


    <Route
      path="/login"
      element={<Login />}
    />

    <Route
      path="/register"
      element={<Register />}
    />

  </Routes>
</BrowserRouter>
  );
}

export default App;