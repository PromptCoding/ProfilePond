import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const StripeAccounts = () => {
  const [stripeAccounts, setStripeAccounts] = useState([]);
  const [newStripeAccount, setNewStripeAccount] = useState({
    user_id: '',
    stripe_account_id: ''
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchStripeAccounts();
    }
  }, [currentUserUUID]);

  const fetchStripeAccounts = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('stripe_accounts')
        .select(`
          user_id, 
          stripe_account_id, 
          created_at,
          user:users (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStripeAccounts(data);
    } catch (error) {
      toast.error('Error fetching Stripe accounts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createStripeAccount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stripe_accounts')
        .insert([newStripeAccount]);
      if (error) throw error;
      toast.success('Stripe account created successfully!');
      fetchStripeAccounts();
      setNewStripeAccount({ user_id: '', stripe_account_id: '' });
    } catch (error) {
      toast.error('Error creating Stripe account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteStripeAccount = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stripe_accounts')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      toast.success('Stripe account deleted successfully');
      fetchStripeAccounts();
    } catch (error) {
      toast.error('Error deleting Stripe account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Stripe Accounts System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Stripe Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createStripeAccount} className="space-y-4">
              <Input
                type="text"
                placeholder="User ID"
                value={newStripeAccount.user_id}
                onChange={(e) => setNewStripeAccount({ ...newStripeAccount, user_id: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Stripe Account ID"
                value={newStripeAccount.stripe_account_id}
                onChange={(e) => setNewStripeAccount({ ...newStripeAccount, stripe_account_id: e.target.value })}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Stripe Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading Stripe accounts...</p>
            ) : stripeAccounts.length === 0 ? (
              <p>No Stripe accounts found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Stripe Account ID</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stripeAccounts.map((account) => (
                    <TableRow key={account.user_id}>
                      <TableCell>{account.user?.name || account.user_id}</TableCell>
                      <TableCell>{account.stripe_account_id}</TableCell>
                      <TableCell>{new Date(account.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => deleteStripeAccount(account.user_id)} 
                          variant="destructive"
                        >
                          Delete
                        </Button>
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

export default StripeAccounts;