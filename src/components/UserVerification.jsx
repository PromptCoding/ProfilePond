import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const UserVerification = () => {
  const [verifications, setVerifications] = useState([]);
  const [newVerification, setNewVerification] = useState({
    user_id: '',
    type: '',
    status: 'pending',
    verification_data: {}
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchVerifications();
    }
  }, [currentUserUUID]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('user_verifications')
        .select(`
          id, 
          user_id, 
          type, 
          status, 
          verification_data, 
          created_at, 
          verified_at,
          user:users (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVerifications(data);
    } catch (error) {
      toast.error('Error fetching verifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const initiateVerification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_verifications')
        .insert([{ ...newVerification, user_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('Verification initiated successfully!');
      fetchVerifications();
      setNewVerification({
        user_id: '',
        type: '',
        status: 'pending',
        verification_data: {}
      });
    } catch (error) {
      toast.error('Error initiating verification: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_verifications')
        .update({ 
          status: newStatus, 
          verified_at: newStatus === 'verified' ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Verification ${newStatus} successfully`);
      fetchVerifications();
    } catch (error) {
      toast.error('Error updating verification status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">User Verification System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Initiate New Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={initiateVerification} className="space-y-4">
              <Select
                value={newVerification.type}
                onValueChange={(value) => setNewVerification({ ...newVerification, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Verification Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_verification">ID Verification</SelectItem>
                  <SelectItem value="address_verification">Address Verification</SelectItem>
                  <SelectItem value="phone_verification">Phone Verification</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Verification Data (JSON format)"
                value={JSON.stringify(newVerification.verification_data)}
                onChange={(e) => setNewVerification({ ...newVerification, verification_data: JSON.parse(e.target.value) })}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Initiating...' : 'Initiate Verification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading verifications...</p>
            ) : verifications.length === 0 ? (
              <p>No verifications found.</p>
            ) : (
              <ul className="space-y-4">
                {verifications.map((verification) => (
                  <li key={verification.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>User:</strong> {verification.user?.name || verification.user_id}</p>
                    <p><strong>Type:</strong> {verification.type}</p>
                    <p><strong>Status:</strong> {verification.status}</p>
                    <p><strong>Verification Data:</strong> {JSON.stringify(verification.verification_data)}</p>
                    <p><strong>Created At:</strong> {new Date(verification.created_at).toLocaleString()}</p>
                    {verification.verified_at && (
                      <p><strong>Verified At:</strong> {new Date(verification.verified_at).toLocaleString()}</p>
                    )}
                    {verification.status === 'pending' && (
                      <div className="mt-2 space-x-2">
                        <Button onClick={() => updateVerificationStatus(verification.id, 'verified')} variant="outline">
                          Verify
                        </Button>
                        <Button onClick={() => updateVerificationStatus(verification.id, 'rejected')} variant="destructive">
                          Reject
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

export default UserVerification;