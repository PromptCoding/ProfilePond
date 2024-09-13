import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsReporting = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [seasonalTrends, setSeasonalTrends] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchAnalyticsData();
      fetchSeasonalTrends();
    }
  }, [currentUserUUID]);

  const fetchAnalyticsData = async () => {
    try {
      let { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      setAnalyticsData(data);
    } catch (error) {
      toast.error('Error fetching analytics data: ' + error.message);
    }
  };

  const fetchSeasonalTrends = async () => {
    try {
      let { data, error } = await supabase
        .from('seasonal_trends')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });
      if (error) throw error;
      setSeasonalTrends(data);
    } catch (error) {
      toast.error('Error fetching seasonal trends: ' + error.message);
    }
  };

  const generateReport = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.rpc('generate_report', { 
        start_date: startDate, 
        end_date: endDate 
      });
      if (error) throw error;
      toast.success('Report generated successfully');
      console.log('Report generated:', data);
      // Here you would typically update the state with the generated report data
      // and display it in the UI
    } catch (error) {
      toast.error('Error generating report: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Analytics and Reporting System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Custom Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={generateReport} className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Generate Report</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analytics Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="metric_value" stroke="#8884d8" name="Metric Value" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Seasonal Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={seasonalTrends}>
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="project_count" stroke="#82ca9d" name="Project Count" />
                <Line yAxisId="right" type="monotone" dataKey="avg_bid_amount" stroke="#ffc658" name="Avg Bid Amount" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">Analytics Data</h3>
            <ul className="list-disc pl-5 mb-4">
              {analyticsData.map((item, index) => (
                <li key={index}>
                  Date: {item.date}, Metric: {item.metric_name}, Value: {item.metric_value}
                </li>
              ))}
            </ul>
            <h3 className="text-xl font-semibold mb-2">Seasonal Trends</h3>
            <ul className="list-disc pl-5">
              {seasonalTrends.map((item, index) => (
                <li key={index}>
                  Year: {item.year}, Month: {item.month}, Category: {item.category}, 
                  Project Count: {item.project_count}, Avg Bid Amount: ${item.avg_bid_amount.toFixed(2)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AnalyticsReporting;