import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Layout from './Layout';

const DisputeResolution = () => {
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [newDispute, setNewDispute] = useState({ project_id: '', type: '', description: '' });
  const [newEvidence, setNewEvidence] = useState({ content: '', evidence_type: '' });
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchDisputes();
      fetchProjects();
    }
  }, [currentUserUUID]);

  const fetchDisputes = async () => {
    try {
      let { data, error } = await supabase
        .from('disputes')
        .select(`
          id, 
          type, 
          status, 
          project_id, 
          initiator:users!initiator_id (id, name), 
          respondent:users!respondent_id (id, name), 
          arbitration_sessions (id, status, arbiter:users (id, name))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDisputes(data);
    } catch (error) {
      toast.error('Error fetching disputes: ' + error.message);
    }
  };

  const fetchProjects = async () => {
    try {
      let { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('creator_id', currentUserUUID);
      
      if (error) throw error;
      setProjects(data);
    } catch (error) {
      toast.error('Error fetching projects: ' + error.message);
    }
  };

  const createDispute = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('disputes')
        .insert([{
          ...newDispute,
          initiator_id: currentUserUUID,
          status: 'open'
        }]);
      
      if (error) throw error;
      
      toast.success('Dispute created successfully!');
      fetchDisputes();
      setNewDispute({ project_id: '', type: '', description: '' });
    } catch (error) {
      toast.error('Error creating dispute: ' + error.message);
    }
  };

  const submitEvidence = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      const { data, error } = await supabase
        .from('dispute_evidence')
        .insert([{
          ...newEvidence,
          dispute_id: selectedDispute.id,
          submitter_id: currentUserUUID
        }]);
      
      if (error) throw error;
      
      toast.success('Evidence submitted successfully!');
      setNewEvidence({ content: '', evidence_type: '' });
      setIsEvidenceModalOpen(false);
      fetchDisputes();
    } catch (error) {
      toast.error('Error submitting evidence: ' + error.message);
    }
  };

  const resolveDispute = async (resolution) => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .update({ 
          status: 'resolved', 
          resolution_outcome: resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedDispute.id);
      
      if (error) throw error;
      
      toast.success('Dispute resolved successfully!');
      fetchDisputes();
      setSelectedDispute(null);
    } catch (error) {
      toast.error('Error resolving dispute: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dispute Resolution System</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Dispute</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createDispute} className="space-y-4">
                <Select
                  value={newDispute.project_id}
                  onValueChange={(value) => setNewDispute({ ...newDispute, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="Type"
                  value={newDispute.type}
                  onChange={(e) => setNewDispute({ ...newDispute, type: e.target.value })}
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={newDispute.description}
                  onChange={(e) => setNewDispute({ ...newDispute, description: e.target.value })}
                  required
                />
                <Button type="submit">Create Dispute</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {disputes.map((dispute) => (
                  <li 
                    key={dispute.id} 
                    onClick={() => setSelectedDispute(dispute)}
                    className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedDispute?.id === dispute.id ? 'bg-gray-200' : ''}`}
                  >
                    <p><strong>Project:</strong> {dispute.project_id}</p>
                    <p><strong>Type:</strong> {dispute.type}</p>
                    <p><strong>Status:</strong> {dispute.status}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {selectedDispute && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Project:</strong> {selectedDispute.project_id}</p>
              <p><strong>Initiator:</strong> {selectedDispute.initiator?.name}</p>
              <p><strong>Respondent:</strong> {selectedDispute.respondent?.name}</p>
              <p><strong>Type:</strong> {selectedDispute.type}</p>
              <p><strong>Status:</strong> {selectedDispute.status}</p>
              <p><strong>Created:</strong> {new Date(selectedDispute.created_at).toLocaleString()}</p>

              <h3 className="font-semibold mt-4 mb-2">Arbitration Sessions</h3>
              {selectedDispute.arbitration_sessions.length > 0 ? (
                <ul>
                  {selectedDispute.arbitration_sessions.map((session) => (
                    <li key={session.id}>
                      Arbiter: {session.arbiter?.name} - Status: {session.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No arbitration sessions yet.</p>
              )}

              <div className="mt-4">
                <Button onClick={() => setIsEvidenceModalOpen(true)}>Submit Evidence</Button>
              </div>

              {selectedDispute.status !== 'resolved' && (
                <div className="mt-4 space-x-2">
                  <Button onClick={() => resolveDispute('in_favor_of_initiator')}>
                    Resolve for Initiator
                  </Button>
                  <Button onClick={() => resolveDispute('in_favor_of_respondent')}>
                    Resolve for Respondent
                  </Button>
                  <Button onClick={() => resolveDispute('compromise')}>
                    Resolve with Compromise
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={isEvidenceModalOpen} onOpenChange={setIsEvidenceModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Evidence</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitEvidence} className="space-y-4">
              <Textarea
                placeholder="Evidence content"
                value={newEvidence.content}
                onChange={(e) => setNewEvidence({ ...newEvidence, content: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Evidence type"
                value={newEvidence.evidence_type}
                onChange={(e) => setNewEvidence({ ...newEvidence, evidence_type: e.target.value })}
                required
              />
              <DialogFooter>
                <Button type="submit">Submit Evidence</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DisputeResolution;