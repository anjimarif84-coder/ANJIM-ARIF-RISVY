describe('Authentication', () => {
  beforeEach(() => {
    cy.cleanupTestData()
  })

  describe('User Registration', () => {
    it('should register a new student successfully', () => {
      const timestamp = Date.now()
      const email = `student-${timestamp}@example.com`
      
      cy.visit('/signup')
      
      // Fill registration form
      cy.get('[data-cy=first-name-input]').type('John')
      cy.get('[data-cy=last-name-input]').type('Doe')
      cy.get('[data-cy=email-input]').type(email)
      cy.get('[data-cy=role-select]').select('STUDENT')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=confirm-password-input]').type('password123')
      cy.get('[data-cy=terms-checkbox]').check()
      
      // Submit form
      cy.get('[data-cy=register-button]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.contains('Welcome back, John!').should('be.visible')
    })

    it('should register a new teacher successfully', () => {
      const timestamp = Date.now()
      const email = `teacher-${timestamp}@example.com`
      
      cy.visit('/signup')
      
      cy.get('[data-cy=first-name-input]').type('Jane')
      cy.get('[data-cy=last-name-input]').type('Smith')
      cy.get('[data-cy=email-input]').type(email)
      cy.get('[data-cy=role-select]').select('TEACHER')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=confirm-password-input]').type('password123')
      cy.get('[data-cy=terms-checkbox]').check()
      
      cy.get('[data-cy=register-button]').click()
      
      cy.url().should('include', '/dashboard')
      cy.contains('Welcome back, Jane!').should('be.visible')
    })

    it('should show validation errors for invalid input', () => {
      cy.visit('/signup')
      
      // Try to submit empty form
      cy.get('[data-cy=register-button]').click()
      
      // Should show validation errors
      cy.contains('First name must be at least 2 characters').should('be.visible')
      cy.contains('Last name must be at least 2 characters').should('be.visible')
      cy.contains('Invalid email address').should('be.visible')
      cy.contains('Password must be at least 8 characters').should('be.visible')
    })

    it('should show error for mismatched passwords', () => {
      cy.visit('/signup')
      
      cy.get('[data-cy=first-name-input]').type('John')
      cy.get('[data-cy=last-name-input]').type('Doe')
      cy.get('[data-cy=email-input]').type('john@example.com')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=confirm-password-input]').type('differentpassword')
      cy.get('[data-cy=terms-checkbox]').check()
      
      cy.get('[data-cy=register-button]').click()
      
      cy.contains("Passwords don't match").should('be.visible')
    })

    it('should show error for duplicate email', () => {
      const email = 'duplicate@example.com'
      
      // Register first user
      cy.register('John', 'Doe', email, 'password123')
      cy.logout()
      
      // Try to register with same email
      cy.visit('/signup')
      cy.get('[data-cy=first-name-input]').type('Jane')
      cy.get('[data-cy=last-name-input]').type('Smith')
      cy.get('[data-cy=email-input]').type(email)
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=confirm-password-input]').type('password123')
      cy.get('[data-cy=terms-checkbox]').check()
      
      cy.get('[data-cy=register-button]').click()
      
      cy.contains('User already exists').should('be.visible')
    })
  })

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user
      cy.createUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123'
      })
    })

    it('should login successfully with correct credentials', () => {
      cy.visit('/login')
      
      cy.get('[data-cy=email-input]').type('testuser@example.com')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=login-button]').click()
      
      cy.url().should('include', '/dashboard')
      cy.get('[data-cy=user-menu]').should('be.visible')
    })

    it('should show error for incorrect credentials', () => {
      cy.visit('/login')
      
      cy.get('[data-cy=email-input]').type('testuser@example.com')
      cy.get('[data-cy=password-input]').type('wrongpassword')
      cy.get('[data-cy=login-button]').click()
      
      cy.contains('Invalid credentials').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('/login')
      
      cy.get('[data-cy=login-button]').click()
      
      cy.contains('Invalid email address').should('be.visible')
      cy.contains('Password is required').should('be.visible')
    })

    it('should redirect to intended page after login', () => {
      // Try to access protected route
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      
      // Login
      cy.get('[data-cy=email-input]').type('testuser@example.com')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=login-button]').click()
      
      // Should redirect back to dashboard
      cy.url().should('include', '/dashboard')
    })
  })

  describe('User Logout', () => {
    beforeEach(() => {
      cy.createUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123'
      }).then(() => {
        cy.login('testuser@example.com', 'password123')
      })
    })

    it('should logout successfully', () => {
      cy.get('[data-cy=user-menu]').click()
      cy.get('[data-cy=logout-button]').click()
      
      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      
      // Should show login link
      cy.get('[data-cy=login-link]').should('be.visible')
      
      // Should not be able to access protected routes
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login for unauthenticated users', () => {
      const protectedRoutes = ['/dashboard', '/profile']
      
      protectedRoutes.forEach(route => {
        cy.visit(route)
        cy.url().should('include', '/login')
      })
    })

    it('should allow access to protected routes for authenticated users', () => {
      cy.createUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123'
      }).then(() => {
        cy.login('testuser@example.com', 'password123')
        
        cy.visit('/dashboard')
        cy.url().should('include', '/dashboard')
        
        cy.visit('/profile')
        cy.url().should('include', '/profile')
      })
    })
  })
})