import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Card,
  Container,
  Stack,
  Typography,
  Table,
  TableContainer,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Popover,
  MenuItem,
  Rating,
} from '@mui/material';

import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import { apiUrl, methods, routes } from '../../../constants';
import { fDate } from '../../../utils/formatTime';

export default function ReviewPage() {
  const [reviews, setReviews] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  const handleOpenMenu = (event, reviewId) => {
    setOpen(event.currentTarget);
    setSelectedReviewId(reviewId);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleDeleteReview = () => {
    axios
      .delete(apiUrl(routes.REVIEW, methods.DELETE, selectedReviewId))
      .then(() => {
        toast.success('Review deleted successfully');
        handleCloseMenu();
        getAllReviews();
      })
      .catch((error) => {
        toast.error('Error deleting review');
        console.log(error);
      });
  };

  const getAllReviews = () => {
    axios
      .get(apiUrl(routes.REVIEW, methods.GET_ALL))
      .then((response) => {
        setReviews(response.data.reviewsList);
        setIsTableLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setIsTableLoading(false);
      });
  };

  useEffect(() => {
    getAllReviews();
  }, []);

  return (
    <>
      <Helmet>
        <title>Review Management | Library</title>
      </Helmet>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Review Management
          </Typography>
        </Stack>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <TableBody>
                  {reviews.map((row) => {
                    const { _id, bookId, memberId, rating, comment, createdAt } = row;

                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        <TableCell component="th" scope="row" padding="none" sx={{ pl: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="subtitle2" noWrap>
                                    {bookId.name}
                                </Typography>
                            </Stack>
                        </TableCell>
                        <TableCell align="left">{memberId.name}</TableCell>
                        <TableCell align="left">
                          <Rating value={rating} readOnly />
                        </TableCell>
                        <TableCell align="left">{comment}</TableCell>
                        <TableCell align="left">{fDate(createdAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="large" color="inherit" onClick={(e) => handleOpenMenu(e, _id)}>
                            <Iconify icon={'eva:more-vertical-fill'} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
        </Card>
      </Container>
      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 1,
            width: 140,
            '& .MuiMenuItem-root': {
              px: 1,
              typography: 'body2',
              borderRadius: 0.75,
            },
          },
        }}
      >
        <MenuItem sx={{ color: 'error.main' }} onClick={handleDeleteReview}>
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}