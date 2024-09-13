import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const AuthSessions = () => {
  const [authSessions, setAuthSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchAuthSessions();
    }
  }, [currentUserUUID]);

  const fetchAuthSessions = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('auth_sessions')
        .select(`
          id, 
          user_id, 
          token, 
          expires_at, 
          created_at, 
          last_used_at, 
          ip_address, 
          user_agent,
          user:users (id, name)
        `)
        .eq('user_id', currentUserUUID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAuthSessions(data);
    } catch (error) {
      toast.error('Error fetching auth sessions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auth_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Session revoked successfully');
      fetchAuthSessions();
    } catch (error) {
      toast.error('Error revoking session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLastUsed = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auth_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Session last used time updated successfully');
      fetchAuthSessions();
    } catch (error) {
      toast.error('Error updating last used time: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Authentication Sessions System</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading sessions...</p>
            ) : authSessions.length === 0 ? (
              <p>No active sessions found.</p>
            ) : (
              <ul className="space-y-4">
                {authSessions.map((session) => (
                  <li key={session.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>User:</strong> {session.user?.name || session.user_id}</p>
                    <p><strong>Token:</strong> {session.token.substring(0, 10)}...</p>
                    <p><strong>Expires At:</strong> {new Date(session.expires_at).toLocaleString()}</p>
                    <p><strong>Created At:</strong> {new Date(session.created_at).toLocaleString()}</p>
                    <p><strong>Last Used:</strong> {session.last_used_at ? new Date(session.last_used_at).toLocaleString() : 'Never'}</p>
                    <p><strong>IP Address:</strong> {session.ip_address}</p>
                    <p><strong>User Agent:</strong> {session.user_agent}</p>
                    <div className="mt-2 space-x-2">
                      <Button onClick={() => revokeSession(session.id)} variant="destructive">
                        Revoke Session
                      </Button>
                      <Button onClick={() => updateLastUsed(session.id)} variant="outline">
                        Update Last Used
                      </Button>
                    </div>
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

export default AuthSessions;