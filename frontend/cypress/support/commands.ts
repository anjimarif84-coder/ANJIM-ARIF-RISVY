/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      createUser(user: {
        email: string
        password: string
        firstName: string
        lastName: string
      }): Chainable<void>
      createCourse(course: {
        title: string
        description: string
        price: number
      }): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password },
    }).then((response) => {
      expect(response.status).to.eq(200)
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: response.body.user,
          accessToken: response.body.accessToken,
          refreshToken: response.body.refreshToken,
          isAuthenticated: true,
        },
        version: 0,
      }))
    })
  })
})

Cypress.Commands.add('logout', () => {
  cy.clearLocalStorage()
  cy.clearCookies()
})

Cypress.Commands.add('createUser', (user) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: user,
  }).then((response) => {
    expect(response.status).to.eq(201)
  })
})

Cypress.Commands.add('createCourse', (course) => {
  cy.login('teacher@example.com', 'password123')
  cy.request({
    method: 'POST',
    url: '/api/courses',
    headers: {
      Authorization: `Bearer ${JSON.parse(window.localStorage.getItem('auth-storage') || '{}').state?.accessToken}`,
    },
    body: course,
  }).then((response) => {
    expect(response.status).to.eq(201)
  })
})