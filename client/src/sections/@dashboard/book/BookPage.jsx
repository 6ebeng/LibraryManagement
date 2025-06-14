import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box, Button, Card, CircularProgress, Container, Grid, IconButton, MenuItem, Popover, Stack, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Rating
} from '@mui/material';
import { Alert } from '@mui/lab';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../../hooks/useAuth';
import Label from '../../../components/label';
import BookDialog from './BookDialog';
import BookForm from './BookForm';
import ReviewForm from './ReviewForm'; // Import the new review form
import Iconify from '../../../components/iconify';
import { apiUrl, methods, routes } from '../../../constants';
import { fDate } from '../../../utils/formatTime';


// ----------------------------------------------------------------------

const StyledBookImage = styled('img')({
  top: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  position: 'absolute',
});

// New component to display the list of reviews
const ReviewList = ({ reviews, isLoading }) => {
  if (isLoading) {
    return <CircularProgress />;
  }
  if (!reviews || reviews.length === 0) {
    return <Typography sx={{ mt: 2 }}>No reviews yet.</Typography>;
  }

  return (
    <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
      {reviews.map((review) => (
        <Card key={review._id} sx={{ mb: 2, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">{review.memberId?.name || 'Anonymous'}</Typography>
            {/* FIX: Use review.rating for the star value */}
            <Rating value={review.rating} readOnly size="small" />
          </Stack>
          {/* FIX: Use review.comment for the comment text */}
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>{review.comment}</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', textAlign: 'right' }}>
            {fDate(review.createdAt)}
          </Typography>
        </Card>
      ))}
    </Box>
  );
};
ReviewList.propTypes = {
  reviews: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
};


// Main Book Page Component
const BookPage = () => {
  const { user } = useAuth();

  // State for books
  const [book, setBook] = useState({
    id: '', name: '', isbn: '', summary: '', isAvailable: true, authorId: '', genreId: '', photoUrl: '',
  });
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [isTableLoading, setIsTableLoading] = useState(true);

  // State for pop-up menus and dialogs
  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateForm, setIsUpdateForm] = useState(false);

  // New state for viewing book details and reviews
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);


  // --- API OPERATIONS ---

  const getAllBooks = () => {
    setIsTableLoading(true);
    axios.get(apiUrl(routes.BOOK, methods.GET_ALL))
      .then((response) => {
        setBooks(response.data.booksList);
      })
      .catch((error) => {
        console.error(error);
        toast.error('Failed to fetch books.');
      })
      .finally(() => {
        setIsTableLoading(false);
      });
  };

  const addBook = () => {
    axios.post(apiUrl(routes.BOOK, methods.POST), book)
      .then(() => {
        toast.success('Book added');
        handleCloseModal();
        getAllBooks();
        clearForm();
      })
      .catch((error) => {
        console.error(error);
        toast.error('Something went wrong, please try again');
      });
  };

  const updateBook = () => {
    axios.put(apiUrl(routes.BOOK, methods.PUT, selectedBookId), book)
      .then(() => {
        toast.success('Book updated');
        handleCloseModal();
        handleCloseMenu();
        getAllBooks();
        clearForm();
      })
      .catch((error) => {
        console.error(error);
        toast.error('Something went wrong, please try again');
      });
  };

  const deleteBook = (bookId) => {
    axios.delete(apiUrl(routes.BOOK, methods.DELETE, bookId))
      .then(() => {
        toast.success('Book deleted');
        handleCloseDialog();
        handleCloseMenu();
        getAllBooks();
      })
      .catch((error) => {
        console.error(error);
        toast.error('Something went wrong, please try again');
      });
  };

  // --- REVIEW API OPERATIONS ---

  const getReviewsForBook = (bookId) => {
    setIsReviewsLoading(true);
    // This route needs to be implemented in your backend
    axios.get(apiUrl(routes.REVIEW, methods.GET_ALL_BY_PARENT, bookId))
      .then((response) => {
        setReviews(response.data.reviewList || []);
      })
      .catch((error) => {
        console.error("Failed to fetch reviews:", error);
        setReviews([]); // Reset on error
      })
      .finally(() => {
        setIsReviewsLoading(false);
      });
  };

const submitReview = (reviewData) => {
    setIsSubmittingReview(true);
    // This route needs to handle linking the review to the logged-in user
    axios.post(apiUrl(routes.REVIEW, methods.POST), { ...reviewData, memberId: user._id })
      .then(() => {
        toast.success('Review submitted!');
        // Corrected from reviewData.bookID to reviewData.bookId
        getReviewsForBook(reviewData.bookId); 
      })
      .catch((error) => {
        console.error("Failed to submit review:", error);
        toast.error('Failed to submit review. Please try again.');
      })
      .finally(() => {
        setIsSubmittingReview(false);
      });
  };


  // --- HANDLER FUNCTIONS ---

  useEffect(() => {
    getAllBooks();
  }, []);
  
  const getSelectedBookDetails = () => {
    const selected = books.find((element) => element._id === selectedBookId);
    setBook(selected);
  };

  const clearForm = () => {
    setBook({ id: '', name: '', isbn: '', summary: '', isAvailable: true, authorId: '', genreId: '', photoUrl: '' });
  };

  const handleOpenMenu = (event) => {
    setIsMenuOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(null);
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handlers for the new details dialog
  const handleOpenDetails = (bookToShow) => {
    setSelectedBookForDetails(bookToShow);
    setDetailsOpen(true);
    getReviewsForBook(bookToShow._id);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedBookForDetails(null);
    setReviews([]); // Clear reviews on close
  };

  return (
    <>
      <Helmet>
        <title> Books </title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h3" sx={{ mb: 5 }}>
            Books
          </Typography>
          {user.isAdmin && (
            <Button
              variant="contained"
              onClick={() => {
                setIsUpdateForm(false);
                handleOpenModal();
              }}
              startIcon={<Iconify icon="eva:plus-fill" />}
            >
              New Book
            </Button>
          )}
        </Stack>

        {isTableLoading ? (
          <Grid padding={2} style={{ textAlign: 'center' }}><CircularProgress /></Grid>
        ) : books.length > 0 ? (
          <Grid container spacing={4}>
            {books.map((bookItem) => (
              <Grid key={bookItem._id} item xs={12} sm={6} md={4}>
                <Card>
                  <Box sx={{ pt: '80%', position: 'relative' }}>
                    <Label
                      variant="filled"
                      sx={{
                        zIndex: 9, top: 16, left: 16, position: 'absolute', textTransform: 'uppercase', color: 'primary.main',
                      }}
                    >
                      {bookItem.genre.name}
                    </Label>
                    {user.isAdmin && (
                      <Label
                        variant="filled"
                        sx={{
                          zIndex: 9, top: 12, right: 16, position: 'absolute', borderRadius: '100%', width: '30px', height: '30px', color: 'white', backgroundColor: 'white',
                        }}
                      >
                        <IconButton size="small" color="primary" onClick={(e) => {
                          setSelectedBookId(bookItem._id);
                          handleOpenMenu(e);
                        }}>
                          <Iconify icon={'eva:more-vertical-fill'} />
                        </IconButton>
                      </Label>
                    )}
                    <StyledBookImage alt={bookItem.name} src={bookItem.photoUrl} />
                  </Box>

                  <Stack spacing={1} sx={{ p: 2 }}>
                    <Typography textAlign="center" variant="h5" margin={0} noWrap>{bookItem.name}</Typography>
                    <Typography variant="subtitle1" sx={{ color: '#888888' }} paddingBottom={1} noWrap textAlign="center">
                      {bookItem.author.name}
                    </Typography>
                    <Button variant="outlined" onClick={() => handleOpenDetails(bookItem)}>
                      View Details & Reviews
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="warning" color="warning">
            No books found
          </Alert>
        )}
      </Container>

      {/* ADMIN Popover Menu */}
      <Popover
        open={Boolean(isMenuOpen)}
        anchorEl={isMenuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { p: 1, width: 140, '& .MuiMenuItem-root': { px: 1, typography: 'body2', borderRadius: 0.75 } } }}
      >
        <MenuItem onClick={() => {
          setIsUpdateForm(true);
          getSelectedBookDetails();
          handleCloseMenu();
          handleOpenModal();
        }}>
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
          Edit
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={handleOpenDialog}>
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>

      {/* Book Details and Reviews Dialog */}
      {selectedBookForDetails && (
          <Dialog open={detailsOpen} onClose={handleCloseDetails} fullWidth maxWidth="md">
            <DialogTitle>{selectedBookForDetails.name}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="h6">{selectedBookForDetails.author.name}</Typography>
              <Label color={selectedBookForDetails.isAvailable ? 'success' : 'error'} sx={{ my: 1 }}>
                {selectedBookForDetails.isAvailable ? 'Available' : 'Not available'}
              </Label>
              <Typography variant="body1" sx={{ mt: 2 }}>{selectedBookForDetails.summary}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>ISBN: {selectedBookForDetails.isbn}</Typography>

              <Box mt={3}>
                <Typography variant="h5">Reviews</Typography>
                <ReviewList reviews={reviews} isLoading={isReviewsLoading} />
                {!user.isAdmin && (
                  <ReviewForm bookId={selectedBookForDetails._id} onSubmit={submitReview} isSubmitting={isSubmittingReview} />
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
            </DialogActions>
          </Dialog>
      )}

      {/* Existing Admin Modals */}
      <BookForm
        isUpdateForm={isUpdateForm}
        isModalOpen={isModalOpen}
        handleCloseModal={handleCloseModal}
        id={selectedBookId}
        book={book}
        setBook={setBook}
        handleAddBook={addBook}
        handleUpdateBook={updateBook}
      />
      <BookDialog
        isDialogOpen={isDialogOpen}
        bookId={selectedBookId}
        handleDeleteBook={deleteBook}
        handleCloseDialog={handleCloseDialog}
      />
    </>
  );
};

export default BookPage;