import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Shield, Edit, Eye, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export default function TeamManagement() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    // Redirect non-admin users
    if (profile && profile.role !== 'admin') {
      navigate('/prompts');
      return;
    }

    if (profile?.role === 'admin') {
      fetchTeamMembers();
    }
  }, [profile, navigate]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data?.map(member => ({
        ...member,
        role: member.role as 'admin' | 'editor' | 'viewer'
      })) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load team members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (userId === user?.id) {
      toast({
        title: "Error",
        description: "You cannot change your own role.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-400" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400';
      case 'editor':
        return 'text-blue-400';
      case 'viewer':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/70 mb-6">You need admin privileges to access this page.</p>
          <Button onClick={() => navigate('/prompts')} className="glass-button">
            Back to Prompts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
        </div>
        <p className="text-white/70">Manage user roles and permissions</p>
      </div>

      {/* Team Members List */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Team Members</h2>
          <div className="text-white/60 text-sm">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-white/70">Loading team members...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="glass rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {member.full_name?.charAt(0) || member.email?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {member.full_name || member.email}
                      {member.id === user?.id && (
                        <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-white/60 text-sm">{member.email}</div>
                    <div className="text-white/50 text-xs">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span className="font-medium capitalize">{member.role}</span>
                  </div>

                  {member.id !== user?.id && (
                    <Select
                      value={member.role}
                      onValueChange={(newRole: 'admin' | 'editor' | 'viewer') =>
                        updateUserRole(member.id, newRole)
                      }
                      disabled={updating === member.id}
                    >
                      <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/20">
                        <SelectItem
                          value="admin"
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="editor"
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-blue-400" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="viewer"
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            Viewer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Role Descriptions */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">Admin</span>
              </div>
              <p className="text-white/70 text-sm">
                Full access: create, edit, delete prompts and manage team members.
              </p>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Editor</span>
              </div>
              <p className="text-white/70 text-sm">
                Can create and edit prompts, but cannot delete or manage users.
              </p>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">Viewer</span>
              </div>
              <p className="text-white/70 text-sm">
                Read-only access: can view and use prompts but not modify them.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={() => navigate('/prompts')}
          className="glass border-white/20 text-white hover:bg-white/10"
        >
          Back to Prompts
        </Button>
      </div>
    </div>
  );
}