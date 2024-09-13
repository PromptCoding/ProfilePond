import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const UserPreferences = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchUserPreferences();
    }
  }, [currentUserUUID]);

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', currentUserUUID)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default preferences
          const defaultPreferences = {
            user_id: currentUserUUID,
            email_notifications: true,
            sms_notifications: false,
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            currency: 'USD'
          };
          await createDefaultPreferences(defaultPreferences);
        } else {
          throw error;
        }
      } else {
        setUserPreferences(data);
      }
    } catch (error) {
      toast.error('Error fetching user preferences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async (defaultPreferences) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([defaultPreferences]);
      
      if (error) throw error;
      
      setUserPreferences(defaultPreferences);
    } catch (error) {
      toast.error('Error creating default preferences: ' + error.message);
    }
  };

  const updatePreferences = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .update(userPreferences)
        .eq('user_id', currentUserUUID);
      
      if (error) throw error;
      
      toast.success('Preferences updated successfully!');
    } catch (error) {
      toast.error('Error updating preferences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setUserPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">User Preferences</h1>
          <p>Loading preferences...</p>
        </div>
      </Layout>
    );
  }

  if (!userPreferences) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">User Preferences</h1>
          <p>No preferences found. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">User Preferences</h1>
        <Card>
          <CardHeader>
            <CardTitle>Update Your Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updatePreferences} className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="email_notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email Notifications
                </label>
                <Switch
                  id="email_notifications"
                  checked={userPreferences.email_notifications}
                  onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="sms_notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  SMS Notifications
                </label>
                <Switch
                  id="sms_notifications"
                  checked={userPreferences.sms_notifications}
                  onCheckedChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
                />
              </div>
              <div>
                <label htmlFor="theme" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Theme
                </label>
                <Select
                  value={userPreferences.theme}
                  onValueChange={(value) => handlePreferenceChange('theme', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="language" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Language
                </label>
                <Input
                  id="language"
                  value={userPreferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="timezone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Timezone
                </label>
                <Input
                  id="timezone"
                  value={userPreferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="currency" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Currency
                </label>
                <Input
                  id="currency"
                  value={userPreferences.currency}
                  onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button onClick={updatePreferences} disabled={loading}>
              {loading ? 'Updating...' : 'Update Preferences'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default UserPreferences;