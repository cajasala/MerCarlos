## ADDED Requirements

### Requirement: SMS-based Authentication
User registration and login must be handled via a mobile phone number and a one-time verification code (OTP).

#### Scenario: First-time registration
- **WHEN** a user enters their phone number, name, and email for the first time.
- **THEN** an SMS with a verification code is sent to the phone number, and the user must enter it to complete registration.

### Requirement: Profile Store Preference
Users can update their default store in their profile settings.

#### Scenario: Updating default store
- **WHEN** an authenticated user changes their store selection in the profile.
- **THEN** the selection is saved to the database and used for all future sessions.
