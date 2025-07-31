import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";
import { ROUTES } from "@/lib/constants";

// Pages  
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AppLayout } from "@/pages/AppLayout";

// Feature Pages
import { EquityDashboard } from "@/components/features/equity/EquityDashboard";
import { ChatDashboard } from "@/components/features/chat/ChatDashboard";
import { FreelanceDashboard } from "@/components/features/freelance/FreelanceDashboard";
import { ProfileDashboard } from "@/components/features/profile/ProfileDashboard";

// Styles
import "@/styles/globals.css";

function App() {
  return (
    <ThirdwebProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Landing Page */}
            <Route path={ROUTES.HOME} element={<LandingPage />} />
            
            {/* App Routes with Layout */}
            <Route path="/app" element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="equity" element={<EquityDashboard />} />
              <Route path="chat" element={<ChatDashboard />} />
              <Route path="freelance" element={<FreelanceDashboard />} />
              <Route path="profile" element={<ProfileDashboard />} />
              
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="/app/dashboard" replace />} />
            </Route>
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </div>
      </Router>
    </ThirdwebProvider>
  );
}

export default App;