import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const ProjectTags = () => {
  const [projectTags, setProjectTags] = useState([]);
  const [newProjectTag, setNewProjectTag] = useState({
    project_id: '',
    tag: ''
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchProjectTags();
    }
  }, [currentUserUUID]);

  const fetchProjectTags = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('project_tags')
        .select(`
          id, 
          project_id, 
          tag, 
          added_at, 
          removed_at,
          project:projects (id, title)
        `)
        .order('added_at', { ascending: false });
      if (error) throw error;
      setProjectTags(data);
    } catch (error) {
      toast.error('Error fetching project tags: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addProjectTag = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tags')
        .insert([{
          ...newProjectTag,
          added_at: new Date().toISOString()
        }]);
      if (error) throw error;
      toast.success('Project tag added successfully!');
      fetchProjectTags();
      setNewProjectTag({ project_id: '', tag: '' });
    } catch (error) {
      toast.error('Error adding project tag: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeProjectTag = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tags')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Project tag removed successfully');
      fetchProjectTags();
    } catch (error) {
      toast.error('Error removing project tag: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Project Tags System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Project Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addProjectTag} className="space-y-4">
              <Input
                type="text"
                placeholder="Project ID"
                value={newProjectTag.project_id}
                onChange={(e) => setNewProjectTag({ ...newProjectTag, project_id: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Tag"
                value={newProjectTag.tag}
                onChange={(e) => setNewProjectTag({ ...newProjectTag, tag: e.target.value })}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Tag'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading project tags...</p>
            ) : projectTags.length === 0 ? (
              <p>No project tags found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead>Removed At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>{tag.id}</TableCell>
                      <TableCell>{tag.project?.title || tag.project_id}</TableCell>
                      <TableCell>{tag.tag}</TableCell>
                      <TableCell>{new Date(tag.added_at).toLocaleString()}</TableCell>
                      <TableCell>{tag.removed_at ? new Date(tag.removed_at).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>
                        {!tag.removed_at && (
                          <Button onClick={() => removeProjectTag(tag.id)} variant="destructive" size="sm">
                            Remove
                          </Button>
                        )}
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

export default ProjectTags;