import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const AuditTrail = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [newAuditLog, setNewAuditLog] = useState({
    action: '',
    entity_type: '',
    entity_id: '',
    old_value: '',
    new_value: ''
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchAuditLogs();
    }
  }, [currentUserUUID]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id, 
          user_id, 
          action, 
          entity_type, 
          entity_id, 
          old_value, 
          new_value, 
          ip_address, 
          user_agent, 
          created_at,
          users (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAuditLogs(data);
    } catch (error) {
      toast.error('Error fetching audit logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logAuditTrail = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          ...newAuditLog,
          user_id: currentUserUUID,
          old_value: JSON.parse(newAuditLog.old_value),
          new_value: JSON.parse(newAuditLog.new_value),
          ip_address: '127.0.0.1', // In a real app, you'd get the actual IP
          user_agent: navigator.userAgent
        }]);
      if (error) throw error;
      toast.success('Audit trail logged successfully!');
      fetchAuditLogs();
      setNewAuditLog({
        action: '',
        entity_type: '',
        entity_id: '',
        old_value: '',
        new_value: ''
      });
    } catch (error) {
      toast.error('Error logging audit trail: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Audit Trail System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Log New Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={logAuditTrail} className="space-y-4">
              <Input
                type="text"
                placeholder="Action"
                value={newAuditLog.action}
                onChange={(e) => setNewAuditLog({ ...newAuditLog, action: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Entity Type"
                value={newAuditLog.entity_type}
                onChange={(e) => setNewAuditLog({ ...newAuditLog, entity_type: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Entity ID"
                value={newAuditLog.entity_id}
                onChange={(e) => setNewAuditLog({ ...newAuditLog, entity_id: e.target.value })}
                required
              />
              <Textarea
                placeholder="Old Value (JSON format)"
                value={newAuditLog.old_value}
                onChange={(e) => setNewAuditLog({ ...newAuditLog, old_value: e.target.value })}
              />
              <Textarea
                placeholder="New Value (JSON format)"
                value={newAuditLog.new_value}
                onChange={(e) => setNewAuditLog({ ...newAuditLog, new_value: e.target.value })}
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Logging...' : 'Log Audit Trail'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading audit logs...</p>
            ) : auditLogs.length === 0 ? (
              <p>No audit logs found.</p>
            ) : (
              <ul className="space-y-4">
                {auditLogs.map((log) => (
                  <li key={log.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>User:</strong> {log.users?.name || log.user_id}</p>
                    <p><strong>Action:</strong> {log.action}</p>
                    <p><strong>Entity Type:</strong> {log.entity_type}</p>
                    <p><strong>Entity ID:</strong> {log.entity_id}</p>
                    <p><strong>Old Value:</strong> {JSON.stringify(log.old_value)}</p>
                    <p><strong>New Value:</strong> {JSON.stringify(log.new_value)}</p>
                    <p><strong>IP Address:</strong> {log.ip_address}</p>
                    <p><strong>User Agent:</strong> {log.user_agent}</p>
                    <p><strong>Created At:</strong> {new Date(log.created_at).toLocaleString()}</p>
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

export default AuditTrail;