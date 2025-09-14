describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should redirect to login page when not authenticated', () => {
    cy.url().should('include', '/login')
  })

  it('should login with valid credentials', () => {
    cy.visit('/login')
    
    cy.get('input[name="email"]').type('student@elearning.com')
    cy.get('input[name="password"]').type('student123')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('not.include', '/login')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.visit('/login')
    
    cy.get('input[name="email"]').type('invalid@example.com')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.url().should('include', '/login')
  })

  it('should register a new user', () => {
    cy.visit('/signup')
    
    cy.get('input[name="firstName"]').type('John')
    cy.get('input[name="lastName"]').type('Doe')
    cy.get('input[name="email"]').type('john.doe@example.com')
    cy.get('select[name="role"]').select('STUDENT')
    cy.get('input[name="password"]').type('password123')
    cy.get('input[name="confirmPassword"]').type('password123')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('not.include', '/signup')
  })

  it('should logout successfully', () => {
    cy.login()
    
    cy.get('[data-testid="profile-dropdown"]').click()
    cy.get('[data-testid="logout-button"]').click()
    
    cy.url().should('include', '/login')
  })

  it('should validate form fields', () => {
    cy.visit('/login')
    
    cy.get('button[type="submit"]').click()
    
    cy.get('input[name="email"]:invalid').should('exist')
    cy.get('input[name="password"]:invalid').should('exist')
  })
})