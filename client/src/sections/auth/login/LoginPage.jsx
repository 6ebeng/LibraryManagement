import { Helmet } from 'react-helmet-async';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Container, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

import Logo from '../../../components/logo';
import { apiUrl, routes, methods } from '../../../constants';
import { LoginForm } from './index';


// ----------------------------------------------------------------------

const StyledRoot = styled('div')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

const StyledContent = styled('div')(({ theme }) => ({
  maxWidth: 480,
  margin: 'auto',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(12, 0),
}));

// ----------------------------------------------------------------------

export default function LoginPage() {
  const { login, user } = useAuth();

  if (user) {
    if (user.isAdmin) {
      return <Navigate to={'/dashboard'} replace />;
    }
    return <Navigate to={'/books'} replace />;
  }

  const loginUser = (email, password) => {
    // Client-side validation with specific messages
    if (!email || email.trim() === '') {
      toast.error('Please enter your email address');
      return;
    }
    
    if (!password || password.trim() === '') {
      toast.error('Please enter your password');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Logging in...');

    axios
      .post(apiUrl(routes.AUTH, methods.LOGIN), { email, password }, { withCredentials: false })
      .then((response) => {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // handle success
        if (response.status === 200) {
          console.log(response.data);
          const successMessage = response.data.message || `Successfully logged in as ${response.data.user.name}`;
          toast.success(successMessage);
          login(response.data.user);
        }
      })
      .catch((error) => {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // Handle different error scenarios with specific messages
        if (error.response) {
          // Server responded with an error
          const errorMessage = error.response.data?.message;
          
          switch (error.response.status) {
            case 400:
              // Bad request - validation errors
              toast.error(errorMessage || 'Please check your input and try again');
              break;
            case 401:
              // Unauthorized - wrong password
              toast.error(errorMessage || 'Invalid credentials. Please check your password');
              break;
            case 404:
              // Not found - user doesn't exist
              toast.error(errorMessage || 'No account found with this email address');
              break;
            case 500:
              // Server error
              toast.error('Server error. Please try again later or contact support');
              break;
            default:
              // Other errors
              toast.error(errorMessage || 'An unexpected error occurred. Please try again');
          }
        } else if (error.request) {
          // Request was made but no response received
          toast.error('Cannot connect to server. Please check your internet connection');
        } else {
          // Something else went wrong
          toast.error('An unexpected error occurred. Please try again');
        }
        
        console.error('Login error:', error);
      });
  };

  return (
    <>
      <Helmet>
        <title> Login | Library Management System</title>
      </Helmet>

      <StyledRoot>
        <Logo
          sx={{
            position: 'fixed',
            top: { xs: 16, sm: 24, md: 40 },
            left: { xs: 16, sm: 24, md: 40 },
          }}
        />

        <Container maxWidth="sm">
          <StyledContent>
            <Typography
              variant="h4"
              sx={{ color: '#666666', fontWeight: '600' }}
              textAlign="center"
              gutterBottom
              paddingBottom={0}
            >
              Library Management System
            </Typography>
            <Typography variant="h3" textAlign="center" gutterBottom paddingBottom={3}>
              Sign in to your account
            </Typography>

            <LoginForm loginUser={loginUser} />
          </StyledContent>
        </Container>
      </StyledRoot>
    </>
  );
}
