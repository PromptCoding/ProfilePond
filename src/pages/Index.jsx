import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Index = () => {
  const sections = [
    {
      title: "Project Management",
      routes: [
        { path: "/project-management", name: "Project Management" },
        { path: "/milestone-payment", name: "Milestone Payment" },
        { path: "/time-tracking", name: "Time Tracking" },
        { path: "/project-tags", name: "Project Tags" },
      ]
    },
    {
      title: "User Management",
      routes: [
        { path: "/user-management", name: "User Management" },
        { path: "/user-verification", name: "User Verification" },
        { path: "/user-preferences", name: "User Preferences" },
        { path: "/user-reports", name: "User Reports" },
      ]
    },
    {
      title: "Marketplace",
      routes: [
        { path: "/bidding", name: "Bidding System" },
        { path: "/skill-management", name: "Skill Management" },
        { path: "/portfolio", name: "Portfolio" },
      ]
    },
    {
      title: "Communication & Feedback",
      routes: [
        { path: "/communication", name: "Communication" },
        { path: "/review-feedback", name: "Review & Feedback" },
        { path: "/dispute-resolution", name: "Dispute Resolution" },
      ]
    },
    {
      title: "Financial Management",
      routes: [
        { path: "/financial-management", name: "Financial Management" },
        { path: "/stripe-accounts", name: "Stripe Accounts" },
        { path: "/currency-rates", name: "Currency Rates" },
      ]
    },
    {
      title: "Team & Content Management",
      routes: [
        { path: "/team-management", name: "Team Management" },
        { path: "/content-management", name: "Content Management" },
      ]
    },
    {
      title: "Analytics & Reporting",
      routes: [
        { path: "/analytics-reporting", name: "Analytics & Reporting" },
        { path: "/user-test-results", name: "User Test Results" },
      ]
    },
    {
      title: "Security & Moderation",
      routes: [
        { path: "/moderation-security", name: "Moderation & Security" },
        { path: "/api-rate-limiting", name: "API Rate Limiting" },
        { path: "/auth-sessions", name: "Auth Sessions" },
      ]
    },
    {
      title: "System Management",
      routes: [
        { path: "/system-configuration", name: "System Configuration" },
        { path: "/error-logging", name: "Error Logging" },
        { path: "/audit-trail", name: "Audit Trail" },
        { path: "/refresh-log", name: "Refresh Log" },
      ]
    },
    {
      title: "Notifications & Referrals",
      routes: [
        { path: "/notifications", name: "Notifications" },
        { path: "/referral", name: "Referral System" },
      ]
    },
    {
      title: "Subscription",
      routes: [
        { path: "/subscription", name: "Subscription System" },
      ]
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Welcome to ProfilePond</h1>
        <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          Dive into a world where managing your profile is as easy as a splash in the pond. 
          Create, update, and showcase your digital identity with ProfilePond!
        </p>
        {sections.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.routes.map((route) => (
                <Link key={route.path} to={route.path}>
                  <Button variant="outline" className="w-full">
                    {route.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Index;