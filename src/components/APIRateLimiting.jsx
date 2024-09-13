import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const APIRateLimiting = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);
  const [newApiKey, setNewApiKey] = useState({ user_id: '', name: '', expires_at: '' });
  const [newRateLimit, setNewRateLimit] = useState({ key: '', requests: 0 });
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchApiKeys();
      fetchRateLimits();
    }
  }, [currentUserUUID]);

  const fetchApiKeys = async () => {
    try {
      let { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApiKeys(data);
    } catch (error) {
      toast.error('Error fetching API keys: ' + error.message);
    }
  };

  const fetchRateLimits = async () => {
    try {
      let { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .order('window_start', { ascending: false });
      if (error) throw error;
      setRateLimits(data);
    } catch (error) {
      toast.error('Error fetching rate limits: ' + error.message);
    }
  };

  const createApiKey = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{ ...newApiKey, user_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('API key created successfully!');
      fetchApiKeys();
      setNewApiKey({ user_id: '', name: '', expires_at: '' });
    } catch (error) {
      toast.error('Error creating API key: ' + error.message);
    }
  };

  const setRateLimit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .upsert([{ ...newRateLimit, window_start: new Date().toISOString() }]);
      if (error) throw error;
      toast.success('Rate limit set successfully!');
      fetchRateLimits();
      setNewRateLimit({ key: '', requests: 0 });
    } catch (error) {
      toast.error('Error setting rate limit: ' + error.message);
    }
  };

  const revokeApiKey = async (id) => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('API key revoked successfully!');
      fetchApiKeys();
    } catch (error) {
      toast.error('Error revoking API key: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">API and Rate Limiting System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createApiKey} className="space-y-4">
              <Input
                type="text"
                placeholder="Key Name"
                value={newApiKey.name}
                onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                required
              />
              <Input
                type="datetime-local"
                placeholder="Expires At"
                value={newApiKey.expires_at}
                onChange={(e) => setNewApiKey({ ...newApiKey, expires_at: e.target.value })}
                required
              />
              <Button type="submit">Create API Key</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Set Rate Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={setRateLimit} className="space-y-4">
              <Input
                type="text"
                placeholder="Key"
                value={newRateLimit.key}
                onChange={(e) => setNewRateLimit({ ...newRateLimit, key: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Requests"
                value={newRateLimit.requests}
                onChange={(e) => setNewRateLimit({ ...newRateLimit, requests: parseInt(e.target.value) })}
                required
              />
              <Button type="submit">Set Rate Limit</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {apiKeys.map((apiKey) => (
                <li key={apiKey.id} className="bg-gray-100 p-2 rounded flex justify-between items-center">
                  <div>
                    <p><strong>Name:</strong> {apiKey.name}</p>
                    <p><strong>Expires:</strong> {new Date(apiKey.expires_at).toLocaleString()}</p>
                    <p><strong>Last Used:</strong> {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleString() : 'Never'}</p>
                  </div>
                  <Button onClick={() => revokeApiKey(apiKey.id)} variant="destructive">Revoke</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rateLimits.map((rateLimit) => (
                <li key={rateLimit.key} className="bg-gray-100 p-2 rounded">
                  <p><strong>Key:</strong> {rateLimit.key}</p>
                  <p><strong>Requests:</strong> {rateLimit.requests}</p>
                  <p><strong>Window Start:</strong> {new Date(rateLimit.window_start).toLocaleString()}</p>
                  <p><strong>Last Reset:</strong> {rateLimit.last_reset ? new Date(rateLimit.last_reset).toLocaleString() : 'Never'}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default APIRateLimiting;