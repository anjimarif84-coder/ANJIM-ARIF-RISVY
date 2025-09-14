describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should navigate to login page', () => {
    cy.get('a[href="/login"]').click()
    cy.url().should('include', '/login')
    cy.contains('Sign in to your account').should('be.visible')
  })

  it('should navigate to signup page', () => {
    cy.get('a[href="/signup"]').click()
    cy.url().should('include', '/signup')
    cy.contains('Create your account').should('be.visible')
  })

  it('should show validation errors for empty login form', () => {
    cy.visit('/login')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Email is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
  })

  it('should show validation error for invalid email', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type('invalid-email')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Invalid email address').should('be.visible')
  })

  it('should show validation errors for empty signup form', () => {
    cy.visit('/signup')
    cy.get('button[type="submit"]').click()
    
    cy.contains('First name is required').should('be.visible')
    cy.contains('Last name is required').should('be.visible')
    cy.contains('Email is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
  })

  it('should show validation error for password mismatch', () => {
    cy.visit('/signup')
    cy.get('input[name="firstName"]').type('John')
    cy.get('input[name="lastName"]').type('Doe')
    cy.get('input[name="email"]').type('john@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('input[name="confirmPassword"]').type('different123')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Passwords do not match').should('be.visible')
  })

  it('should register a new user', () => {
    cy.visit('/signup')
    
    cy.get('input[name="firstName"]').type('John')
    cy.get('input[name="lastName"]').type('Doe')
    cy.get('input[name="email"]').type('john@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('input[name="confirmPassword"]').type('password123')
    cy.get('input[name="agree-terms"]').check()
    cy.get('button[type="submit"]').click()
    
    // Should redirect to dashboard after successful registration
    cy.url().should('include', '/dashboard')
  })

  it('should login with valid credentials', () => {
    // First create a user
    cy.createUser({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    })

    cy.visit('/login')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    
    // Should redirect to dashboard after successful login
    cy.url().should('include', '/dashboard')
  })

  it('should show error for invalid login credentials', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type('nonexistent@example.com')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    // Should show error message
    cy.contains('Invalid credentials').should('be.visible')
  })

  it('should logout user', () => {
    cy.login()
    cy.visit('/dashboard')
    
    // Click on user menu
    cy.get('[data-testid="user-menu"]').click()
    cy.get('button').contains('Sign out').click()
    
    // Should redirect to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })
})