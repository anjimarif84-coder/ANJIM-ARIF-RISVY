describe('Courses Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display courses page', () => {
    cy.get('a[href="/courses"]').click()
    cy.url().should('include', '/courses')
    cy.contains('Browse Courses').should('be.visible')
  })

  it('should search for courses', () => {
    cy.visit('/courses')
    
    // Type in search box
    cy.get('input[placeholder="Search courses..."]').type('React')
    cy.get('form').submit()
    
    // Should show search results
    cy.get('[data-testid="course-card"]').should('exist')
  })

  it('should navigate to course detail page', () => {
    cy.visit('/courses')
    
    // Click on first course card
    cy.get('[data-testid="course-card"]').first().click()
    
    // Should be on course detail page
    cy.url().should('match', /\/courses\/[a-zA-Z0-9-]+/)
    cy.contains('About this course').should('be.visible')
  })

  it('should show course enrollment for authenticated user', () => {
    cy.login()
    cy.visit('/courses')
    
    // Click on first course
    cy.get('[data-testid="course-card"]').first().click()
    
    // Should show enroll button
    cy.get('button').contains('Enroll Now').should('be.visible')
  })

  it('should redirect to login for unauthenticated user trying to enroll', () => {
    cy.visit('/courses')
    
    // Click on first course
    cy.get('[data-testid="course-card"]').first().click()
    
    // Click enroll button
    cy.get('button').contains('Enroll Now').click()
    
    // Should redirect to login
    cy.url().should('include', '/login')
  })

  it('should create a new course as teacher', () => {
    cy.login('teacher@example.com', 'password123')
    cy.visit('/dashboard')
    
    // Click create course button (if available)
    cy.get('button').contains('Create Course').click()
    
    // Fill course form
    cy.get('input[name="title"]').type('New Test Course')
    cy.get('textarea[name="description"]').type('This is a test course description')
    cy.get('input[name="price"]').type('99.99')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should show success message or redirect
    cy.contains('Course created successfully').should('be.visible')
  })

  it('should not allow students to create courses', () => {
    cy.login('student@example.com', 'password123')
    cy.visit('/dashboard')
    
    // Should not see create course button
    cy.get('button').contains('Create Course').should('not.exist')
  })

  it('should display course progress for enrolled students', () => {
    cy.login('student@example.com', 'password123')
    
    // Create a course and enroll student
    cy.createCourse({
      title: 'Test Course',
      description: 'Test Description',
      price: 99.99,
    })
    
    cy.visit('/dashboard')
    
    // Should show enrolled courses
    cy.contains('Recent Enrollments').should('be.visible')
    cy.get('[data-testid="enrolled-course"]').should('exist')
  })

  it('should show course lessons', () => {
    cy.visit('/courses')
    
    // Click on first course
    cy.get('[data-testid="course-card"]').first().click()
    
    // Should show course content section
    cy.contains('Course Content').should('be.visible')
    cy.get('[data-testid="lesson-item"]').should('exist')
  })

  it('should handle course pagination', () => {
    cy.visit('/courses')
    
    // Should show pagination if there are many courses
    cy.get('[data-testid="pagination"]').should('exist')
    
    // Click next page
    cy.get('button').contains('Next').click()
    
    // Should be on page 2
    cy.get('[data-testid="pagination"]').should('contain', '2')
  })
})