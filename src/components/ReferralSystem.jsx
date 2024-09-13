import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const ReferralSystem = () => {
  const [referrals, setReferrals] = useState([]);
  const [newReferral, setNewReferral] = useState({
    referred_id: '',
    reward_amount: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchReferrals();
    }
  }, [currentUserUUID]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('referrals')
        .select(`
          id, 
          status, 
          reward_amount, 
          created_at, 
          completed_at,
          referrer:users!referrer_id (id, name),
          referred:users!referred_id (id, name)
        `)
        .eq('referrer_id', currentUserUUID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReferrals(data);
    } catch (error) {
      toast.error('Error fetching referrals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createReferral = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('referrals')
        .insert([{
          referrer_id: currentUserUUID,
          referred_id: newReferral.referred_id,
          status: 'pending',
          reward_amount: newReferral.reward_amount
        }]);
      if (error) throw error;
      toast.success('Referral created successfully!');
      fetchReferrals();
      setNewReferral({
        referred_id: '',
        reward_amount: 0
      });
    } catch (error) {
      toast.error('Error creating referral: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReferralStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('referrals')
        .update({ 
          status: newStatus, 
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Referral ${newStatus} successfully`);
      fetchReferrals();
    } catch (error) {
      toast.error('Error updating referral status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Referral System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Referral</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createReferral} className="space-y-4">
              <Input
                type="text"
                placeholder="Referred User ID"
                value={newReferral.referred_id}
                onChange={(e) => setNewReferral({ ...newReferral, referred_id: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Reward Amount"
                value={newReferral.reward_amount}
                onChange={(e) => setNewReferral({ ...newReferral, reward_amount: parseFloat(e.target.value) })}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Referral'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading referrals...</p>
            ) : referrals.length === 0 ? (
              <p>No referrals found.</p>
            ) : (
              <ul className="space-y-4">
                {referrals.map((referral) => (
                  <li key={referral.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>Referred User:</strong> {referral.referred?.name || referral.referred_id}</p>
                    <p><strong>Status:</strong> {referral.status}</p>
                    <p><strong>Reward Amount:</strong> ${referral.reward_amount}</p>
                    <p><strong>Created At:</strong> {new Date(referral.created_at).toLocaleString()}</p>
                    {referral.completed_at && (
                      <p><strong>Completed At:</strong> {new Date(referral.completed_at).toLocaleString()}</p>
                    )}
                    {referral.status === 'pending' && (
                      <div className="mt-2 space-x-2">
                        <Button onClick={() => updateReferralStatus(referral.id, 'completed')} variant="outline">
                          Complete
                        </Button>
                        <Button onClick={() => updateReferralStatus(referral.id, 'cancelled')} variant="destructive">
                          Cancel
                        </Button>
                      </div>
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

export default ReferralSystem;