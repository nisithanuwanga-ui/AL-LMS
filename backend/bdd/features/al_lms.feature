Feature: AL-LMS role-based API access
  As an AL-LMS user
  I want protected learning-management actions to enforce authentication and role permissions
  So that only authorized users can access protected resources

  Scenario: An unauthenticated visitor cannot enroll in a course
    Given the AL-LMS API is running
    When I submit an enrollment request without an authentication cookie
    Then the API response status should be 401

  Scenario: A pending teacher cannot create a course
    Given the AL-LMS API is running
    And I have a pending teacher authentication cookie
    When I submit a valid course creation request
    Then the API response status should be 403
