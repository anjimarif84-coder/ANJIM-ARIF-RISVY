/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as a user
       * @example cy.login('user@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to register a new user
       * @example cy.register('John', 'Doe', 'john@example.com', 'password123')
       */
      register(firstName: string, lastName: string, email: string, password: string, role?: 'STUDENT' | 'TEACHER'): Chainable<void>
      
      /**
       * Custom command to logout current user
       * @example cy.logout()
       */
      logout(): Chainable<void>
      
      /**
       * Custom command to create a test user via API
       * @example cy.createUser({ email: 'test@example.com', role: 'TEACHER' })
       */
      createUser(userData: any): Chainable<any>
      
      /**
       * Custom command to create a test course via API
       * @example cy.createCourse({ title: 'Test Course', price: 99.99 })
       */
      createCourse(courseData: any): Chainable<any>
      
      /**
       * Custom command to clean up test data
       * @example cy.cleanupTestData()
       */
      cleanupTestData(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy=email-input]').type(email)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=login-button]').click()
  
  // Wait for successful login
  cy.url().should('not.include', '/login')
  cy.get('[data-cy=user-menu]').should('be.visible')
})

Cypress.Commands.add('register', (firstName: string, lastName: string, email: string, password: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') => {
  cy.visit('/signup')
  cy.get('[data-cy=first-name-input]').type(firstName)
  cy.get('[data-cy=last-name-input]').type(lastName)
  cy.get('[data-cy=email-input]').type(email)
  cy.get('[data-cy=role-select]').select(role)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=confirm-password-input]').type(password)
  cy.get('[data-cy=terms-checkbox]').check()
  cy.get('[data-cy=register-button]').click()
  
  // Wait for successful registration
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click()
  cy.get('[data-cy=logout-button]').click()
  
  // Wait for successful logout
  cy.url().should('not.include', '/dashboard')
  cy.get('[data-cy=login-link]').should('be.visible')
})

Cypress.Commands.add('createUser', (userData: any) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    role: 'STUDENT',
    ...userData
  }
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: defaultUser,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

Cypress.Commands.add('createCourse', (courseData: any) => {
  const defaultCourse = {
    title: `Test Course ${Date.now()}`,
    description: 'A test course for e2e testing',
    shortDescription: 'Test course',
    price: 99.99,
    ...courseData
  }
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/courses`,
    body: defaultCourse,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('accessToken')}`
    },
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

Cypress.Commands.add('cleanupTestData', () => {
  // This would typically call an API endpoint to clean up test data
  // For now, we'll just clear local storage
  cy.clearLocalStorage()
  cy.clearCookies()
})