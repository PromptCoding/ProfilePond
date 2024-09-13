import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const UserReports = () => {
  const [userReports, setUserReports] = useState([]);
  const [newReport, setNewReport] = useState({
    reported_id: '',
    reason: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchUserReports();
    }
  }, [currentUserUUID]);

  const fetchUserReports = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('user_reports')
        .select(`
          id, 
          reason, 
          status, 
          created_at, 
          resolved_at, 
          resolution,
          reporter:users!reporter_id (id, name),
          reported:users!reported_id (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUserReports(data);
    } catch (error) {
      toast.error('Error fetching user reports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reports')
        .insert([{
          ...newReport,
          reporter_id: currentUserUUID
        }]);
      if (error) throw error;
      toast.success('Report submitted successfully!');
      fetchUserReports();
      setNewReport({
        reported_id: '',
        reason: '',
        status: 'pending'
      });
    } catch (error) {
      toast.error('Error submitting report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (id, newStatus, resolution = '') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reports')
        .update({ 
          status: newStatus, 
          resolution: resolution,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Report status updated successfully');
      fetchUserReports();
    } catch (error) {
      toast.error('Error updating report status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">User Reports System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitReport} className="space-y-4">
              <Input
                type="text"
                placeholder="Reported User ID"
                value={newReport.reported_id}
                onChange={(e) => setNewReport({ ...newReport, reported_id: e.target.value })}
                required
              />
              <Textarea
                placeholder="Reason for report"
                value={newReport.reason}
                onChange={(e) => setNewReport({ ...newReport, reason: e.target.value })}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading user reports...</p>
            ) : userReports.length === 0 ? (
              <p>No user reports found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Resolved At</TableHead>
                    <TableHead>Resolution</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.reporter?.name || 'Unknown'}</TableCell>
                      <TableCell>{report.reported?.name || 'Unknown'}</TableCell>
                      <TableCell>{report.reason}</TableCell>
                      <TableCell>{report.status}</TableCell>
                      <TableCell>{new Date(report.created_at).toLocaleString()}</TableCell>
                      <TableCell>{report.resolved_at ? new Date(report.resolved_at).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>{report.resolution || 'N/A'}</TableCell>
                      <TableCell>
                        {report.status === 'pending' && (
                          <div className="space-x-2">
                            <Button onClick={() => updateReportStatus(report.id, 'resolved', 'Action taken')} size="sm">
                              Resolve (Action)
                            </Button>
                            <Button onClick={() => updateReportStatus(report.id, 'resolved', 'No action needed')} size="sm" variant="outline">
                              Resolve (No action)
                            </Button>
                            <Button onClick={() => updateReportStatus(report.id, 'rejected')} size="sm" variant="destructive">
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserReports;