import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, TextField, Rating, Box, Typography } from '@mui/material';

/**
 * A form for submitting a book review.
 * @param {object} props - The component props.
 * @param {string} props.bookId - The ID of the book being reviewed.
 * @param {function} props.onSubmit - The function to call when the form is submitted.
 * @param {boolean} props.isSubmitting - Flag to indicate if the form is currently being submitted.
 */
const ReviewForm = ({ bookId, onSubmit, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit({ bookId, rating, comment });
      // Clear the form after submission
      setRating(0);
      setComment('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mt: 3, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
        <Typography variant="h6" gutterBottom>
          Write a Review
        </Typography>
        <Rating
          name="rating"
          value={rating}
          onChange={(event, newValue) => {
            setRating(newValue);
          }}
        />
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </Box>
    </form>
  );
};

ReviewForm.propTypes = {
  bookId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};

export default ReviewForm;