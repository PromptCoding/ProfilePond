import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const ContentManagement = () => {
  const [kbEntries, setKbEntries] = useState([]);
  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newKbEntry, setNewKbEntry] = useState({ project_id: '', title: '', content: '', tags: '' });
  const [newFile, setNewFile] = useState({ project_id: '', file: null });
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchKbEntries();
      fetchFiles();
      fetchProjects();
    }
  }, [currentUserUUID]);

  const fetchKbEntries = async () => {
    try {
      let { data, error } = await supabase
        .from('knowledge_base_entries')
        .select(`
          id, 
          project_id, 
          creator_id, 
          title,
          content,
          tags,
          created_at,
          projects (id, title),
          users (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setKbEntries(data);
    } catch (error) {
      toast.error('Error fetching knowledge base entries: ' + error.message);
    }
  };

  const fetchFiles = async () => {
    try {
      let { data, error } = await supabase
        .from('file_storage')
        .select(`
          id, 
          user_id, 
          project_id, 
          filename,
          file_size,
          mime_type,
          is_public,
          uploaded_at,
          projects (id, title),
          users (id, name)
        `)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setFiles(data);
    } catch (error) {
      toast.error('Error fetching files: ' + error.message);
    }
  };

  const fetchProjects = async () => {
    try {
      let { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data);
    } catch (error) {
      toast.error('Error fetching projects: ' + error.message);
    }
  };

  const createKbEntry = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .insert([{
          ...newKbEntry,
          creator_id: currentUserUUID,
          tags: newKbEntry.tags.split(',').map(tag => tag.trim())
        }]);
      if (error) throw error;
      toast.success('Knowledge base entry created successfully!');
      fetchKbEntries();
      setNewKbEntry({ project_id: '', title: '', content: '', tags: '' });
    } catch (error) {
      toast.error('Error creating knowledge base entry: ' + error.message);
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!newFile.file || !newFile.project_id) {
      toast.error('Please select a file and a project');
      return;
    }
    try {
      const fileExt = newFile.file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${newFile.project_id}/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, newFile.file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('file_storage')
        .insert([{
          user_id: currentUserUUID,
          project_id: newFile.project_id,
          filename: newFile.file.name,
          file_key: filePath,
          file_size: newFile.file.size,
          mime_type: newFile.file.type
        }]);

      if (error) throw error;

      toast.success('File uploaded successfully!');
      fetchFiles();
      setNewFile({ project_id: '', file: null });
    } catch (error) {
      toast.error('Error uploading file: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Content Management System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Knowledge Base Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createKbEntry} className="space-y-4">
              <Select
                value={newKbEntry.project_id}
                onValueChange={(value) => setNewKbEntry({ ...newKbEntry, project_id: value })}
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
                placeholder="Title"
                value={newKbEntry.title}
                onChange={(e) => setNewKbEntry({ ...newKbEntry, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Content"
                value={newKbEntry.content}
                onChange={(e) => setNewKbEntry({ ...newKbEntry, content: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newKbEntry.tags}
                onChange={(e) => setNewKbEntry({ ...newKbEntry, tags: e.target.value })}
              />
              <Button type="submit">Create KB Entry</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={uploadFile} className="space-y-4">
              <Select
                value={newFile.project_id}
                onValueChange={(value) => setNewFile({ ...newFile, project_id: value })}
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
                type="file"
                onChange={(e) => setNewFile({ ...newFile, file: e.target.files[0] })}
                required
              />
              <Button type="submit">Upload File</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Knowledge Base Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {kbEntries.map((entry) => (
                <li key={entry.id} className="bg-gray-100 p-4 rounded">
                  <h3 className="font-semibold">{entry.title}</h3>
                  <p>Project: {entry.projects.title}</p>
                  <p>Creator: {entry.users.name}</p>
                  <p>Tags: {entry.tags.join(', ')}</p>
                  <p className="mt-2">{entry.content}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {files.map((file) => (
                <li key={file.id} className="bg-gray-100 p-4 rounded">
                  <p>Filename: {file.filename}</p>
                  <p>Project: {file.projects.title}</p>
                  <p>Uploader: {file.users.name}</p>
                  <p>Size: {(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Type: {file.mime_type}</p>
                  <p>Public: {file.is_public ? 'Yes' : 'No'}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ContentManagement;