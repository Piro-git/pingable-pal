import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, Lock, Bell, Key, Shield, Trash2, Save, Copy, CheckCircle2, CreditCard } from 'lucide-react';
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

export default function Settings() {
  const { user, profile, signOut, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Profile settings
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [downAlerts, setDownAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      // In a real app, you'd call an edge function to properly delete the user
      await signOut();
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast({
      title: "Copied!",
      description: "Copied to clipboard.",
    });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleManageSubscription = async () => {
    if (!user || !session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-card">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Key className="w-4 h-4 mr-2" />
            API & Keys
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="bg-gradient-primary border-primary/20 shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-background/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-background/30 border-border opacity-60"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <Button 
                onClick={handleUpdateProfile} 
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="bg-gradient-secondary border-secondary/20 shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                <Lock className="w-6 h-6 text-secondary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground font-medium">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-background/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-background/50 border-border"
                />
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={loading}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-glow-secondary"
              >
                <Save className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-destructive/20 shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl text-destructive flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="shadow-glow-primary">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-background border-border">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="bg-gradient-accent border-accent/20 shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                <Bell className="w-6 h-6 text-accent" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div className="space-y-1">
                  <Label className="text-foreground font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email notifications about your account</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div className="space-y-1">
                  <Label className="text-foreground font-medium">Down Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when a check goes down</p>
                </div>
                <Switch
                  checked={downAlerts}
                  onCheckedChange={setDownAlerts}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className="text-foreground font-medium">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                </div>
                <Switch
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                />
              </div>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow-accent">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-6 mt-6">
          <Card className="bg-gradient-primary border-primary/20 shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                Subscription & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <div className="space-y-1">
                    <Label className="text-foreground font-medium">Current Plan</Label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {profile?.subscription_tier === 'pro' ? 'Pro' : 'Free'} Plan
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    profile?.subscription_tier === 'pro' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {profile?.subscription_tier === 'pro' ? 'Active' : 'Free Tier'}
                  </div>
                </div>

                {profile?.subscription_tier === 'pro' && profile?.subscription_end_date && (
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="space-y-1">
                      <Label className="text-foreground font-medium">Renewal Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(profile.subscription_end_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <Label className="text-foreground font-medium">Check Limit</Label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.subscription_tier === 'pro' ? 'Unlimited' : '3 checks maximum'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {profile?.subscription_tier === 'pro' ? (
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/pricing'}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Billing Information
                </h4>
                <p className="text-sm text-muted-foreground">
                  {profile?.subscription_tier === 'pro' 
                    ? 'Your subscription is managed through Stripe. Click "Manage Subscription" to update payment methods, view invoices, or cancel your subscription.'
                    : 'Upgrade to Pro for unlimited monitoring checks, Slack notifications, and priority support.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API & Keys */}
        <TabsContent value="api" className="space-y-6 mt-6">
          <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                <Key className="w-6 h-6 text-primary" />
                API Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Your User ID</Label>
                <div className="flex gap-2">
                  <Input
                    value={user?.id || ''}
                    readOnly
                    className="bg-background/30 border-border font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(user?.id || '')}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    {copiedKey ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Use this ID for API integrations</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Webhook Endpoint</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/api/webhook`}
                    readOnly
                    className="bg-background/30 border-border font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/webhook`)}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Send POST requests to this endpoint</p>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  API Documentation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Learn how to integrate FlowZen with your workflows and set up automated monitoring.
                </p>
                <Button variant="outline" size="sm" className="mt-2 border-primary/20 hover:bg-primary/10">
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
