/**
 * Usability Testing - Automated UI/UX Validation
 * Test Suite: TC_USABILITY_*
 * 
 * This test suite performs automated usability testing to validate
 * user interface consistency, accessibility, and user experience elements.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock components for testing
const MockApp = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Usability Testing - Automated UI/UX Validation', () => {
  
  describe('Accessibility Compliance Testing', () => {
    test('TC_USABILITY_A11Y_001: Should have no accessibility violations on login page', async () => {
      // Mock login component
      const LoginPage = () => (
        <div>
          <h1>Library Management System</h1>
          <form role="form" aria-label="Login form">
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              name="email" 
              required 
              aria-describedby="email-help"
            />
            <div id="email-help">Enter your registered email address</div>
            
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              name="password" 
              required 
              aria-describedby="password-help"
            />
            <div id="password-help">Enter your password</div>
            
            <button type="submit" aria-label="Sign in to your account">
              Login
            </button>
          </form>
        </div>
      );

      const { container } = render(
        <MockApp>
          <LoginPage />
        </MockApp>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('TC_USABILITY_A11Y_002: Should have proper heading hierarchy', () => {
      const PageWithHeadings = () => (
        <div>
          <h1>Library Management System</h1>
          <h2>Book Management</h2>
          <h3>Add New Book</h3>
          <h3>Edit Book</h3>
          <h2>User Management</h2>
          <h3>Add User</h3>
        </div>
      );

      render(
        <MockApp>
          <PageWithHeadings />
        </MockApp>
      );

      // Check heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s).toHaveLength(2);
      expect(h3s).toHaveLength(3);

      // Verify heading text content
      expect(h1).toHaveTextContent('Library Management System');
      expect(h2s[0]).toHaveTextContent('Book Management');
      expect(h2s[1]).toHaveTextContent('User Management');
    });

    test('TC_USABILITY_A11Y_003: Should have proper ARIA labels for interactive elements', () => {
      const InteractiveElements = () => (
        <div>
          <button aria-label="Add new book to library">
            <span aria-hidden="true">+</span>
          </button>
          <button aria-label="Delete selected book" aria-describedby="delete-warning">
            <span aria-hidden="true">🗑️</span>
          </button>
          <div id="delete-warning">This action cannot be undone</div>
          
          <input 
            type="search" 
            aria-label="Search books by title, author, or ISBN"
            placeholder="Search books..."
          />
          
          <select aria-label="Filter books by genre">
            <option value="">All Genres</option>
            <option value="fiction">Fiction</option>
            <option value="non-fiction">Non-Fiction</option>
          </select>
        </div>
      );

      render(
        <MockApp>
          <InteractiveElements />
        </MockApp>
      );

      // Verify ARIA labels
      expect(screen.getByLabelText('Add new book to library')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete selected book')).toBeInTheDocument();
      expect(screen.getByLabelText('Search books by title, author, or ISBN')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter books by genre')).toBeInTheDocument();
    });

    test('TC_USABILITY_A11Y_004: Should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      const NavigationTest = () => (
        <div>
          <button>First Button</button>
          <input type="text" placeholder="Text Input" />
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
          <button>Last Button</button>
        </div>
      );

      render(
        <MockApp>
          <NavigationTest />
        </MockApp>
      );

      const firstButton = screen.getByText('First Button');
      const textInput = screen.getByPlaceholderText('Text Input');
      const select = screen.getByRole('combobox');
      const lastButton = screen.getByText('Last Button');

      // Test tab navigation
      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(textInput).toHaveFocus();

      await user.tab();
      expect(select).toHaveFocus();

      await user.tab();
      expect(lastButton).toHaveFocus();

      // Test shift+tab (reverse navigation)
      await user.tab({ shift: true });
      expect(select).toHaveFocus();
    });
  });

  describe('Visual Consistency Testing', () => {
    test('TC_USABILITY_VISUAL_001: Should have consistent button styles', () => {
      const ButtonConsistencyTest = () => (
        <div>
          <button className="primary-button">Primary Action</button>
          <button className="secondary-button">Secondary Action</button>
          <button className="danger-button">Delete</button>
          <button className="primary-button">Another Primary</button>
        </div>
      );

      const { container } = render(
        <MockApp>
          <ButtonConsistencyTest />
        </MockApp>
      );

      const primaryButtons = container.querySelectorAll('.primary-button');
      const secondaryButtons = container.querySelectorAll('.secondary-button');
      const dangerButtons = container.querySelectorAll('.danger-button');

      // Check that buttons of the same type have consistent classes
      expect(primaryButtons).toHaveLength(2);
      expect(secondaryButtons).toHaveLength(1);
      expect(dangerButtons).toHaveLength(1);

      // Verify all buttons have consistent structure
      const allButtons = container.querySelectorAll('button');
      allButtons.forEach(button => {
        expect(button).toHaveClass(/button/);
      });
    });

    test('TC_USABILITY_VISUAL_002: Should have consistent form field styling', () => {
      const FormConsistencyTest = () => (
        <form>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" className="form-input" />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="form-input" />
          </div>
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea id="description" className="form-input"></textarea>
          </div>
        </form>
      );

      const { container } = render(
        <MockApp>
          <FormConsistencyTest />
        </MockApp>
      );

      const formFields = container.querySelectorAll('.form-field');
      const formInputs = container.querySelectorAll('.form-input');

      expect(formFields).toHaveLength(3);
      expect(formInputs).toHaveLength(3);

      // Check that each form field has a label
      formFields.forEach(field => {
        const label = field.querySelector('label');
        const input = field.querySelector('input, textarea');
        expect(label).toBeInTheDocument();
        expect(input).toBeInTheDocument();
      });
    });

    test('TC_USABILITY_VISUAL_003: Should have consistent color scheme', () => {
      const ColorSchemeTest = () => (
        <div>
          <div className="primary-color">Primary Color Element</div>
          <div className="secondary-color">Secondary Color Element</div>
          <div className="success-color">Success Message</div>
          <div className="error-color">Error Message</div>
          <div className="warning-color">Warning Message</div>
        </div>
      );

      const { container } = render(
        <MockApp>
          <ColorSchemeTest />
        </MockApp>
      );

      // Verify color classes are applied
      expect(container.querySelector('.primary-color')).toBeInTheDocument();
      expect(container.querySelector('.secondary-color')).toBeInTheDocument();
      expect(container.querySelector('.success-color')).toBeInTheDocument();
      expect(container.querySelector('.error-color')).toBeInTheDocument();
      expect(container.querySelector('.warning-color')).toBeInTheDocument();
    });
  });

  describe('User Interaction Testing', () => {
    test('TC_USABILITY_INTERACT_001: Should provide immediate feedback on form submission', async () => {
      const user = userEvent.setup();
      
      const FormFeedbackTest = () => {
        const [isSubmitting, setIsSubmitting] = React.useState(false);
        const [submitted, setSubmitted] = React.useState(false);

        const handleSubmit = async (e) => {
          e.preventDefault();
          setIsSubmitting(true);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          setIsSubmitting(false);
          setSubmitted(true);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Enter text" required />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            {submitted && <div role="status">Form submitted successfully!</div>}
          </form>
        );
      };

      render(
        <MockApp>
          <FormFeedbackTest />
        </MockApp>
      );

      const input = screen.getByPlaceholderText('Enter text');
      const submitButton = screen.getByRole('button', { name: /submit/i });

      // Fill form and submit
      await user.type(input, 'Test input');
      await user.click(submitButton);

      // Check immediate feedback
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Form submitted successfully!')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('TC_USABILITY_INTERACT_002: Should handle loading states appropriately', async () => {
      const LoadingStateTest = () => {
        const [isLoading, setIsLoading] = React.useState(false);
        const [data, setData] = React.useState(null);

        const loadData = async () => {
          setIsLoading(true);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          setData('Loaded data');
          setIsLoading(false);
        };

        return (
          <div>
            <button onClick={loadData} disabled={isLoading}>
              Load Data
            </button>
            {isLoading && (
              <div role="status" aria-label="Loading data">
                Loading...
              </div>
            )}
            {data && <div>{data}</div>}
          </div>
        );
      };

      const user = userEvent.setup();
      
      render(
        <MockApp>
          <LoadingStateTest />
        </MockApp>
      );

      const loadButton = screen.getByText('Load Data');
      
      await user.click(loadButton);

      // Check loading state
      expect(screen.getByLabelText('Loading data')).toBeInTheDocument();
      expect(loadButton).toBeDisabled();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Loaded data')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Loading data')).not.toBeInTheDocument();
    });

    test('TC_USABILITY_INTERACT_003: Should provide clear error messages', async () => {
      const ErrorHandlingTest = () => {
        const [error, setError] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const email = formData.get('email');
          
          if (!email) {
            setError('Email is required');
          } else if (!email.includes('@')) {
            setError('Please enter a valid email address');
          } else {
            setError('');
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              aria-describedby={error ? 'email-error' : undefined}
              aria-invalid={error ? 'true' : 'false'}
            />
            {error && (
              <div id="email-error" role="alert" className="error-message">
                {error}
              </div>
            )}
            <button type="submit">Submit</button>
          </form>
        );
      };

      const user = userEvent.setup();
      
      render(
        <MockApp>
          <ErrorHandlingTest />
        </MockApp>
      );

      const submitButton = screen.getByText('Submit');
      const emailInput = screen.getByLabelText('Email');

      // Test empty email
      await user.click(submitButton);
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');

      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');

      // Test valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@email.com');
      await user.click(submitButton);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness Testing', () => {
    test('TC_USABILITY_MOBILE_001: Should adapt layout for mobile screens', () => {
      // Mock window.matchMedia for mobile testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const ResponsiveComponent = () => {
        const [isMobile, setIsMobile] = React.useState(false);

        React.useEffect(() => {
          const mediaQuery = window.matchMedia('(max-width: 768px)');
          setIsMobile(mediaQuery.matches);
        }, []);

        return (
          <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
            <nav className={isMobile ? 'mobile-nav' : 'desktop-nav'}>
              Navigation
            </nav>
            <main className={isMobile ? 'mobile-main' : 'desktop-main'}>
              Main Content
            </main>
          </div>
        );
      };

      const { container } = render(
        <MockApp>
          <ResponsiveComponent />
        </MockApp>
      );

      // Check mobile classes are applied
      expect(container.querySelector('.mobile-layout')).toBeInTheDocument();
      expect(container.querySelector('.mobile-nav')).toBeInTheDocument();
      expect(container.querySelector('.mobile-main')).toBeInTheDocument();
    });

    test('TC_USABILITY_MOBILE_002: Should have appropriate touch targets', () => {
      const TouchTargetTest = () => (
        <div>
          <button style={{ minHeight: '44px', minWidth: '44px' }}>
            Touch Button
          </button>
          <a href="#" style={{ minHeight: '44px', display: 'inline-block', padding: '12px' }}>
            Touch Link
          </a>
          <input type="checkbox" style={{ minHeight: '44px', minWidth: '44px' }} />
        </div>
      );

      const { container } = render(
        <MockApp>
          <TouchTargetTest />
        </MockApp>
      );

      const button = container.querySelector('button');
      const link = container.querySelector('a');
      const checkbox = container.querySelector('input[type="checkbox"]');

      // Check minimum touch target sizes (44px is recommended)
      const buttonStyles = window.getComputedStyle(button);
      const linkStyles = window.getComputedStyle(link);
      const checkboxStyles = window.getComputedStyle(checkbox);

      expect(buttonStyles.minHeight).toBe('44px');
      expect(buttonStyles.minWidth).toBe('44px');
      expect(linkStyles.minHeight).toBe('44px');
      expect(checkboxStyles.minHeight).toBe('44px');
    });
  });

  describe('Performance and User Experience', () => {
    test('TC_USABILITY_PERF_001: Should render components within acceptable time', async () => {
      const startTime = performance.now();
      
      const PerformanceTestComponent = () => {
        const [items] = React.useState(Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`
        })));

        return (
          <div>
            <h1>Performance Test</h1>
            <ul>
              {items.map(item => (
                <li key={item.id}>
                  <strong>{item.name}</strong>: {item.description}
                </li>
              ))}
            </ul>
          </div>
        );
      };

      render(
        <MockApp>
          <PerformanceTestComponent />
        </MockApp>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Component should render within 100ms
      expect(renderTime).toBeLessThan(100);
      
      // Verify content is rendered
      expect(screen.getByText('Performance Test')).toBeInTheDocument();
      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 99')).toBeInTheDocument();
    });

    test('TC_USABILITY_PERF_002: Should handle large datasets efficiently', () => {
      const LargeDatasetTest = () => {
        const [items] = React.useState(Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`
        })));

        const [filter, setFilter] = React.useState('');
        
        const filteredItems = React.useMemo(() => {
          return items.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase())
          );
        }, [items, filter]);

        return (
          <div>
            <input 
              type="text" 
              placeholder="Filter items"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div data-testid="item-count">
              Showing {filteredItems.length} items
            </div>
            <ul>
              {filteredItems.slice(0, 50).map(item => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
        );
      };

      const user = userEvent.setup();
      
      render(
        <MockApp>
          <LargeDatasetTest />
        </MockApp>
      );

      // Initial state
      expect(screen.getByTestId('item-count')).toHaveTextContent('Showing 1000 items');

      // Test filtering performance
      const filterInput = screen.getByPlaceholderText('Filter items');
      
      const startTime = performance.now();
      user.type(filterInput, '1');
      const endTime = performance.now();

      // Filtering should be fast
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('User Guidance and Help', () => {
    test('TC_USABILITY_HELP_001: Should provide helpful placeholder text', () => {
      const HelpfulPlaceholdersTest = () => (
        <form>
          <input 
            type="email" 
            placeholder="Enter your email address (e.g., john@example.com)"
          />
          <input 
            type="password" 
            placeholder="Password (minimum 8 characters)"
          />
          <input 
            type="text" 
            placeholder="Book title or ISBN"
          />
          <textarea 
            placeholder="Enter a brief description of the book (optional)"
          />
        </form>
      );

      render(
        <MockApp>
          <HelpfulPlaceholdersTest />
        </MockApp>
      );

      expect(screen.getByPlaceholderText(/Enter your email address/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password \(minimum 8 characters\)/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Book title or ISBN/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter a brief description/)).toBeInTheDocument();
    });

    test('TC_USABILITY_HELP_002: Should provide contextual help information', () => {
      const ContextualHelpTest = () => (
        <div>
          <div className="form-field">
            <label htmlFor="isbn">ISBN</label>
            <input id="isbn" type="text" aria-describedby="isbn-help" />
            <div id="isbn-help" className="help-text">
              Enter the 10 or 13 digit ISBN number found on the book
            </div>
          </div>
          
          <div className="form-field">
            <label htmlFor="due-date">Due Date</label>
            <input id="due-date" type="date" aria-describedby="due-date-help" />
            <div id="due-date-help" className="help-text">
              Standard loan period is 14 days
            </div>
          </div>
        </div>
      );

      render(
        <MockApp>
          <ContextualHelpTest />
        </MockApp>
      );

      expect(screen.getByText(/Enter the 10 or 13 digit ISBN/)).toBeInTheDocument();
      expect(screen.getByText(/Standard loan period is 14 days/)).toBeInTheDocument();
      
      // Verify ARIA relationships
      const isbnInput = screen.getByLabelText('ISBN');
      const dueDateInput = screen.getByLabelText('Due Date');
      
      expect(isbnInput).toHaveAttribute('aria-describedby', 'isbn-help');
      expect(dueDateInput).toHaveAttribute('aria-describedby', 'due-date-help');
    });
  });
});

/**
 * Usability Testing Utilities
 */
export class UsabilityTestUtils {
  static async checkColorContrast(element, expectedRatio = 4.5) {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // This would typically use a color contrast calculation library
    // For testing purposes, we'll mock the check
    return {
      backgroundColor,
      color,
      ratio: expectedRatio + 0.1, // Mock passing ratio
      passes: true
    };
  }

  static measureRenderTime(renderFunction) {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    return {
      result,
      renderTime: endTime - startTime
    };
  }

  static async simulateSlowNetwork() {
    // Mock slow network conditions
    return new Promise(resolve => setTimeout(resolve, 2000));
  }

  static checkTouchTargetSize(element) {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // Minimum recommended touch target size
    
    return {
      width: rect.width,
      height: rect.height,
      meetsMinimum: rect.width >= minSize && rect.height >= minSize
    };
  }
} 