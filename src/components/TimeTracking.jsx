import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const TimeTracking = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newEntry, setNewEntry] = useState({ project_id: '', description: '', is_billable: true });
  const [activeEntries, setActiveEntries] = useState([]);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchTimeEntries();
      fetchProjects();
    }
  }, [currentUserUUID]);

  const fetchProjects = async () => {
    try {
      const { data: acceptedBids, error: bidsError } = await supabase
        .from('bids')
        .select('project_id')
        .eq('bidder_id', currentUserUUID)
        .eq('status', 'accepted');
      
      if (bidsError) throw bidsError;

      if (acceptedBids.length === 0) {
        setProjects([{ id: 'no-projects', title: 'No accepted bids found' }]);
        return;
      }

      const projectIds = acceptedBids.map(bid => bid.project_id);
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title')
        .in('id', projectIds);
      
      if (projectsError) throw projectsError;

      setProjects(projectsData);
    } catch (error) {
      toast.error('Error fetching projects: ' + error.message);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          id, 
          project_id, 
          start_time, 
          end_time, 
          duration, 
          description, 
          is_billable,
          projects!fk_time_entries_project (title)
        `)
        .eq('user_id', currentUserUUID)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      const activeEntries = data.filter(entry => !entry.end_time);
      const completedEntries = data.filter(entry => entry.end_time);
      
      setActiveEntries(activeEntries);
      setTimeEntries(completedEntries);
    } catch (error) {
      toast.error('Error fetching time entries: ' + error.message);
    }
  };

  const startTimeTracking = async () => {
    if (!newEntry.project_id) {
      toast.error('Please select a project');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          project_id: newEntry.project_id,
          description: newEntry.description,
          is_billable: newEntry.is_billable,
          user_id: currentUserUUID,
          start_time: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;

      setActiveEntries([...activeEntries, data[0]]);
      setNewEntry({ project_id: '', description: '', is_billable: true });
      toast.success('Time tracking started');
    } catch (error) {
      toast.error('Error starting time tracking: ' + error.message);
    }
  };

  const stopTimeTracking = async (entryId) => {
    try {
      const endTime = new Date();
      const entry = activeEntries.find(e => e.id === entryId);
      const duration = Math.round((endTime - new Date(entry.start_time)) / 1000); // duration in seconds
      
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration: duration
        })
        .eq('id', entryId);
      
      if (error) throw error;

      fetchTimeEntries(); // Refresh the list of time entries
      toast.success('Time tracking stopped');
    } catch (error) {
      toast.error('Error stopping time tracking: ' + error.message);
    }
  };

  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Time Tracking System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Start New Time Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); startTimeTracking(); }} className="space-y-4">
              <Select
                value={newEntry.project_id}
                onValueChange={(value) => setNewEntry({ ...newEntry, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="loading">Loading projects...</SelectItem>
                  ) : projects[0].id === 'no-projects' ? (
                    <SelectItem value="no-projects" disabled>No accepted bids found</SelectItem>
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
                placeholder="Description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                required
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_billable"
                  checked={newEntry.is_billable}
                  onCheckedChange={(checked) => setNewEntry({ ...newEntry, is_billable: checked })}
                />
                <label
                  htmlFor="is_billable"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Billable
                </label>
              </div>
              <Button type="submit">Start Time Tracking</Button>
            </form>
          </CardContent>
        </Card>
        
        {activeEntries.length > 0 && (
          <Card className="mb-8 bg-green-50">
            <CardHeader>
              <CardTitle>Active Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {activeEntries.map((entry) => (
                  <li key={entry.id} className="bg-white p-4 rounded-md shadow">
                    <p><strong>Project:</strong> {entry.projects?.title || getProjectTitle(entry.project_id)}</p>
                    <p><strong>Description:</strong> {entry.description}</p>
                    <p><strong>Started at:</strong> {new Date(entry.start_time).toLocaleString()}</p>
                    <Button onClick={() => stopTimeTracking(entry.id)} variant="destructive" className="mt-2">
                      Stop Time Tracking
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <p>No completed time entries found.</p>
            ) : (
              <ul className="space-y-4">
                {timeEntries.map((entry) => (
                  <li key={entry.id} className="bg-gray-100 p-4 rounded-md">
                    <p><strong>Project:</strong> {entry.projects?.title || getProjectTitle(entry.project_id)}</p>
                    <p><strong>Description:</strong> {entry.description}</p>
                    <p><strong>Duration:</strong> {entry.duration ? `${entry.duration} seconds` : 'In progress'}</p>
                    <p><strong>Billable:</strong> {entry.is_billable ? 'Yes' : 'No'}</p>
                    <p><strong>Start:</strong> {new Date(entry.start_time).toLocaleString()}</p>
                    <p><strong>End:</strong> {entry.end_time ? new Date(entry.end_time).toLocaleString() : 'In progress'}</p>
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

export default TimeTracking;