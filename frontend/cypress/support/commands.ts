/// <reference types="cypress" />

// Custom commands for e2e tests

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      createCourse(courseData: any): Chainable<void>
      enrollInCourse(courseId: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email = 'student@elearning.com', password = 'student123') => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="profile-dropdown"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

Cypress.Commands.add('createCourse', (courseData) => {
  cy.request({
    method: 'POST',
    url: '/api/courses',
    body: courseData,
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    }
  })
})

Cypress.Commands.add('enrollInCourse', (courseId) => {
  cy.request({
    method: 'POST',
    url: `/api/enrollments/${courseId}`,
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    }
  })
})