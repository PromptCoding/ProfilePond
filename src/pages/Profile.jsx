import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AuthModal from '../components/AuthModal';
import Layout from '../components/Layout';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        toast.error('Error fetching session. Please try logging in again.');
        setIsAuthModalOpen(true);
        setLoading(false);
        return;
      }
      setSession(data.session);
      if (data.session) {
        getProfile(data.session.user.id);
      } else {
        setLoading(false);
        setIsAuthModalOpen(true);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await getProfile(newSession.user.id);
        setIsAuthModalOpen(false);
      } else {
        setUser(null);
        setLoading(false);
        setIsAuthModalOpen(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const getProfile = async (userId) => {
    try {
      setLoading(true);
      let { data, error, status } = await supabase
        .from('users')
        .select(`*`)
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUser(data);
      }
    } catch (error) {
      toast.error('Error loading user data!');
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error('No user logged in!');
      return;
    }

    try {
      setLoading(true);

      const updates = {
        id: session.user.id,
        updated_at: new Date().toISOString(),
        name: user.name,
        phone_number: user.phone_number,
        website: user.website,
        company: user.company,
        job_title: user.job_title,
        time_zone: user.time_zone,
      };

      let { error } = await supabase.from('users').upsert(updates);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Error updating the profile!');
      console.error('Error updating the profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out!');
      console.error('Error signing out:', error);
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        {session ? (
          <Card className="w-[600px]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center">Loading profile data...</div>
              ) : (
                <form onSubmit={updateProfile} className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user?.avatar_url} alt={user?.name} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={user?.name || ''}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={session.user.email}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={user?.role || ''}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reputation">Reputation</Label>
                      <Input
                        id="reputation"
                        value={user?.reputation || ''}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeZone">Time Zone</Label>
                      <Input
                        id="timeZone"
                        value={user?.time_zone || ''}
                        onChange={(e) => setUser({...user, time_zone: e.target.value})}
                        placeholder="Enter your time zone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastLoginIp">Last Login IP</Label>
                      <Input
                        id="lastLoginIp"
                        value={user?.last_login_ip || ''}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availableBalance">Available Balance</Label>
                      <Input
                        id="availableBalance"
                        value={user?.available_balance || ''}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={user?.phone_number || ''}
                        onChange={(e) => setUser({...user, phone_number: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={user?.website || ''}
                        onChange={(e) => setUser({...user, website: e.target.value})}
                        placeholder="Enter your website"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={user?.company || ''}
                        onChange={(e) => setUser({...user, company: e.target.value})}
                        placeholder="Enter your company"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={user?.job_title || ''}
                        onChange={(e) => setUser({...user, job_title: e.target.value})}
                        placeholder="Enter your job title"
                      />
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
              <Button onClick={updateProfile} disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center">
            <p className="mb-4">Please sign in to view your profile.</p>
            <Button onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </Layout>
  );
};

export default Profile;