import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from './components/AuthProvider';

// Import components for each module
import UserManagement from './components/UserManagement';
import ProjectManagement from './components/ProjectManagement';
import BiddingSystem from './components/BiddingSystem';
import MilestonePayment from './components/MilestonePayment';
import TimeTracking from './components/TimeTracking';
import ReviewFeedback from './components/ReviewFeedback';
import Communication from './components/Communication';
import DisputeResolution from './components/DisputeResolution';
import SkillManagement from './components/SkillManagement';
import FinancialManagement from './components/FinancialManagement';
import TeamManagement from './components/TeamManagement';
import ContentManagement from './components/ContentManagement';
import AnalyticsReporting from './components/AnalyticsReporting';
import ModerationSecurity from './components/ModerationSecurity';
import APIRateLimiting from './components/APIRateLimiting';
import NotificationSystem from './components/NotificationSystem';
import UserPreferences from './components/UserPreferences';
import SystemConfiguration from './components/SystemConfiguration';
import ErrorLogging from './components/ErrorLogging';
import AuditTrail from './components/AuditTrail';
import Portfolio from './components/Portfolio';
import UserVerification from './components/UserVerification';
import ReferralSystem from './components/ReferralSystem';
import SubscriptionSystem from './components/SubscriptionSystem';
import AuthSessions from './components/AuthSessions';
import CurrencyRates from './components/CurrencyRates';
import RefreshLog from './components/RefreshLog';
import ProjectTags from './components/ProjectTags';
import StripeAccounts from './components/StripeAccounts';
import UserTestResults from './components/UserTestResults';
import UserReports from './components/UserReports';
import Index from './pages/Index';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/project-management" element={<ProjectManagement />} />
                <Route path="/bidding" element={<BiddingSystem />} />
                <Route path="/milestone-payment" element={<MilestonePayment />} />
                <Route path="/time-tracking" element={<TimeTracking />} />
                <Route path="/review-feedback" element={<ReviewFeedback />} />
                <Route path="/communication" element={<Communication />} />
                <Route path="/dispute-resolution" element={<DisputeResolution />} />
                <Route path="/skill-management" element={<SkillManagement />} />
                <Route path="/financial-management" element={<FinancialManagement />} />
                <Route path="/team-management" element={<TeamManagement />} />
                <Route path="/content-management" element={<ContentManagement />} />
                <Route path="/analytics-reporting" element={<AnalyticsReporting />} />
                <Route path="/moderation-security" element={<ModerationSecurity />} />
                <Route path="/api-rate-limiting" element={<APIRateLimiting />} />
                <Route path="/notifications" element={<NotificationSystem />} />
                <Route path="/user-preferences" element={<UserPreferences />} />
                <Route path="/system-configuration" element={<SystemConfiguration />} />
                <Route path="/error-logging" element={<ErrorLogging />} />
                <Route path="/audit-trail" element={<AuditTrail />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/user-verification" element={<UserVerification />} />
                <Route path="/referral" element={<ReferralSystem />} />
                <Route path="/subscription" element={<SubscriptionSystem />} />
                <Route path="/auth-sessions" element={<AuthSessions />} />
                <Route path="/currency-rates" element={<CurrencyRates />} />
                <Route path="/refresh-log" element={<RefreshLog />} />
                <Route path="/project-tags" element={<ProjectTags />} />
                <Route path="/stripe-accounts" element={<StripeAccounts />} />
                <Route path="/user-test-results" element={<UserTestResults />} />
                <Route path="/user-reports" element={<UserReports />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;