import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const SystemConfiguration = () => {
  const [configs, setConfigs] = useState([]);
  const [newConfig, setNewConfig] = useState({ key: '', value: '', description: '' });
  const [editingConfig, setEditingConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchConfigs();
    }
  }, [currentUserUUID]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('key');
      if (error) throw error;
      setConfigs(data);
    } catch (error) {
      toast.error('Error fetching system configurations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addConfig = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('system_config')
        .insert([{
          ...newConfig,
          value: JSON.parse(newConfig.value),
          updated_by: currentUserUUID
        }]);
      if (error) throw error;
      toast.success('Configuration added successfully');
      fetchConfigs();
      setNewConfig({ key: '', value: '', description: '' });
    } catch (error) {
      toast.error('Error adding configuration: ' + error.message);
    }
  };

  const updateConfig = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('system_config')
        .update({
          value: JSON.parse(editingConfig.value),
          description: editingConfig.description,
          updated_by: currentUserUUID
        })
        .eq('key', editingConfig.key);
      if (error) throw error;
      toast.success('Configuration updated successfully');
      fetchConfigs();
      setEditingConfig(null);
    } catch (error) {
      toast.error('Error updating configuration: ' + error.message);
    }
  };

  const deleteConfig = async (key) => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .delete()
        .eq('key', key);
      if (error) throw error;
      toast.success('Configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      toast.error('Error deleting configuration: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">System Configuration</h1>
          <p>Loading configurations...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">System Configuration</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addConfig} className="space-y-4">
              <Input
                type="text"
                placeholder="Key"
                value={newConfig.key}
                onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                required
              />
              <Textarea
                placeholder="Value (JSON format)"
                value={newConfig.value}
                onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Description"
                value={newConfig.description}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                required
              />
              <Button type="submit">Add Configuration</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            {configs.length === 0 ? (
              <p>No configurations found.</p>
            ) : (
              <ul className="space-y-4">
                {configs.map((config) => (
                  <li key={config.key} className="bg-gray-100 p-4 rounded-md">
                    {editingConfig && editingConfig.key === config.key ? (
                      <form onSubmit={updateConfig} className="space-y-2">
                        <strong>{config.key}</strong>
                        <Textarea
                          value={editingConfig.value}
                          onChange={(e) => setEditingConfig({ ...editingConfig, value: e.target.value })}
                          required
                        />
                        <Input
                          type="text"
                          value={editingConfig.description}
                          onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                          required
                        />
                        <div className="space-x-2">
                          <Button type="submit">Save</Button>
                          <Button variant="outline" onClick={() => setEditingConfig(null)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <strong>{config.key}</strong>: {JSON.stringify(config.value)}
                        <p className="text-sm text-gray-600">{config.description}</p>
                        <div className="mt-2 space-x-2">
                          <Button onClick={() => setEditingConfig({ ...config, value: JSON.stringify(config.value) })}>Edit</Button>
                          <Button variant="destructive" onClick={() => deleteConfig(config.key)}>Delete</Button>
                        </div>
                      </>
                    )}
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

export default SystemConfiguration;