import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const Portfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    project_id: '',
    description: '',
    is_featured: false
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchPortfolioItems();
    }
  }, [currentUserUUID]);

  const fetchPortfolioItems = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('portfolio_items')
        .select(`
          id, 
          project_id, 
          description, 
          is_featured, 
          created_at,
          projects (id, title)
        `)
        .eq('user_id', currentUserUUID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPortfolioItems(data);
    } catch (error) {
      toast.error('Error fetching portfolio items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addPortfolioItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_items')
        .insert([{ ...newPortfolioItem, user_id: currentUserUUID }]);
      
      if (error) throw error;
      
      toast.success('Portfolio item added successfully!');
      fetchPortfolioItems();
      setNewPortfolioItem({
        project_id: '',
        description: '',
        is_featured: false
      });
    } catch (error) {
      toast.error('Error adding portfolio item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePortfolioItem = async (id, updates) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_items')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Portfolio item updated successfully!');
      fetchPortfolioItems();
    } catch (error) {
      toast.error('Error updating portfolio item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePortfolioItem = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Portfolio item deleted successfully!');
      fetchPortfolioItems();
    } catch (error) {
      toast.error('Error deleting portfolio item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Portfolio System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Portfolio Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPortfolioItem} className="space-y-4">
              <Input
                type="text"
                placeholder="Project ID"
                value={newPortfolioItem.project_id}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, project_id: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={newPortfolioItem.description}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                required
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_featured"
                  checked={newPortfolioItem.is_featured}
                  onCheckedChange={(checked) => setNewPortfolioItem({ ...newPortfolioItem, is_featured: checked })}
                />
                <label
                  htmlFor="is_featured"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Featured
                </label>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Portfolio Item'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Items</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading portfolio items...</p>
            ) : portfolioItems.length === 0 ? (
              <p>No portfolio items found.</p>
            ) : (
              <ul className="space-y-4">
                {portfolioItems.map((item) => (
                  <li key={item.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>Project:</strong> {item.projects?.title || item.project_id}</p>
                    <p><strong>Description:</strong> {item.description}</p>
                    <p><strong>Featured:</strong> {item.is_featured ? 'Yes' : 'No'}</p>
                    <p><strong>Created At:</strong> {new Date(item.created_at).toLocaleString()}</p>
                    <div className="mt-2 space-x-2">
                      <Button 
                        onClick={() => updatePortfolioItem(item.id, { is_featured: !item.is_featured })}
                        variant="outline"
                      >
                        {item.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      <Button 
                        onClick={() => deletePortfolioItem(item.id)}
                        variant="destructive"
                      >
                        Delete
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

export default Portfolio;