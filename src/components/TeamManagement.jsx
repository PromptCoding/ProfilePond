import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from './Layout';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '' });
  const [newTeamMember, setNewTeamMember] = useState({ team_id: '', user_id: '', role: '' });
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchTeams();
      fetchTeamMembers();
    }
  }, [currentUserUUID]);

  const fetchTeams = async () => {
    try {
      let { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTeams(data);
    } catch (error) {
      toast.error('Error fetching teams: ' + error.message);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      let { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          user_id,
          role,
          users (id, name)
        `);
      if (error) throw error;
      setTeamMembers(data);
    } catch (error) {
      toast.error('Error fetching team members: ' + error.message);
    }
  };

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([newTeam]);
      if (error) throw error;
      toast.success('Team created successfully!');
      fetchTeams();
      setNewTeam({ name: '' });
    } catch (error) {
      toast.error('Error creating team: ' + error.message);
    }
  };

  const addTeamMember = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([newTeamMember]);
      if (error) throw error;
      toast.success('Team member added successfully!');
      fetchTeamMembers();
      setNewTeamMember({ team_id: '', user_id: '', role: '' });
    } catch (error) {
      toast.error('Error adding team member: ' + error.message);
    }
  };

  const removeTeamMember = async (teamId, userId) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .delete()
        .match({ team_id: teamId, user_id: userId });
      if (error) throw error;
      toast.success('Team member removed successfully!');
      fetchTeamMembers();
    } catch (error) {
      toast.error('Error removing team member: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Team Management System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Team</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTeam} className="space-y-4">
              <Input
                type="text"
                placeholder="Team name"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ name: e.target.value })}
                required
              />
              <Button type="submit">Create Team</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTeamMember} className="space-y-4">
              <Select
                value={newTeamMember.team_id}
                onValueChange={(value) => setNewTeamMember({ ...newTeamMember, team_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="User ID"
                value={newTeamMember.user_id}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, user_id: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Role"
                value={newTeamMember.role}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                required
              />
              <Button type="submit">Add Team Member</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teams and Members</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.map((team) => (
              <div key={team.id} className="mb-4">
                <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
                <ul className="space-y-2">
                  {teamMembers
                    .filter((member) => member.team_id === team.id)
                    .map((member) => (
                      <li key={`${team.id}-${member.user_id}`} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                        <span>
                          {member.users.name} - Role: {member.role}
                        </span>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeTeamMember(team.id, member.user_id)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TeamManagement;