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

const SkillManagement = () => {
  const [skills, setSkills] = useState([]);
  const [skillOfferings, setSkillOfferings] = useState([]);
  const [skillTests, setSkillTests] = useState([]);
  const [skillEndorsements, setSkillEndorsements] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '' });
  const [newSkillOffering, setNewSkillOffering] = useState({ skill_id: '', description: '', hourly_rate: 0 });
  const [newSkillTest, setNewSkillTest] = useState({ skill_id: '', questions: [], passing_score: 70 });
  const [newEndorsement, setNewEndorsement] = useState({ endorsed_id: '', skill_id: '' });
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchSkills();
      fetchSkillOfferings();
      fetchSkillTests();
      fetchSkillEndorsements();
    }
  }, [currentUserUUID]);

  const fetchSkills = async () => {
    try {
      let { data, error } = await supabase.from('skills').select('id, name').range(0, 9);
      if (error) throw error;
      setSkills(data);
    } catch (error) {
      toast.error('Error fetching skills: ' + error.message);
    }
  };

  const fetchSkillOfferings = async () => {
    try {
      let { data, error } = await supabase
        .from('skill_offerings')
        .select('id, user_id, skill_id, description, hourly_rate, is_available')
        .eq('user_id', currentUserUUID)
        .range(0, 9);
      if (error) throw error;
      setSkillOfferings(data);
    } catch (error) {
      toast.error('Error fetching skill offerings: ' + error.message);
    }
  };

  const fetchSkillTests = async () => {
    try {
      let { data, error } = await supabase
        .from('skill_tests')
        .select('id, skill_id, passing_score')
        .range(0, 9);
      if (error) throw error;
      setSkillTests(data);
    } catch (error) {
      toast.error('Error fetching skill tests: ' + error.message);
    }
  };

  const fetchSkillEndorsements = async () => {
    try {
      let { data, error } = await supabase
        .from('skill_endorsements')
        .select('id, endorser_id, endorsed_id, skill_id')
        .or(`endorser_id.eq.${currentUserUUID},endorsed_id.eq.${currentUserUUID}`)
        .range(0, 9);
      if (error) throw error;
      setSkillEndorsements(data);
    } catch (error) {
      toast.error('Error fetching skill endorsements: ' + error.message);
    }
  };

  const createSkill = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('skills').insert([newSkill]);
      if (error) throw error;
      toast.success('Skill created successfully!');
      fetchSkills();
      setNewSkill({ name: '' });
    } catch (error) {
      toast.error('Error creating skill: ' + error.message);
    }
  };

  const createSkillOffering = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('skill_offerings')
        .insert([{ ...newSkillOffering, user_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('Skill offering created successfully!');
      fetchSkillOfferings();
      setNewSkillOffering({ skill_id: '', description: '', hourly_rate: 0 });
    } catch (error) {
      toast.error('Error creating skill offering: ' + error.message);
    }
  };

  const createSkillTest = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('skill_tests').insert([newSkillTest]);
      if (error) throw error;
      toast.success('Skill test created successfully!');
      fetchSkillTests();
      setNewSkillTest({ skill_id: '', questions: [], passing_score: 70 });
    } catch (error) {
      toast.error('Error creating skill test: ' + error.message);
    }
  };

  const createEndorsement = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('skill_endorsements')
        .insert([{ ...newEndorsement, endorser_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('Endorsement created successfully!');
      fetchSkillEndorsements();
      setNewEndorsement({ endorsed_id: '', skill_id: '' });
    } catch (error) {
      toast.error('Error creating endorsement: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Skill Management System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Skill</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSkill} className="space-y-4">
              <Input
                type="text"
                placeholder="Skill name"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ name: e.target.value })}
                required
              />
              <Button type="submit">Create Skill</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Skill Offering</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSkillOffering} className="space-y-4">
              <Select
                value={newSkillOffering.skill_id}
                onValueChange={(value) => setNewSkillOffering({ ...newSkillOffering, skill_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Description"
                value={newSkillOffering.description}
                onChange={(e) => setNewSkillOffering({ ...newSkillOffering, description: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Hourly rate"
                value={newSkillOffering.hourly_rate}
                onChange={(e) => setNewSkillOffering({ ...newSkillOffering, hourly_rate: parseFloat(e.target.value) })}
                required
              />
              <Button type="submit">Create Skill Offering</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Skill Test</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSkillTest} className="space-y-4">
              <Select
                value={newSkillTest.skill_id}
                onValueChange={(value) => setNewSkillTest({ ...newSkillTest, skill_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Questions (JSON format)"
                value={JSON.stringify(newSkillTest.questions)}
                onChange={(e) => setNewSkillTest({ ...newSkillTest, questions: JSON.parse(e.target.value) })}
                required
              />
              <Input
                type="number"
                placeholder="Passing score"
                value={newSkillTest.passing_score}
                onChange={(e) => setNewSkillTest({ ...newSkillTest, passing_score: parseInt(e.target.value) })}
                required
              />
              <Button type="submit">Create Skill Test</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Endorsement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createEndorsement} className="space-y-4">
              <Input
                type="text"
                placeholder="Endorsed User ID"
                value={newEndorsement.endorsed_id}
                onChange={(e) => setNewEndorsement({ ...newEndorsement, endorsed_id: e.target.value })}
                required
              />
              <Select
                value={newEndorsement.skill_id}
                onValueChange={(value) => setNewEndorsement({ ...newEndorsement, skill_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit">Create Endorsement</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Skill Offerings</CardTitle>
          </CardHeader>
          <CardContent>
            {skillOfferings.length === 0 ? (
              <p>No skill offerings found.</p>
            ) : (
              <ul className="space-y-2">
                {skillOfferings.map((offering) => (
                  <li key={offering.id} className="bg-gray-100 p-2 rounded">
                    <p><strong>Skill:</strong> {skills.find(s => s.id === offering.skill_id)?.name}</p>
                    <p><strong>Description:</strong> {offering.description}</p>
                    <p><strong>Hourly Rate:</strong> ${offering.hourly_rate}</p>
                    <p><strong>Available:</strong> {offering.is_available ? 'Yes' : 'No'}</p>
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

export default SkillManagement;