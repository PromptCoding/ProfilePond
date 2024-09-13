import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Layout from './Layout';

const ReviewFeedback = () => {
  const [reviews, setReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newReview, setNewReview] = useState({ project_id: '', rating: 0, comment: '' });
  const [newFeedback, setNewFeedback] = useState({ review_id: '', rating: 0, comment: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUserUUID } = useAuth();

  useEffect(() => {
    if (currentUserUUID) {
      fetchReviews();
      fetchProjects();
    }
  }, [currentUserUUID]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('creator_id', currentUserUUID);
      if (error) throw error;
      setProjects(data);
    } catch (error) {
      toast.error('Error fetching projects: ' + error.message);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, 
          project_id, 
          reviewer_id, 
          reviewee_id, 
          rating, 
          comment,
          projects(title),
          reviewer:users!reviewer_id(id, name),
          reviewee:users!reviewee_id(id, name),
          feedback(id, rating, comment, sender_id, sender:users!sender_id(id, name))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data);
    } catch (error) {
      toast.error('Error fetching reviews: ' + error.message);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!currentUserUUID) {
      toast.error('You must be logged in to submit a review');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{ 
          ...newReview, 
          reviewer_id: currentUserUUID, 
          reviewee_id: currentUserUUID 
        }]);
      
      if (error) throw error;
      
      toast.success('Review submitted successfully!');
      fetchReviews();
      setNewReview({ project_id: '', rating: 0, comment: '' });
    } catch (error) {
      toast.error('Error submitting review: ' + error.message);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert([{ ...newFeedback, sender_id: currentUserUUID }]);
      if (error) throw error;
      toast.success('Feedback submitted successfully!');
      fetchReviews();
      setNewFeedback({ review_id: '', rating: 0, comment: '' });
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Error submitting feedback: ' + error.message);
    }
  };

  const openFeedbackModal = (reviewId) => {
    setNewFeedback({ ...newFeedback, review_id: reviewId });
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Review and Feedback System</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitReview} className="space-y-4">
              <Select
                value={newReview.project_id}
                onValueChange={(value) => setNewReview({ ...newReview, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Rating"
                min="0"
                max="5"
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseFloat(e.target.value) })}
                required
              />
              <Textarea
                placeholder="Comment"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                required
              />
              <Button type="submit">Submit Review</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reviews and Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p>No reviews found.</p>
            ) : (
              <ul className="space-y-6">
                {reviews.map((review) => (
                  <li key={review.id} className="bg-gray-100 p-4 rounded-md">
                    <div>
                      <p><strong>Project:</strong> {review.projects?.title}</p>
                      <p><strong>Reviewer:</strong> {review.reviewer?.name}</p>
                      <p><strong>Reviewee:</strong> {review.reviewee?.name}</p>
                      <p><strong>Rating:</strong> {review.rating}/5</p>
                      <p><strong>Comment:</strong> {review.comment}</p>
                      <Button 
                        variant="link" 
                        onClick={() => openFeedbackModal(review.id)}
                        className="mt-2"
                      >
                        Respond
                      </Button>
                    </div>
                    {review.feedback && review.feedback.length > 0 && (
                      <div className="mt-4 ml-4 border-l-2 border-gray-300 pl-4">
                        <h4 className="font-semibold mb-2">Feedback:</h4>
                        <ul className="space-y-2">
                          {review.feedback.map((fb) => (
                            <li key={fb.id} className="bg-white p-2 rounded">
                              <p><strong>From:</strong> {fb.sender?.name}</p>
                              <p><strong>Rating:</strong> {fb.rating}/5</p>
                              <p><strong>Comment:</strong> {fb.comment}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitFeedback} className="space-y-4">
              <Input
                type="number"
                placeholder="Rating"
                min="0"
                max="5"
                value={newFeedback.rating}
                onChange={(e) => setNewFeedback({ ...newFeedback, rating: parseInt(e.target.value) })}
                required
              />
              <Textarea
                placeholder="Comment"
                value={newFeedback.comment}
                onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                required
              />
              <DialogFooter>
                <Button type="submit">Submit Feedback</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ReviewFeedback;