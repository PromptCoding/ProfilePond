import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Layout from './Layout';

const Communication = () => {
  const [projects, setProjects] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [milestoneCommunications, setMilestoneCommunications] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newMilestoneMessage, setNewMilestoneMessage] = useState('');
  const [activeTab, setActiveTab] = useState('conversations');
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchProjects();
      fetchMilestones();
      const projectsSubscription = supabase
        .channel('public:projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleProjectChange)
        .subscribe();

      return () => {
        supabase.removeChannel(projectsSubscription);
      };
    }
  }, [currentUserUUID]);

  useEffect(() => {
    if (selectedProject) {
      fetchConversations(selectedProject);
      const conversationsSubscription = supabase
        .channel(`public:conversations:project_id=eq.${selectedProject}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `project_id=eq.${selectedProject}` }, handleConversationChange)
        .subscribe();

      return () => {
        supabase.removeChannel(conversationsSubscription);
      };
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      const messagesSubscription = supabase
        .channel(`public:messages:conversation_id=eq.${selectedConversation}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation}` }, handleMessageChange)
        .subscribe();

      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedMilestone) {
      fetchMilestoneCommunications(selectedMilestone);
      const milestoneCommsSubscription = supabase
        .channel(`public:milestone_communications:milestone_id=eq.${selectedMilestone}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'milestone_communications', filter: `milestone_id=eq.${selectedMilestone}` }, handleMilestoneCommChange)
        .subscribe();

      return () => {
        supabase.removeChannel(milestoneCommsSubscription);
      };
    }
  }, [selectedMilestone]);

  const handleProjectChange = (payload) => {
    console.log('Project changed:', payload);
    fetchProjects();
  };

  const handleConversationChange = (payload) => {
    console.log('Conversation changed:', payload);
    fetchConversations(selectedProject);
  };

  const handleMessageChange = (payload) => {
    console.log('Message changed:', payload);
    fetchMessages(selectedConversation);
  };

  const handleMilestoneCommChange = (payload) => {
    console.log('Milestone communication changed:', payload);
    fetchMilestoneCommunications(selectedMilestone);
  };

  const fetchProjects = async () => {
    try {
      // Fetch projects created by the current user
      let { data: createdProjects, error: createdError } = await supabase
        .from('projects')
        .select('id, title, creator_id')
        .eq('creator_id', currentUserUUID);

      if (createdError) throw createdError;

      // Fetch projects where the user's bid was accepted
      let { data: acceptedBids, error: bidsError } = await supabase
        .from('bids')
        .select('project_id')
        .eq('bidder_id', currentUserUUID)
        .eq('status', 'accepted');

      if (bidsError) throw bidsError;

      const acceptedProjectIds = acceptedBids.map(bid => bid.project_id);

      // Fetch details of projects with accepted bids
      let { data: acceptedProjects, error: acceptedError } = await supabase
        .from('projects')
        .select('id, title, creator_id')
        .in('id', acceptedProjectIds);

      if (acceptedError) throw acceptedError;

      // Combine and deduplicate projects
      const allProjects = [...createdProjects, ...acceptedProjects];
      const uniqueProjects = Array.from(new Set(allProjects.map(p => p.id)))
        .map(id => allProjects.find(p => p.id === id));

      setProjects(uniqueProjects);
    } catch (error) {
      toast.error('Error fetching projects: ' + error.message);
    }
  };

  const fetchConversations = async (projectId) => {
    try {
      let { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id, 
          project_id, 
          created_at
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      setConversations(conversationsData);
    } catch (error) {
      toast.error('Error fetching conversations: ' + error.message);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      let { data, error } = await supabase
        .from('messages')
        .select(`
          id, 
          sender_id, 
          content, 
          created_at,
          users(name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data);
    } catch (error) {
      toast.error('Error fetching messages: ' + error.message);
    }
  };

  const fetchMilestones = async () => {
    try {
      let { data, error } = await supabase
        .from('milestones')
        .select('id, title, project_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMilestones(data);
    } catch (error) {
      toast.error('Error fetching milestones: ' + error.message);
    }
  };

  const fetchMilestoneCommunications = async (milestoneId) => {
    try {
      let { data, error } = await supabase
        .from('milestone_communications')
        .select(`
          id,
          user_id,
          message,
          created_at,
          users(name)
        `)
        .eq('milestone_id', milestoneId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMilestoneCommunications(data);
    } catch (error) {
      toast.error('Error fetching milestone communications: ' + error.message);
    }
  };

  const createConversation = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ project_id: projectId }])
        .select();
      if (error) throw error;
      setSelectedConversation(data[0].id);
      fetchConversations(projectId);
    } catch (error) {
      toast.error('Error creating conversation: ' + error.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) {
      toast.error('Please select a conversation and enter a message.');
      return;
    }

    try {
      // Fetch the project details to get the creator_id
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('creator_id')
        .eq('id', selectedProject)
        .single();

      if (projectError) throw projectError;

      const recipientId = projectData.creator_id === currentUserUUID ? null : projectData.creator_id;

      const { data, error } = await supabase
        .from('messages')
        .insert([
          { 
            conversation_id: selectedConversation, 
            sender_id: currentUserUUID, 
            recipient_id: recipientId,
            content: newMessage.trim()
          }
        ]);
      if (error) throw error;
      setNewMessage('');
      fetchMessages(selectedConversation);
      toast.success('Message sent successfully!');
    } catch (error) {
      toast.error('Error sending message: ' + error.message);
    }
  };

  const sendMilestoneMessage = async (e) => {
    e.preventDefault();
    if (!selectedMilestone || !newMilestoneMessage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('milestone_communications')
        .insert([
          { milestone_id: selectedMilestone, user_id: currentUserUUID, message: newMilestoneMessage }
        ]);
      if (error) throw error;
      setNewMilestoneMessage('');
      fetchMilestoneCommunications(selectedMilestone);
    } catch (error) {
      toast.error('Error sending milestone message: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Communication System</h1>
        <div className="flex gap-12">
          <Card className="w-1/4">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p>No projects available.</p>
              ) : (
                <ul className="space-y-3">
                  {projects.map((project) => (
                    <li 
                      key={project.id} 
                      onClick={() => {
                        setSelectedProject(project.id);
                        setSelectedConversation(null);
                        setSelectedMilestone(null);
                      }}
                      className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${selectedProject === project.id ? 'bg-gray-200' : ''}`}
                    >
                      <p className="font-semibold">{project.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <div className="w-3/4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
              </TabsList>
              <TabsContent value="conversations">
                <div className="flex gap-6">
                  <Card className="w-1/3">
                    <CardHeader>
                      <CardTitle>Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedProject ? (
                        conversations.length > 0 ? (
                          <ul className="space-y-3">
                            {conversations.map((conversation) => (
                              <li 
                                key={conversation.id} 
                                onClick={() => setSelectedConversation(conversation.id)}
                                className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${selectedConversation === conversation.id ? 'bg-gray-200' : ''}`}
                              >
                                <p className="font-semibold">Conversation {conversation.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-500">{new Date(conversation.created_at).toLocaleString()}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div>
                            <p className="mb-4">No conversations yet for this project.</p>
                            <Button onClick={() => createConversation(selectedProject)}>
                              Start New Conversation
                            </Button>
                          </div>
                        )
                      ) : (
                        <p>Select a project to view conversations</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="w-2/3">
                    <CardHeader>
                      <CardTitle>Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedConversation ? (
                        <>
                          <div className="h-[500px] overflow-y-auto mb-4">
                            {messages.map((message) => (
                              <div key={message.id} className={`mb-4 ${message.sender_id === currentUserUUID ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-3 rounded-lg ${message.sender_id === currentUserUUID ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                  <p>{message.content}</p>
                                  <p className="text-xs mt-1">{message.users?.name} - {new Date(message.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <form onSubmit={sendMessage} className="flex gap-3">
                            <Input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-grow"
                            />
                            <Button type="submit">Send</Button>
                          </form>
                        </>
                      ) : (
                        <p>Select a conversation to view messages</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="milestones">
                <div className="flex gap-6">
                  <Card className="w-1/3">
                    <CardHeader>
                      <CardTitle>Milestones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedProject ? (
                        milestones.filter(m => m.project_id === selectedProject).length > 0 ? (
                          <ul className="space-y-3">
                            {milestones.filter(m => m.project_id === selectedProject).map((milestone) => (
                              <li 
                                key={milestone.id} 
                                onClick={() => setSelectedMilestone(milestone.id)}
                                className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${selectedMilestone === milestone.id ? 'bg-gray-200' : ''}`}
                              >
                                <p className="font-semibold">{milestone.title}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No milestones for this project.</p>
                        )
                      ) : (
                        <p>Select a project to view milestones</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="w-2/3">
                    <CardHeader>
                      <CardTitle>Milestone Communications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedMilestone ? (
                        <>
                          <div className="h-[500px] overflow-y-auto mb-4">
                            {milestoneCommunications.map((comm) => (
                              <div key={comm.id} className={`mb-4 ${comm.user_id === currentUserUUID ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-3 rounded-lg ${comm.user_id === currentUserUUID ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                  <p>{comm.message}</p>
                                  <p className="text-xs mt-1">{comm.users?.name} - {new Date(comm.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <form onSubmit={sendMilestoneMessage} className="flex gap-3">
                            <Input
                              type="text"
                              value={newMilestoneMessage}
                              onChange={(e) => setNewMilestoneMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-grow"
                            />
                            <Button type="submit">Send</Button>
                          </form>
                        </>
                      ) : (
                        <p>Select a milestone to view communications</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Communication;