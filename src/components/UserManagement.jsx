import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const { currentUserUUID } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    if (currentUserUUID) {
      fetchUsers();
      fetchCurrentUserRole();
    }
  }, [currentUserUUID, page]);

  const fetchCurrentUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUserUUID)
        .single();

      if (error) throw error;
      setCurrentUserRole(data.role);
    } catch (error) {
      console.error('Error fetching current user role:', error);
      toast.error('Error fetching user role');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, created_at, last_login_at, reputation')
        .range(page * 10, (page + 1) * 10 - 1)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      toast.error('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .insert([newUser]);
      if (error) throw error;
      toast.success('User created successfully!');
      fetchUsers();
      setNewUser({ email: '', name: '', role: '' });
    } catch (error) {
      toast.error('Error creating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .update(editingUser)
        .eq('id', editingUser.id);
      if (error) throw error;
      toast.success('User updated successfully!');
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      toast.error('Error updating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'moderator') {
      toast.error('You do not have permission to delete users');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      toast.error('Error deleting user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canManageUsers = currentUserRole === 'admin' || currentUserRole === 'moderator';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">User Management</h1>
        
        {canManageUsers && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingUser ? 'Edit User' : 'Create New User'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingUser ? updateUser : createUser} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={editingUser ? editingUser.email : newUser.email}
                  onChange={(e) => editingUser ? setEditingUser({...editingUser, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})}
                  required
                />
                <Input
                  type="text"
                  placeholder="Name"
                  value={editingUser ? editingUser.name : newUser.name}
                  onChange={(e) => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})}
                  required
                />
                <Select
                  value={editingUser ? editingUser.role : newUser.role}
                  onValueChange={(value) => editingUser ? setEditingUser({...editingUser, role: value}) : setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Processing...' : (editingUser ? 'Update User' : 'Create User')}
                </Button>
                {editingUser && (
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Reputation</TableHead>
                    {canManageUsers && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>{user.reputation}</TableCell>
                      {canManageUsers && (
                        <TableCell>
                          <Button onClick={() => setEditingUser(user)} className="mr-2">Edit</Button>
                          <Button onClick={() => deleteUser(user.id)} variant="destructive">Delete</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              Previous
            </Button>
            <Button onClick={() => setPage(page + 1)} disabled={users.length < 10}>
              Next
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default UserManagement;