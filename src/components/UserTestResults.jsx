import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const UserTestResults = () => {
  const [testResults, setTestResults] = useState([]);
  const [newTestResult, setNewTestResult] = useState({
    user_id: '',
    test_id: '',
    score: 0,
    passed: false
  });
  const [loading, setLoading] = useState(true);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchTestResults();
    }
  }, [currentUserUUID]);

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('user_test_results')
        .select(`
          user:users (id, name), 
          test:skill_tests (id, skill_id), 
          score, 
          passed,
          taken_at
        `)
        .order('taken_at', { ascending: false });
      if (error) throw error;
      setTestResults(data);
    } catch (error) {
      toast.error('Error fetching test results: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_test_results')
        .insert([newTestResult]);
      if (error) throw error;
      toast.success('Test result added successfully!');
      fetchTestResults();
      setNewTestResult({
        user_id: '',
        test_id: '',
        score: 0,
        passed: false
      });
    } catch (error) {
      toast.error('Error adding test result: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTestResult = async (userId, testId, newScore, newPassed) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_test_results')
        .update({ score: newScore, passed: newPassed })
        .match({ user_id: userId, test_id: testId });
      if (error) throw error;
      toast.success('Test result updated successfully');
      fetchTestResults();
    } catch (error) {
      toast.error('Error updating test result: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">User Test Results System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTestResult} className="space-y-4">
              <Input
                type="text"
                placeholder="User ID"
                value={newTestResult.user_id}
                onChange={(e) => setNewTestResult({ ...newTestResult, user_id: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Test ID"
                value={newTestResult.test_id}
                onChange={(e) => setNewTestResult({ ...newTestResult, test_id: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Score"
                value={newTestResult.score}
                onChange={(e) => setNewTestResult({ ...newTestResult, score: parseInt(e.target.value) })}
                required
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="passed"
                  checked={newTestResult.passed}
                  onChange={(e) => setNewTestResult({ ...newTestResult, passed: e.target.checked })}
                />
                <label htmlFor="passed">Passed</label>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Test Result'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading test results...</p>
            ) : testResults.length === 0 ? (
              <p>No test results found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Passed</TableHead>
                    <TableHead>Taken At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testResults.map((result) => (
                    <TableRow key={`${result.user.id}-${result.test.id}`}>
                      <TableCell>{result.user.name}</TableCell>
                      <TableCell>{result.test.skill_id}</TableCell>
                      <TableCell>{result.score}</TableCell>
                      <TableCell>{result.passed ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{new Date(result.taken_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => updateTestResult(result.user.id, result.test.id, result.score + 1, !result.passed)} 
                          variant="outline"
                        >
                          Update
                        </Button>
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

export default UserTestResults;