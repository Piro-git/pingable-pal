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
  const { user, profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchTeamData = async () => {
    if (!user || profile?.role !== 'admin') return;

    try {
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;
      setTeamMembers((members || []).map(member => ({
        ...member,
        role: member.role as 'admin' | 'editor' | 'viewer'
      })));

      // Fetch pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from('invitations')
        .select('*')
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
  }, [user, profile]);

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
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

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

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/70">Only administrators can access team management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Team Management</h2>
            <p className="text-white/70">Manage your team members and invitations</p>
          </div>
          <Badge variant="secondary" className="glass text-white border-white/20">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="glass border-white/20">
          <TabsTrigger value="members" className="text-white data-[state=active]:glass-button">
            Team Members
          </TabsTrigger>
          <TabsTrigger value="invite" className="text-white data-[state=active]:glass-button">
            Send Invitations
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-white data-[state=active]:glass-button">
            Pending Invitations
            {invitations.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members">
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Active Team Members</CardTitle>
              <CardDescription className="text-white/70">
                Manage roles and permissions for your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-white/70">Loading team members...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">No team members found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="glass rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full glass-button flex items-center justify-center">
                          <span className="text-white font-medium">
                            {member.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {member.full_name || member.email}
                            {member.id === user?.id && (
                              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                            )}
                          </p>
                          <p className="text-white/70 text-sm">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' && <Crown className="w-4 h-4 text-yellow-400" />}
                          {member.role === 'editor' && <Edit className="w-4 h-4 text-blue-400" />}
                          {member.role === 'viewer' && <Eye className="w-4 h-4 text-gray-400" />}
                          <span className="text-white capitalize">{member.role}</span>
                        </div>
                        
                        {member.id !== user?.id && (
                          <>
                            <Select 
                              value={member.role} 
                              onValueChange={(newRole: 'admin' | 'editor' | 'viewer') => 
                                handleRoleChange(member.id, newRole)
                              }
                            >
                              <SelectTrigger className="w-32 glass border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass border-white/20">
                                <SelectItem value="admin" className="text-white">Admin</SelectItem>
                                <SelectItem value="editor" className="text-white">Editor</SelectItem>
                                <SelectItem value="viewer" className="text-white">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="glass border-red-500/50 text-red-400 hover:bg-red-500/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass border-white/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Remove Team Member</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/70">
                                    Are you sure you want to remove {member.email} from the team? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="glass border-white/20 text-white">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRemoveUser(member.id)}
                                    className="bg-red-600 hover:bg-red-700"
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
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite New Team Members
              </CardTitle>
              <CardDescription className="text-white/70">
                Send email invitations to add new members to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invite-email" className="text-white">
                      Email Address
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address..."
                      className="glass border-white/20 text-white placeholder:text-white/50"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="invite-role" className="text-white">
                      Role
                    </Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'editor' | 'viewer')}>
                      <SelectTrigger className="glass border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/20">
                        <SelectItem value="editor" className="text-white">Editor</SelectItem>
                        <SelectItem value="viewer" className="text-white">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!inviteEmail.trim() || inviteLoading}
                  className="glass-button"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
              
              {/* Role Information */}
              <div className="mt-8 space-y-4">
                <h4 className="text-white font-medium">Role Permissions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">Editor</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      Can create and edit prompts, but cannot delete or manage users.
                    </p>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">Viewer</span>
                    </div>
                    <p className="text-white/70 text-sm">
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
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Pending Invitations</CardTitle>
              <CardDescription className="text-white/70">
                Manage invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-white/70">Loading invitations...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">No pending invitations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div 
                      key={invitation.id} 
                      className="glass rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full glass-button flex items-center justify-center">
                          <Mail className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{invitation.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs capitalize glass">
                              {invitation.role}
                            </Badge>
                            <span className="text-white/50 text-xs">
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
                          className="glass border-white/20 text-white hover:glass-button"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Resend
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="glass border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass border-white/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Revoke Invitation</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/70">
                                Are you sure you want to revoke the invitation for {invitation.email}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="glass border-white/20 text-white">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRevokeInvitation(invitation.id)}
                                className="bg-red-600 hover:bg-red-700"
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
  );
}