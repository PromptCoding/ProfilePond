import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Layout from './Layout';
import { useAuth } from './AuthProvider';

const MilestonePayment = () => {
  const [newMilestone, setNewMilestone] = useState({ project_id: '', title: '', description: '', amount: 0 });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('creator_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('id, project_id, title, status, amount')
        .range(0, 9);
      if (error) throw error;
      return data;
    },
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_payments')
        .select('id, project_id, milestone_id, amount, status')
        .range(0, 9);
      if (error) throw error;
      return data;
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (newMilestone) => {
      const { data, error } = await supabase
        .from('milestones')
        .insert([newMilestone]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones']);
      toast.success('Milestone created successfully!');
      setNewMilestone({ project_id: '', title: '', description: '', amount: 0 });
    },
    onError: (error) => {
      toast.error(`Error creating milestone: ${error.message}`);
    },
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: async (milestone_id) => {
      const milestone = milestones?.find(m => m.id === milestone_id);
      if (!milestone) throw new Error('Milestone not found');
      const { data, error } = await supabase
        .from('project_payments')
        .insert([{
          project_id: milestone.project_id,
          milestone_id: milestone_id,
          amount: milestone.amount,
          status: 'pending'
        }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast.success('Payment initiated successfully!');
    },
    onError: (error) => {
      toast.error(`Error initiating payment: ${error.message}`);
    },
  });

  const handleCreateMilestone = (e) => {
    e.preventDefault();
    createMilestoneMutation.mutate(newMilestone);
  };

  const handleInitiatePayment = (milestone_id) => {
    initiatePaymentMutation.mutate(milestone_id);
  };

  const renderMilestones = () => {
    if (milestonesLoading) return <p>Loading milestones...</p>;
    if (!milestones || milestones.length === 0) return <p>No milestones found.</p>;
    return (
      <ul className="space-y-4">
        {milestones.map((milestone) => (
          <li key={milestone.id} className="flex items-center justify-between bg-gray-100 p-4 rounded-md">
            <div>
              <h3 className="font-semibold">{milestone.title}</h3>
              <p className="text-sm text-gray-600">Status: {milestone.status}</p>
              <p className="text-sm text-gray-600">Amount: ${milestone.amount}</p>
            </div>
            <Button onClick={() => handleInitiatePayment(milestone.id)} disabled={initiatePaymentMutation.isLoading}>
              {initiatePaymentMutation.isLoading ? 'Initiating...' : 'Initiate Payment'}
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  const renderPayments = () => {
    if (paymentsLoading) return <p>Loading payments...</p>;
    if (!payments || payments.length === 0) return <p>No payments found.</p>;
    return (
      <ul className="space-y-4">
        {payments.map((payment) => (
          <li key={payment.id} className="bg-gray-100 p-4 rounded-md">
            <p><strong>Project:</strong> {payment.project_id}</p>
            <p><strong>Milestone:</strong> {payment.milestone_id}</p>
            <p><strong>Amount:</strong> ${payment.amount}</p>
            <p><strong>Status:</strong> {payment.status}</p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Milestone and Payment System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <Select
                value={newMilestone.project_id}
                onValueChange={(value) => setNewMilestone({ ...newMilestone, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <SelectItem value="loading">Loading projects...</SelectItem>
                  ) : !projects || projects.length === 0 ? (
                    <SelectItem value="no-projects">No projects available</SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newMilestone.amount}
                onChange={(e) => setNewMilestone({ ...newMilestone, amount: parseFloat(e.target.value) })}
                required
              />
              <Button type="submit" disabled={createMilestoneMutation.isLoading}>
                {createMilestoneMutation.isLoading ? 'Creating...' : 'Create Milestone'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMilestones()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {renderPayments()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MilestonePayment;