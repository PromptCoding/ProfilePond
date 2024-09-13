import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Layout from './Layout';
import { toast } from "sonner";

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', budget: 0 });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserUUID) {
      navigate('/');
      return;
    }
    fetchProjects();
  }, [currentUserUUID, navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, description, status, budget')
        .eq('creator_id', currentUserUUID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(projects);
    } catch (error) {
      toast.error('Error fetching projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!currentUserUUID) {
      toast.error('You must be logged in to create a project');
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...newProject, creator_id: currentUserUUID }]);
      
      if (error) throw error;
      
      toast.success('Project created successfully!');
      fetchProjects();
      setNewProject({ title: '', description: '', budget: 0 });
    } catch (error) {
      toast.error('Error creating project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Project Management</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProject} className="space-y-4">
              <Input
                type="text"
                placeholder="Title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Budget"
                value={newProject.budget}
                onChange={(e) => setNewProject({ ...newProject, budget: parseFloat(e.target.value) })}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <p>No projects found. Create your first project above!</p>
            ) : (
              <ul className="space-y-2">
                {projects.map((project) => (
                  <li key={project.id} className="bg-gray-100 p-4 rounded-md">
                    <h3 className="font-bold">{project.title}</h3>
                    <p className="text-sm text-gray-600">{project.description}</p>
                    <p className="text-sm">Status: {project.status}</p>
                    <p className="text-sm">Budget: ${project.budget}</p>
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

export default ProjectManagement;