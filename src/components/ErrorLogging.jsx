import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const ErrorLogging = () => {
  const [errorLogs, setErrorLogs] = useState([]);
  const [newErrorLog, setNewErrorLog] = useState({
    error_message: '',
    error_detail: '',
    error_hint: '',
    error_context: ''
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchErrorLogs();
    }
  }, [currentUserUUID]);

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setErrorLogs(data);
    } catch (error) {
      toast.error('Error fetching error logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logError = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('error_logs')
        .insert([newErrorLog]);
      if (error) throw error;
      toast.success('Error logged successfully!');
      fetchErrorLogs();
      setNewErrorLog({
        error_message: '',
        error_detail: '',
        error_hint: '',
        error_context: ''
      });
    } catch (error) {
      toast.error('Error logging new error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteErrorLog = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('error_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Error log deleted successfully!');
      fetchErrorLogs();
    } catch (error) {
      toast.error('Error deleting error log: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Error Logging System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Log New Error</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={logError} className="space-y-4">
              <Input
                type="text"
                placeholder="Error Message"
                value={newErrorLog.error_message}
                onChange={(e) => setNewErrorLog({ ...newErrorLog, error_message: e.target.value })}
                required
              />
              <Textarea
                placeholder="Error Detail"
                value={newErrorLog.error_detail}
                onChange={(e) => setNewErrorLog({ ...newErrorLog, error_detail: e.target.value })}
              />
              <Input
                type="text"
                placeholder="Error Hint"
                value={newErrorLog.error_hint}
                onChange={(e) => setNewErrorLog({ ...newErrorLog, error_hint: e.target.value })}
              />
              <Textarea
                placeholder="Error Context"
                value={newErrorLog.error_context}
                onChange={(e) => setNewErrorLog({ ...newErrorLog, error_context: e.target.value })}
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Logging...' : 'Log Error'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading error logs...</p>
            ) : errorLogs.length === 0 ? (
              <p>No error logs found.</p>
            ) : (
              <ul className="space-y-4">
                {errorLogs.map((log) => (
                  <li key={log.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>Message:</strong> {log.error_message}</p>
                    <p><strong>Detail:</strong> {log.error_detail}</p>
                    <p><strong>Hint:</strong> {log.error_hint}</p>
                    <p><strong>Context:</strong> {log.error_context}</p>
                    <p><strong>Created At:</strong> {new Date(log.created_at).toLocaleString()}</p>
                    <Button 
                      onClick={() => deleteErrorLog(log.id)} 
                      variant="destructive"
                      className="mt-2"
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ErrorLogging;