import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const RefreshLog = () => {
  const [refreshLogs, setRefreshLogs] = useState([]);
  const [newRefreshLog, setNewRefreshLog] = useState({
    table_name: '',
    view_name: '',
    status: 'pending',
    details: ''
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchRefreshLogs();
    }
  }, [currentUserUUID]);

  const fetchRefreshLogs = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('refresh_log')
        .select('*')
        .order('refresh_date', { ascending: false });
      if (error) throw error;
      setRefreshLogs(data);
    } catch (error) {
      toast.error('Error fetching refresh logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addRefreshLog = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('refresh_log')
        .insert([{
          ...newRefreshLog,
          refresh_date: new Date().toISOString()
        }]);
      if (error) throw error;
      toast.success('Refresh log added successfully!');
      fetchRefreshLogs();
      setNewRefreshLog({
        table_name: '',
        view_name: '',
        status: 'pending',
        details: ''
      });
    } catch (error) {
      toast.error('Error adding refresh log: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRefreshLogStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('refresh_log')
        .update({ status: newStatus, last_refresh: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Refresh log status updated to ${newStatus}`);
      fetchRefreshLogs();
    } catch (error) {
      toast.error('Error updating refresh log status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Refresh Log System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Refresh Log</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addRefreshLog} className="space-y-4">
              <Input
                type="text"
                placeholder="Table Name"
                value={newRefreshLog.table_name}
                onChange={(e) => setNewRefreshLog({ ...newRefreshLog, table_name: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="View Name"
                value={newRefreshLog.view_name}
                onChange={(e) => setNewRefreshLog({ ...newRefreshLog, view_name: e.target.value })}
              />
              <Select
                value={newRefreshLog.status}
                onValueChange={(value) => setNewRefreshLog({ ...newRefreshLog, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Details"
                value={newRefreshLog.details}
                onChange={(e) => setNewRefreshLog({ ...newRefreshLog, details: e.target.value })}
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Refresh Log'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refresh Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading refresh logs...</p>
            ) : refreshLogs.length === 0 ? (
              <p>No refresh logs found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Table Name</TableHead>
                    <TableHead>View Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refresh Date</TableHead>
                    <TableHead>Last Refresh</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refreshLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell>{log.view_name || 'N/A'}</TableCell>
                      <TableCell>{log.status}</TableCell>
                      <TableCell>{new Date(log.refresh_date).toLocaleString()}</TableCell>
                      <TableCell>{log.last_refresh ? new Date(log.last_refresh).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell>
                        {log.status === 'pending' && (
                          <Button onClick={() => updateRefreshLogStatus(log.id, 'in_progress')} size="sm">Start</Button>
                        )}
                        {log.status === 'in_progress' && (
                          <>
                            <Button onClick={() => updateRefreshLogStatus(log.id, 'completed')} size="sm" className="mr-2">Complete</Button>
                            <Button onClick={() => updateRefreshLogStatus(log.id, 'failed')} size="sm" variant="destructive">Fail</Button>
                          </>
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

export default RefreshLog;