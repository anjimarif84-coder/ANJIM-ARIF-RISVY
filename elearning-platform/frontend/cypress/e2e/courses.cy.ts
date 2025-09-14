describe('Courses', () => {
  beforeEach(() => {
    cy.cleanupTestData()
  })

  describe('Course Listing', () => {
    beforeEach(() => {
      // Create test courses via API
      cy.createUser({
        firstName: 'Teacher',
        lastName: 'User',
        email: 'teacher@example.com',
        role: 'TEACHER'
      }).then((teacher) => {
        // Login as teacher to create courses
        cy.login('teacher@example.com', 'password123')
        
        // Create published courses
        cy.createCourse({
          title: 'React Fundamentals',
          description: 'Learn the basics of React',
          price: 99.99,
          isPublished: true
        })
        
        cy.createCourse({
          title: 'Advanced JavaScript',
          description: 'Master advanced JavaScript concepts',
          price: 149.99,
          isPublished: true
        })
        
        cy.logout()
      })
    })

    it('should display published courses on courses page', () => {
      cy.visit('/courses')
      
      cy.contains('React Fundamentals').should('be.visible')
      cy.contains('Advanced JavaScript').should('be.visible')
      
      // Should show course details
      cy.contains('Learn the basics of React').should('be.visible')
      cy.contains('$99.99').should('be.visible')
    })

    it('should allow searching courses', () => {
      cy.visit('/courses')
      
      cy.get('[data-cy=course-search]').type('React')
      
      cy.contains('React Fundamentals').should('be.visible')
      cy.contains('Advanced JavaScript').should('not.exist')
    })

    it('should allow filtering by category', () => {
      // This would require categories to be set up
      cy.visit('/courses')
      
      // Test would depend on actual category implementation
      cy.get('[data-cy=category-filter]').should('exist')
    })

    it('should support pagination', () => {
      cy.visit('/courses')
      
      // Assuming pagination is implemented
      cy.get('[data-cy=pagination]').should('be.visible')
    })
  })

  describe('Course Details', () => {
    let courseId: string

    beforeEach(() => {
      cy.createUser({
        firstName: 'Teacher',
        lastName: 'User',
        email: 'teacher@example.com',
        role: 'TEACHER'
      }).then(() => {
        cy.login('teacher@example.com', 'password123')
        
        cy.createCourse({
          title: 'Test Course',
          description: 'A detailed test course',
          shortDescription: 'Test course for e2e',
          price: 199.99,
          isPublished: true
        }).then((course) => {
          courseId = course.id
          cy.logout()
        })
      })
    })

    it('should display course details for unauthenticated users', () => {
      cy.visit(`/courses/${courseId}`)
      
      cy.contains('Test Course').should('be.visible')
      cy.contains('A detailed test course').should('be.visible')
      cy.contains('$199.99').should('be.visible')
      
      // Should show enroll button
      cy.get('[data-cy=enroll-button]').should('be.visible')
    })

    it('should show enrollment status for authenticated users', () => {
      cy.createUser({
        firstName: 'Student',
        lastName: 'User',
        email: 'student@example.com',
        role: 'STUDENT'
      }).then(() => {
        cy.login('student@example.com', 'password123')
        
        cy.visit(`/courses/${courseId}`)
        
        // Should show enroll button for non-enrolled student
        cy.get('[data-cy=enroll-button]').should('be.visible')
        cy.get('[data-cy=access-course-button]').should('not.exist')
      })
    })

    it('should handle non-existent course', () => {
      cy.visit('/courses/non-existent-id', { failOnStatusCode: false })
      
      cy.contains('Course not found').should('be.visible')
    })
  })

  describe('Course Enrollment', () => {
    let courseId: string
    let studentEmail: string

    beforeEach(() => {
      studentEmail = `student-${Date.now()}@example.com`
      
      // Create teacher and course
      cy.createUser({
        firstName: 'Teacher',
        lastName: 'User',
        email: 'teacher@example.com',
        role: 'TEACHER'
      }).then(() => {
        cy.login('teacher@example.com', 'password123')
        
        cy.createCourse({
          title: 'Enrollment Test Course',
          description: 'Course for testing enrollment',
          price: 99.99,
          isPublished: true
        }).then((course) => {
          courseId = course.id
          cy.logout()
        })
      })
      
      // Create student
      cy.createUser({
        firstName: 'Student',
        lastName: 'User',
        email: studentEmail,
        role: 'STUDENT'
      })
    })

    it('should require authentication for enrollment', () => {
      cy.visit(`/courses/${courseId}`)
      
      cy.get('[data-cy=enroll-button]').click()
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should redirect to payment for paid courses', () => {
      cy.login(studentEmail, 'password123')
      
      cy.visit(`/courses/${courseId}`)
      
      cy.get('[data-cy=enroll-button]').click()
      
      // Should redirect to payment (Stripe checkout)
      // This would depend on actual Stripe integration
      cy.url().should('include', 'checkout') // or payment page
    })

    it('should allow direct enrollment for free courses', () => {
      // Create free course
      cy.login('teacher@example.com', 'password123')
      
      cy.createCourse({
        title: 'Free Course',
        description: 'A free course',
        price: 0,
        isPublished: true
      }).then((freeCourse) => {
        cy.logout()
        cy.login(studentEmail, 'password123')
        
        cy.visit(`/courses/${freeCourse.id}`)
        
        cy.get('[data-cy=enroll-button]').click()
        
        // Should show success message and access button
        cy.contains('Successfully enrolled').should('be.visible')
        cy.get('[data-cy=access-course-button]').should('be.visible')
      })
    })
  })

  describe('Teacher Course Management', () => {
    let teacherEmail: string

    beforeEach(() => {
      teacherEmail = `teacher-${Date.now()}@example.com`
      
      cy.createUser({
        firstName: 'Teacher',
        lastName: 'User',
        email: teacherEmail,
        role: 'TEACHER'
      })
    })

    it('should allow teachers to create new courses', () => {
      cy.login(teacherEmail, 'password123')
      
      cy.visit('/dashboard')
      
      cy.get('[data-cy=create-course-button]').click()
      
      // Fill course creation form
      cy.get('[data-cy=course-title-input]').type('New Test Course')
      cy.get('[data-cy=course-description-textarea]').type('This is a new test course')
      cy.get('[data-cy=course-short-description-input]').type('New course')
      cy.get('[data-cy=course-price-input]').type('199.99')
      
      cy.get('[data-cy=create-course-submit]').click()
      
      // Should redirect to course management
      cy.contains('Course created successfully').should('be.visible')
      cy.contains('New Test Course').should('be.visible')
    })

    it('should allow teachers to edit their courses', () => {
      cy.login(teacherEmail, 'password123')
      
      cy.createCourse({
        title: 'Editable Course',
        description: 'Course to be edited',
        price: 99.99
      }).then(() => {
        cy.visit('/dashboard')
        
        cy.get('[data-cy=edit-course-button]').first().click()
        
        cy.get('[data-cy=course-title-input]').clear().type('Updated Course Title')
        cy.get('[data-cy=update-course-submit]').click()
        
        cy.contains('Course updated successfully').should('be.visible')
        cy.contains('Updated Course Title').should('be.visible')
      })
    })

    it('should allow teachers to publish courses', () => {
      cy.login(teacherEmail, 'password123')
      
      cy.createCourse({
        title: 'Course to Publish',
        description: 'Course that will be published',
        price: 99.99,
        isPublished: false
      }).then(() => {
        // Add a lesson first (required for publishing)
        // This would require lesson creation API
        
        cy.visit('/dashboard')
        
        cy.get('[data-cy=publish-course-button]').first().click()
        
        cy.contains('Course published successfully').should('be.visible')
        cy.get('[data-cy=course-status]').should('contain', 'Published')
      })
    })

    it('should not allow students to access teacher features', () => {
      cy.createUser({
        firstName: 'Student',
        lastName: 'User',
        email: 'student@example.com',
        role: 'STUDENT'
      }).then(() => {
        cy.login('student@example.com', 'password123')
        
        cy.visit('/dashboard')
        
        // Should not see teacher-specific buttons
        cy.get('[data-cy=create-course-button]').should('not.exist')
        cy.get('[data-cy=my-courses-section]').should('not.exist')
      })
    })
  })
})