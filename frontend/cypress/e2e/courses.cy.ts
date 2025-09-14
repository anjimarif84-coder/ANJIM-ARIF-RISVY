describe('Courses', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should display courses list', () => {
    cy.visit('/courses')
    
    cy.get('[data-testid="course-card"]').should('have.length.greaterThan', 0)
    cy.get('[data-testid="course-title"]').should('be.visible')
    cy.get('[data-testid="course-price"]').should('be.visible')
  })

  it('should search courses', () => {
    cy.visit('/courses')
    
    cy.get('input[placeholder*="Search courses"]').type('JavaScript')
    cy.get('button[type="submit"]').click()
    
    cy.get('[data-testid="course-card"]').should('have.length.greaterThan', 0)
  })

  it('should filter courses by price', () => {
    cy.visit('/courses')
    
    cy.get('select').first().select('price')
    cy.get('select').last().select('asc')
    
    cy.get('[data-testid="course-price"]').then(($prices) => {
      const prices = $prices.map((_, el) => parseFloat(el.textContent.replace('$', ''))).get()
      const sortedPrices = [...prices].sort((a, b) => a - b)
      expect(prices).to.deep.equal(sortedPrices)
    })
  })

  it('should navigate to course detail', () => {
    cy.visit('/courses')
    
    cy.get('[data-testid="course-card"]').first().click()
    
    cy.url().should('include', '/courses/')
    cy.get('[data-testid="course-title"]').should('be.visible')
    cy.get('[data-testid="enroll-button"]').should('be.visible')
  })

  it('should enroll in a course', () => {
    cy.visit('/courses')
    cy.get('[data-testid="course-card"]').first().click()
    
    cy.get('[data-testid="enroll-button"]').click()
    
    // Mock Stripe checkout
    cy.window().then((win) => {
      win.stripe = {
        confirmCardPayment: cy.stub().resolves({ error: null })
      }
    })
    
    cy.get('[data-testid="stripe-checkout"]').should('be.visible')
  })

  it('should display course curriculum', () => {
    cy.visit('/courses')
    cy.get('[data-testid="course-card"]').first().click()
    
    cy.get('[data-testid="course-curriculum"]').should('be.visible')
    cy.get('[data-testid="lesson-item"]').should('have.length.greaterThan', 0)
  })

  it('should show instructor information', () => {
    cy.visit('/courses')
    cy.get('[data-testid="course-card"]').first().click()
    
    cy.get('[data-testid="instructor-info"]').should('be.visible')
    cy.get('[data-testid="instructor-name"]').should('be.visible')
  })
})