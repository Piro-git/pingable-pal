import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password must be less than 72 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Register() {
  const { user, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('invite_token');
    if (token) {
      // Validate invite token and pre-fill email
      validateInviteToken(token);
    }
  }, [searchParams]);

  const validateInviteToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('email, role')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        return;
      }

      setInviteToken(token);
      setInviteEmail(data.email);
      setInviteRole(data.role);
      setEmail(data.email);

      toast({
        title: "Invitation Found",
        description: `You've been invited as ${data.role}. Please complete your registration.`,
      });
    } catch (error) {
      console.error('Error validating invite token:', error);
    }
  };

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      const validated = registerSchema.parse({ 
        email: email.trim(), 
        password, 
        confirmPassword 
      });

      const { error } = await signUp(validated.email, validated.password);

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message || "User already exists",
          variant: "destructive",
        });
      } else {
        // If this is an invite signup, update the invitation status
        if (inviteToken) {
          try {
            const { error: inviteError } = await supabase
              .from('invitations')
              .update({ status: 'accepted' })
              .eq('token', inviteToken);

            if (inviteError) {
              console.error('Error updating invitation status');
            }
          } catch (error) {
            console.error('Error processing invitation');
          }
        }

        toast({
          title: "Registration Successful",
          description: inviteToken 
            ? "Welcome to the team! Please check your email to confirm your account, then sign in."
            : "Please check your email to confirm your account, then sign in.",
        });
        navigate('/login');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">StatusPing</h1>
          <p className="text-white/70">
            {inviteToken ? `Join ${inviteEmail}'s team` : 'Create your account'}
          </p>
          {inviteToken && (
            <p className="text-white/50 text-sm mt-2">
              Role: {inviteRole}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="Enter your email"
              disabled={!!inviteToken}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-input"
              placeholder="Confirm your password"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full glass-button"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/70">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}