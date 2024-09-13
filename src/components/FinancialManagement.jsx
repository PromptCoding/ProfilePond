import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const FinancialManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    project_id: '',
    from_user_id: '',
    to_user_id: '',
    amount: 0,
    type: '',
    status: 'pending'
  });
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    stripe_payment_method_id: '',
    card_last4: '',
    card_brand: ''
  });
  const [newPayoutMethod, setNewPayoutMethod] = useState({
    type: '',
    details: {}
  });
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchTransactions();
      fetchPaymentAccounts();
      fetchPaymentMethods();
      fetchPayoutMethods();
    }
  }, [currentUserUUID]);

  const fetchTransactions = async () => {
    try {
      let { data, error } = await supabase
        .from('transactions')
        .select(`
          id, 
          project_id, 
          from_user_id, 
          to_user_id, 
          amount, 
          currency,
          type, 
          status, 
          created_at,
          projects (id, title),
          from_user:users!from_user_id (id, name),
          to_user:users!to_user_id (id, name)
        `)
        .order('created_at', { ascending: false })
        .range(0, 9);
      if (error) throw error;
      setTransactions(data);
    } catch (error) {
      toast.error('Error fetching transactions: ' + error.message);
    }
  };

  const fetchPaymentAccounts = async () => {
    try {
      let { data, error } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('user_id', currentUserUUID);
      if (error) throw error;
      setPaymentAccounts(data);
    } catch (error) {
      toast.error('Error fetching payment accounts: ' + error.message);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      let { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', currentUserUUID);
      if (error) throw error;
      setPaymentMethods(data);
    } catch (error) {
      toast.error('Error fetching payment methods: ' + error.message);
    }
  };

  const fetchPayoutMethods = async () => {
    try {
      let { data, error } = await supabase
        .from('payout_methods')
        .select('*')
        .eq('user_id', currentUserUUID);
      if (error) throw error;
      setPayoutMethods(data);
    } catch (error) {
      toast.error('Error fetching payout methods: ' + error.message);
    }
  };

  const createTransaction = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...newTransaction, from_user_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('Transaction created successfully!');
      fetchTransactions();
      setNewTransaction({
        project_id: '',
        from_user_id: '',
        to_user_id: '',
        amount: 0,
        type: '',
        status: 'pending'
      });
    } catch (error) {
      toast.error('Error creating transaction: ' + error.message);
    }
  };

  const updateTransactionStatus = async (id, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success('Transaction status updated successfully!');
      fetchTransactions();
    } catch (error) {
      toast.error('Error updating transaction status: ' + error.message);
    }
  };

  const addPaymentMethod = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{ ...newPaymentMethod, user_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('Payment method added successfully!');
      fetchPaymentMethods();
      setNewPaymentMethod({
        stripe_payment_method_id: '',
        card_last4: '',
        card_brand: ''
      });
    } catch (error) {
      toast.error('Error adding payment method: ' + error.message);
    }
  };

  const addPayoutMethod = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('payout_methods')
        .insert([{ ...newPayoutMethod, user_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('Payout method added successfully!');
      fetchPayoutMethods();
      setNewPayoutMethod({
        type: '',
        details: {}
      });
    } catch (error) {
      toast.error('Error adding payout method: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Financial Management System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTransaction} className="space-y-4">
              <Input
                type="text"
                placeholder="Project ID"
                value={newTransaction.project_id}
                onChange={(e) => setNewTransaction({ ...newTransaction, project_id: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="To User ID"
                value={newTransaction.to_user_id}
                onChange={(e) => setNewTransaction({ ...newTransaction, to_user_id: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                required
              />
              <Input
                type="text"
                placeholder="Type"
                value={newTransaction.type}
                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                required
              />
              <Button type="submit">Create Transaction</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="bg-gray-100 p-4 rounded-md">
                  <p>From: {transaction.from_user?.name}</p>
                  <p>To: {transaction.to_user?.name}</p>
                  <p>Amount: {transaction.amount} {transaction.currency}</p>
                  <p>Type: {transaction.type}</p>
                  <p>Status: {transaction.status}</p>
                  <p>Project: {transaction.projects?.title}</p>
                  {transaction.status === 'pending' && (
                    <div className="mt-2">
                      <Button onClick={() => updateTransactionStatus(transaction.id, 'completed')} className="mr-2">
                        Complete
                      </Button>
                      <Button onClick={() => updateTransactionStatus(transaction.id, 'cancelled')} variant="destructive">
                        Cancel
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payment Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {paymentAccounts.map((account) => (
                <li key={account.id} className="bg-gray-100 p-2 rounded">
                  <p>Stripe Customer ID: {account.stripe_customer_id}</p>
                  <p>Stripe Account ID: {account.stripe_account_id}</p>
                  <p>Status: {account.account_status}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPaymentMethod} className="space-y-4 mb-4">
              <Input
                type="text"
                placeholder="Stripe Payment Method ID"
                value={newPaymentMethod.stripe_payment_method_id}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, stripe_payment_method_id: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Card Last 4 Digits"
                value={newPaymentMethod.card_last4}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, card_last4: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Card Brand"
                value={newPaymentMethod.card_brand}
                onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, card_brand: e.target.value })}
                required
              />
              <Button type="submit">Add Payment Method</Button>
            </form>
            <ul className="space-y-2">
              {paymentMethods.map((method) => (
                <li key={method.id} className="bg-gray-100 p-2 rounded">
                  <p>Card: {method.card_brand} **** {method.card_last4}</p>
                  <p>Default: {method.is_default ? 'Yes' : 'No'}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPayoutMethod} className="space-y-4 mb-4">
              <Select
                value={newPayoutMethod.type}
                onValueChange={(value) => setNewPayoutMethod({ ...newPayoutMethod, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payout method type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Details (JSON format)"
                value={JSON.stringify(newPayoutMethod.details)}
                onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, details: JSON.parse(e.target.value) })}
                required
              />
              <Button type="submit">Add Payout Method</Button>
            </form>
            <ul className="space-y-2">
              {payoutMethods.map((method) => (
                <li key={method.id} className="bg-gray-100 p-2 rounded">
                  <p>Type: {method.type}</p>
                  <p>Default: {method.is_default ? 'Yes' : 'No'}</p>
                  <p>Details: {JSON.stringify(method.details)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FinancialManagement;