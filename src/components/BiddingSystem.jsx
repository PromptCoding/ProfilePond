import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Layout from './Layout';
import { toast } from "sonner";
import { z } from "zod";

const bidSchema = z.object({
  project_id: z.string().uuid(),
  amount: z.number().positive(),
  proposal: z.string().min(10).max(1000),
});

const BiddingSystem = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newBid, setNewBid] = useState({ amount: '', proposal: '' });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchProjectsAndBids();
    const projectsSubscription = supabase
      .channel('public:projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleProjectChange)
      .subscribe();

    const bidsSubscription = supabase
      .channel('public:bids')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, handleBidChange)
      .subscribe();

    return () => {
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(bidsSubscription);
    };
  }, [user, navigate]);

  const fetchProjectsAndBids = async () => {
    try {
      setLoading(true);
      // Fetch projects
      let { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, description, budget, status')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch bids
      let { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('id, amount, status, created_at, bidder_id, project_id');

      if (bidsError) throw bidsError;

      // Fetch users
      let { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name');

      if (usersError) throw usersError;

      // Create a map of user IDs to names
      const userMap = Object.fromEntries(usersData.map(user => [user.id, user.name]));

      // Combine projects with their bids and user names
      const projectsWithBids = projectsData.map(project => ({
        ...project,
        bids: bidsData
          .filter(bid => bid.project_id === project.id)
          .map(bid => ({
            ...bid,
            bidder_name: userMap[bid.bidder_id] || 'Anonymous'
          }))
      }));

      setProjects(projectsWithBids);
    } catch (error) {
      toast.error('Error fetching projects and bids: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (payload) => {
    console.log('Project changed:', payload);
    fetchProjectsAndBids();
  };

  const handleBidChange = (payload) => {
    console.log('Bid changed:', payload);
    fetchProjectsAndBids();
  };

  const createBid = async (projectId) => {
    if (!newBid.amount || !newBid.proposal) {
      toast.error('Bid amount and proposal are required');
      return;
    }

    try {
      const validatedBid = bidSchema.parse({
        project_id: projectId,
        amount: parseFloat(newBid.amount),
        proposal: newBid.proposal,
      });

      const { data, error } = await supabase
        .from('bids')
        .insert([{ ...validatedBid, bidder_id: user.id }]);
      
      if (error) throw error;
      
      toast.success('Bid created successfully!');
      setNewBid({ amount: '', proposal: '' });
      fetchProjectsAndBids();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Invalid bid data: ' + error.errors.map(e => e.message).join(', '));
      } else {
        toast.error('Error creating bid: ' + error.message);
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Bidding System</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Available Projects and Bids</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading projects and bids...</p>
            ) : projects.length === 0 ? (
              <p>No projects available for bidding at the moment.</p>
            ) : (
              <ul className="space-y-8">
                {projects.map((project) => (
                  <li key={project.id} className="bg-gray-100 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{project.title}</h3>
                        <p className="text-gray-600 mt-2">{project.description}</p>
                        <p className="text-sm mt-2">Budget: ${project.budget}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Create a Bid:</h4>
                      <Input
                        type="number"
                        placeholder="Bid Amount"
                        value={newBid.amount}
                        onChange={(e) => setNewBid({ ...newBid, amount: e.target.value })}
                        className="mb-2"
                      />
                      <Textarea
                        placeholder="Your Proposal"
                        value={newBid.proposal}
                        onChange={(e) => setNewBid({ ...newBid, proposal: e.target.value })}
                        className="mb-2"
                      />
                      <Button onClick={() => createBid(project.id)}>
                        Submit Bid
                      </Button>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Existing Bids:</h4>
                      {project.bids.length === 0 ? (
                        <p>No bids yet for this project.</p>
                      ) : (
                        <ul className="space-y-2">
                          {project.bids.map((bid) => (
                            <li key={bid.id} className="bg-white p-3 rounded shadow-sm">
                              <p>Bidder: {bid.bidder_name}</p>
                              <p>Amount: ${bid.amount}</p>
                              <p>Status: {bid.status}</p>
                              <p>Date: {new Date(bid.created_at).toLocaleDateString()}</p>
                            </li>
                          ))}
                        </ul>
                      )}
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

export default BiddingSystem;