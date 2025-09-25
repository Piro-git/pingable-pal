import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { MessageCircle, Send } from 'lucide-react';

interface Feedback {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface FeedbackSectionProps {
  promptId: string;
}

export function FeedbackSection({ promptId }: FeedbackSectionProps) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (promptId) {
      fetchFeedbacks();
    }
  }, [promptId]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      // Fetch feedback with user profiles separately to avoid relation issues
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('prompt_feedback')
        .select('*')
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Get profiles for each feedback
      const feedbacksWithProfiles = [];
      for (const feedback of feedbackData || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', feedback.user_id)
          .single();

        feedbacksWithProfiles.push({
          ...feedback,
          profiles: profileData || { full_name: '', email: '' }
        });
      }

      setFeedbacks(feedbacksWithProfiles);
      
      // Find current user's feedback
      const currentUserFeedback = feedbacksWithProfiles.find(f => f.user_id === user?.id);
      if (currentUserFeedback) {
        setUserFeedback(currentUserFeedback);
        setNewRating(currentUserFeedback.rating);
        setNewComment(currentUserFeedback.comment || '');
      }
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user || newRating === 0) return;

    setSubmitting(true);
    try {
      const feedbackData = {
        prompt_id: promptId,
        user_id: user.id,
        rating: newRating,
        comment: newComment.trim() || null,
      };

      if (userFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('prompt_feedback')
          .update(feedbackData)
          .eq('id', userFeedback.id);

        if (error) throw error;
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('prompt_feedback')
          .insert(feedbackData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: userFeedback ? "Feedback updated!" : "Feedback submitted!",
      });

      fetchFeedbacks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = feedbacks.length > 0 
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Feedback & Discussion
        </h3>
        <div className="text-white/60">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Feedback & Discussion
        </h3>
        {feedbacks.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} readonly showValue />
            <span className="text-white/60 text-sm">
              ({feedbacks.length} review{feedbacks.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {/* User's feedback form */}
      <div className="glass p-4 rounded-lg space-y-4">
        <Label className="text-white">
          {userFeedback ? 'Update your review' : 'Leave a review'}
        </Label>
        
        <div className="space-y-3">
          <div>
            <Label className="text-white/80 text-sm">Rating</Label>
            <StarRating 
              rating={newRating} 
              onRatingChange={setNewRating}
              size="lg"
            />
          </div>
          
          <div>
            <Label className="text-white/80 text-sm">Comment (optional)</Label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this prompt..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30"
              rows={3}
            />
          </div>
          
          <Button
            onClick={handleSubmitFeedback}
            disabled={newRating === 0 || submitting}
            className="glass-button"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting 
              ? 'Submitting...' 
              : userFeedback 
                ? 'Update Review' 
                : 'Submit Review'
            }
          </Button>
        </div>
      </div>

      {/* Existing feedback */}
      {feedbacks.length > 0 && (
        <div className="space-y-3">
          <Label className="text-white">Reviews</Label>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="glass p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {feedback.profiles?.full_name?.charAt(0) || feedback.profiles?.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {feedback.profiles?.full_name || feedback.profiles?.email || 'Anonymous'}
                      </div>
                      <StarRating rating={feedback.rating} readonly size="sm" />
                    </div>
                  </div>
                  <div className="text-white/60 text-xs">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {feedback.comment && (
                  <div className="text-white/80 text-sm mt-2">
                    {feedback.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
