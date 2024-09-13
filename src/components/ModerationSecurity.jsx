import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Layout from './Layout';

const ModerationSecurity = () => {
  const [flags, setFlags] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [takedownRequests, setTakedownRequests] = useState([]);
  const [ipDisputes, setIPDisputes] = useState([]);
  const [newBlockedIP, setNewBlockedIP] = useState('');
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchFlags();
      fetchBlockedIPs();
      fetchFraudLogs();
      fetchTakedownRequests();
      fetchIPDisputes();
    }
  }, [currentUserUUID]);

  const fetchFlags = async () => {
    try {
      let { data, error } = await supabase
        .from('flags')
        .select(`
          id, 
          project_id, 
          flagger_id, 
          flagged_id, 
          reason, 
          status, 
          created_at,
          projects (id, title),
          flagger:users!flagger_id (id, name),
          flagged:users!flagged_id (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFlags(data);
    } catch (error) {
      toast.error('Error fetching flags: ' + error.message);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      let { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBlockedIPs(data);
    } catch (error) {
      toast.error('Error fetching blocked IPs: ' + error.message);
    }
  };

  const fetchFraudLogs = async () => {
    try {
      let { data, error } = await supabase
        .from('fraud_logs')
        .select('*')
        .order('detected_at', { ascending: false });
      if (error) throw error;
      setFraudLogs(data);
    } catch (error) {
      toast.error('Error fetching fraud logs: ' + error.message);
    }
  };

  const fetchTakedownRequests = async () => {
    try {
      let { data, error } = await supabase
        .from('takedown_requests')
        .select(`
          id, 
          project_id, 
          requester_id, 
          reason, 
          status, 
          resolution, 
          created_at, 
          resolved_at,
          projects (id, title),
          requester:users (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTakedownRequests(data);
    } catch (error) {
      toast.error('Error fetching takedown requests: ' + error.message);
    }
  };

  const fetchIPDisputes = async () => {
    try {
      let { data, error } = await supabase
        .from('ip_disputes')
        .select(`
          id, 
          project_id, 
          claimant_id, 
          reason, 
          status, 
          resolution, 
          created_at, 
          resolved_at,
          projects (id, title),
          claimant:users (id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setIPDisputes(data);
    } catch (error) {
      toast.error('Error fetching IP disputes: ' + error.message);
    }
  };

  const blockIP = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('blocked_ips')
        .insert([{ ip: newBlockedIP }]);
      if (error) throw error;
      toast.success('IP blocked successfully');
      fetchBlockedIPs();
      setNewBlockedIP('');
    } catch (error) {
      toast.error('Error blocking IP: ' + error.message);
    }
  };

  const resolveFlag = async (id, resolution) => {
    try {
      const { data, error } = await supabase
        .from('flags')
        .update({ status: 'resolved', resolution: resolution })
        .eq('id', id);
      if (error) throw error;
      toast.success('Flag resolved successfully');
      fetchFlags();
    } catch (error) {
      toast.error('Error resolving flag: ' + error.message);
    }
  };

  const resolveTakedownRequest = async (id, resolution) => {
    try {
      const { data, error } = await supabase
        .from('takedown_requests')
        .update({ status: 'resolved', resolution: resolution, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Takedown request resolved successfully');
      fetchTakedownRequests();
    } catch (error) {
      toast.error('Error resolving takedown request: ' + error.message);
    }
  };

  const resolveIPDispute = async (id, resolution) => {
    try {
      const { data, error } = await supabase
        .from('ip_disputes')
        .update({ status: 'resolved', resolution: resolution, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('IP dispute resolved successfully');
      fetchIPDisputes();
    } catch (error) {
      toast.error('Error resolving IP dispute: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Moderation and Security System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Block IP</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={blockIP} className="flex space-x-2">
              <Input
                type="text"
                placeholder="IP Address"
                value={newBlockedIP}
                onChange={(e) => setNewBlockedIP(e.target.value)}
                required
              />
              <Button type="submit">Block IP</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Flagger</TableHead>
                  <TableHead>Flagged User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>{flag.projects?.title}</TableCell>
                    <TableCell>{flag.flagger?.name}</TableCell>
                    <TableCell>{flag.flagged?.name}</TableCell>
                    <TableCell>{flag.reason}</TableCell>
                    <TableCell>{flag.status}</TableCell>
                    <TableCell>
                      {flag.status === 'pending' && (
                        <div className="space-x-2">
                          <Button onClick={() => resolveFlag(flag.id, 'approved')} size="sm">Approve</Button>
                          <Button onClick={() => resolveFlag(flag.id, 'rejected')} size="sm" variant="destructive">Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Blocked IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Blocked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedIPs.map((blockedIP) => (
                  <TableRow key={blockedIP.ip}>
                    <TableCell>{blockedIP.ip}</TableCell>
                    <TableCell>{new Date(blockedIP.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fraud Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detected At</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fraudLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.detected_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log, null, 2)}</pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Takedown Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {takedownRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.projects?.title}</TableCell>
                    <TableCell>{request.requester?.name}</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>{request.status}</TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="space-x-2">
                          <Button onClick={() => resolveTakedownRequest(request.id, 'approved')} size="sm">Approve</Button>
                          <Button onClick={() => resolveTakedownRequest(request.id, 'rejected')} size="sm" variant="destructive">Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ipDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>{dispute.projects?.title}</TableCell>
                    <TableCell>{dispute.claimant?.name}</TableCell>
                    <TableCell>{dispute.reason}</TableCell>
                    <TableCell>{dispute.status}</TableCell>
                    <TableCell>
                      {dispute.status === 'pending' && (
                        <div className="space-x-2">
                          <Button onClick={() => resolveIPDispute(dispute.id, 'in_favor_of_claimant')} size="sm">In favor of claimant</Button>
                          <Button onClick={() => resolveIPDispute(dispute.id, 'rejected')} size="sm" variant="destructive">Reject claim</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ModerationSecurity;