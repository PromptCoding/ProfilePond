import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const CurrencyRates = () => {
  const [currencyRates, setCurrencyRates] = useState([]);
  const [newRate, setNewRate] = useState({
    from_currency: '',
    to_currency: '',
    rate: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchCurrencyRates();
    }
  }, [currentUserUUID]);

  const fetchCurrencyRates = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .order('from_currency', { ascending: true })
        .order('to_currency', { ascending: true });
      if (error) throw error;
      setCurrencyRates(data);
    } catch (error) {
      toast.error('Error fetching currency rates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateRate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('currency_rates')
        .upsert([newRate], { onConflict: ['from_currency', 'to_currency'] });
      if (error) throw error;
      toast.success('Currency rate added/updated successfully!');
      fetchCurrencyRates();
      setNewRate({ from_currency: '', to_currency: '', rate: 0 });
    } catch (error) {
      toast.error('Error adding/updating currency rate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRate = async (from_currency, to_currency) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('currency_rates')
        .delete()
        .eq('from_currency', from_currency)
        .eq('to_currency', to_currency);
      if (error) throw error;
      toast.success('Currency rate deleted successfully');
      fetchCurrencyRates();
    } catch (error) {
      toast.error('Error deleting currency rate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Currency Rates System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add/Update Currency Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addOrUpdateRate} className="space-y-4">
              <Input
                type="text"
                placeholder="From Currency (e.g., USD)"
                value={newRate.from_currency}
                onChange={(e) => setNewRate({ ...newRate, from_currency: e.target.value.toUpperCase() })}
                maxLength={3}
                required
              />
              <Input
                type="text"
                placeholder="To Currency (e.g., EUR)"
                value={newRate.to_currency}
                onChange={(e) => setNewRate({ ...newRate, to_currency: e.target.value.toUpperCase() })}
                maxLength={3}
                required
              />
              <Input
                type="number"
                placeholder="Rate"
                value={newRate.rate}
                onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) })}
                step="0.0001"
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Add/Update Rate'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading currency rates...</p>
            ) : currencyRates.length === 0 ? (
              <p>No currency rates found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencyRates.map((rate) => (
                    <TableRow key={`${rate.from_currency}-${rate.to_currency}`}>
                      <TableCell>{rate.from_currency}</TableCell>
                      <TableCell>{rate.to_currency}</TableCell>
                      <TableCell>{rate.rate}</TableCell>
                      <TableCell>{new Date(rate.last_updated).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          onClick={() => deleteRate(rate.from_currency, rate.to_currency)}
                          disabled={loading}
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

export default CurrencyRates;