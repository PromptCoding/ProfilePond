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

const SubscriptionSystem = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [newSubscription, setNewSubscription] = useState({
    plan: '',
    start_date: '',
    end_date: '',
    auto_renew: true
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchSubscriptions();
    }
  }, [currentUserUUID]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id, 
          plan, 
          status, 
          start_date, 
          end_date, 
          auto_renew, 
          created_at,
          user:users (id, name)
        `)
        .eq('user_id', currentUserUUID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubscriptions(data);
    } catch (error) {
      toast.error('Error fetching subscriptions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          ...newSubscription,
          user_id: currentUserUUID,
          status: 'active'
        }]);
      if (error) throw error;
      toast.success('Subscription created successfully!');
      fetchSubscriptions();
      setNewSubscription({
        plan: '',
        start_date: '',
        end_date: '',
        auto_renew: true
      });
    } catch (error) {
      toast.error('Error creating subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Subscription ${newStatus} successfully`);
      fetchSubscriptions();
    } catch (error) {
      toast.error('Error updating subscription status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRenew = async (id, currentAutoRenew) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ auto_renew: !currentAutoRenew })
        .eq('id', id);
      if (error) throw error;
      toast.success('Auto-renew setting updated successfully');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Error toggling auto-renew: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Subscription System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSubscription} className="space-y-4">
              <Select
                value={newSubscription.plan}
                onValueChange={(value) => setNewSubscription({ ...newSubscription, plan: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Start Date"
                value={newSubscription.start_date}
                onChange={(e) => setNewSubscription({ ...newSubscription, start_date: e.target.value })}
                required
              />
              <Input
                type="date"
                placeholder="End Date"
                value={newSubscription.end_date}
                onChange={(e) => setNewSubscription({ ...newSubscription, end_date: e.target.value })}
                required
              />
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_renew"
                  checked={newSubscription.auto_renew}
                  onCheckedChange={(checked) => setNewSubscription({ ...newSubscription, auto_renew: checked })}
                />
                <label
                  htmlFor="auto_renew"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Auto-renew
                </label>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Subscription'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading subscriptions...</p>
            ) : subscriptions.length === 0 ? (
              <p>No subscriptions found.</p>
            ) : (
              <ul className="space-y-4">
                {subscriptions.map((subscription) => (
                  <li key={subscription.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>Plan:</strong> {subscription.plan}</p>
                    <p><strong>Status:</strong> {subscription.status}</p>
                    <p><strong>Start Date:</strong> {new Date(subscription.start_date).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(subscription.end_date).toLocaleDateString()}</p>
                    <p><strong>Auto-renew:</strong> {subscription.auto_renew ? 'Yes' : 'No'}</p>
                    <p><strong>Created At:</strong> {new Date(subscription.created_at).toLocaleString()}</p>
                    <div className="mt-2 space-x-2">
                      {subscription.status === 'active' ? (
                        <Button onClick={() => updateSubscriptionStatus(subscription.id, 'cancelled')} variant="destructive">
                          Cancel
                        </Button>
                      ) : (
                        <Button onClick={() => updateSubscriptionStatus(subscription.id, 'active')} variant="outline">
                          Reactivate
                        </Button>
                      )}
                      <Button onClick={() => toggleAutoRenew(subscription.id, subscription.auto_renew)} variant="outline">
                        {subscription.auto_renew ? 'Disable Auto-renew' : 'Enable Auto-renew'}
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

export default SubscriptionSystem;