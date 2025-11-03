import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Mail, Shield, Trash2, RefreshCw, Crown, Edit, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
  status: 'pending' | 'accepted';
  created_at: string;
}

export default function TeamManagement() {
  const { user, role } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchTeamData = async () => {
    if (!user || role !== 'admin') return;

    try {
      // Fetch roles first (this is what we have permission for as admin)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // For each role, fetch the profile
      const profilePromises = (rolesData || []).map(async (roleEntry) => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .eq('id', roleEntry.user_id)
          .single();
        
        if (profileError || !profile) return null;
        
        return {
          ...profile,
          role: roleEntry.role as 'admin' | 'editor' | 'viewer'
        };
      });

      const profiles = await Promise.all(profilePromises);
      setTeamMembers(profiles.filter(Boolean) as UserProfile[]);

      // Fetch pending invitations  
      const { data: invites, error: invitesError } = await supabase
        .from('invitations')
        .select('id, email, role, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvitations((invites || []).map(invite => ({
        ...invite,
        role: invite.role as 'editor' | 'viewer',
        status: invite.status as 'pending' | 'accepted'
      })));
    } catch (error: any) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [user, role]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user) return;

    setInviteLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-team-invite', {
        body: { 
          email: inviteEmail.trim(),
          role: inviteRole
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}!`,
      });

      setInviteEmail('');
      setInviteRole('viewer');
      fetchTeamData(); // Refresh the data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      // First delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role updated successfully!",
      });

      fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User removed from team.",
      });

      fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation revoked successfully.",
      });

      fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invitation.",
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (email: string, role: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-team-invite', {
        body: { email, role }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation resent to ${email}!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation.",
        variant: "destructive",
      });
    }
  };

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-gradient-accent shadow-card border-accent/20 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access team management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 p-6">
        {/* Header */}
        <Card className="bg-gradient-primary shadow-card hover:shadow-card-hover transition-all duration-300 border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-foreground">Team Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Manage your team members and invitations</p>
              </div>
              <Badge variant="secondary" className="shadow-glow-primary">
                <span className="text-foreground font-medium">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="members" className="space-y-6">
        <Card className="bg-gradient-card shadow-card border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background/5 to-transparent" />
          <CardContent className="p-4 relative">
            <TabsList className="bg-background/30 border border-border">
              <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Team Members
              </TabsTrigger>
              <TabsTrigger value="invite" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Send Invitations
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Pending Invitations
                {invitations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    <span>{invitations.length}</span>
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Team Members Tab */}
        <TabsContent value="members">
          <Card className="bg-gradient-card shadow-card hover:shadow-card-hover transition-all duration-300 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-background/5 to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="text-foreground">Active Team Members</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage roles and permissions for your team members
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading team members...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No team members found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="bg-background/60 backdrop-blur-sm border border-border/70 rounded-xl p-4 flex items-center justify-between hover:bg-background/80 hover:border-border transition-all duration-200 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                          <span className="text-primary font-medium">
                            {member.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">
                            {member.full_name || member.email}
                            {member.id === user?.id && (
                              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                            )}
                          </p>
                          <p className="text-muted-foreground text-sm">{member.email}</p>
                        </div>
                      </div>
                      
                        <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' && <Crown className="w-4 h-4 text-primary" />}
                          {member.role === 'editor' && <Edit className="w-4 h-4 text-accent" />}
                          {member.role === 'viewer' && <Eye className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-foreground font-medium capitalize">{member.role}</span>
                        </div>
                        
                        {member.id !== user?.id && (
                          <>
                            <Select 
                              value={member.role} 
                              onValueChange={(newRole: 'admin' | 'editor' | 'viewer') => 
                                handleRoleChange(member.id, newRole)
                              }
                            >
                              <SelectTrigger className="w-32 bg-background/50 border-border/70 text-foreground hover:bg-background/70 font-medium">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/20 hover:border-destructive font-medium"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {member.email} from the team? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRemoveUser(member.id)}
                                    className="bg-accent hover:bg-accent/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Invitations Tab */}
        <TabsContent value="invite">
          <Card className="bg-gradient-secondary shadow-card hover:shadow-card-hover transition-all duration-300 border-secondary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite New Team Members
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Send email invitations to add new members to your team
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invite-email">
                      Email Address
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="invite-role">
                      Role
                    </Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'editor' | 'viewer')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!inviteEmail.trim() || inviteLoading}
                  className="shadow-glow-primary"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
              
              {/* Role Information */}
              <div className="mt-8 space-y-4">
                <h4 className="text-foreground font-medium">Role Permissions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background/30 backdrop-blur-sm border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit className="w-4 h-4 text-accent" />
                      <span className="text-foreground font-medium">Editor</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Can create and edit prompts, but cannot delete or manage users.
                    </p>
                  </div>
                  <div className="bg-background/30 backdrop-blur-sm border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground font-medium">Viewer</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Read-only access: can view and use prompts but not modify them.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Invitations Tab */}
        <TabsContent value="pending">
          <Card className="bg-gradient-accent shadow-card hover:shadow-card-hover transition-all duration-300 border-accent/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="text-foreground">Pending Invitations</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading invitations...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending invitations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div 
                      key={invitation.id} 
                      className="bg-background/30 backdrop-blur-sm border border-border rounded-xl p-4 flex items-center justify-between hover:bg-background/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                          <Mail className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{invitation.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {invitation.role}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              Sent {new Date(invitation.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.email, invitation.role)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Resend
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-accent/50 text-accent hover:bg-accent/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to revoke the invitation for {invitation.email}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRevokeInvitation(invitation.id)}
                                className="bg-accent hover:bg-accent/90"
                              >
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </div>
      </div>
  );
}