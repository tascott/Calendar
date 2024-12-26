# DailyCal

A modern, vintage-styled calendar application with focus on user experience and productivity features.

## Features

### Calendar Views
- **Day View**: Detailed hourly view with drag-and-drop event management
- **Week View**: Weekly overview with event management across days
- **Month View**: Monthly overview with event previews
- **Auto-scroll**: Day view automatically scrolls to current time
- **Navigation**: Previous/Next/Today navigation in all views

### Event Management
- **Event Types**:
  - Regular events
  - Status events (displayed on the right side)
  - Focus events (with overlay display)
- **Event Properties**:
  - Name
  - Date and time
  - Color customization (background and text)
  - Width adjustment
  - Custom overlay text (for focus events)
- **Recurring Events**:
  - Daily (with specific day selection)
  - Weekly
  - Monthly
  - Visual indicator for recurring events
- **Event Interactions**:
  - Drag and drop
  - Resize width
  - Double-click to edit
  - Delete events (single or recurring series)

### User Interface
- **Vintage Styling**:
  - Warm color palette
  - Classic typography
  - Subtle borders and shadows
- **Responsive Design**:
  - Touch support for mobile devices
  - Adaptive layout
- **Visual Feedback**:
  - Hover states
  - Drag indicators
  - Focus overlay animations

### Settings
- Font selection
- Primary color customization
- Day start/end time
- Default event widths
- Default status event width

### Authentication
- User accounts with secure login
- JWT-based authentication
- Protected API endpoints

## Technical Details

### Database Schema

#### Events Table
\`\`\`sql
CREATE TABLE events (
    user_id INTEGER NOT NULL,
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    type TEXT,
    xPosition REAL DEFAULT 0,
    width REAL DEFAULT 50,
    backgroundColor TEXT,
    color TEXT,
    recurring TEXT DEFAULT 'none',
    recurringDays TEXT DEFAULT '{}',
    recurringEventId TEXT,
    overlayText TEXT
)
\`\`\`

#### Users Table
\`\`\`sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)
\`\`\`

#### Settings Table
\`\`\`sql
CREATE TABLE settings (
    user_id INTEGER PRIMARY KEY,
    primaryColor TEXT DEFAULT '#2C2C2C',
    defaultEventWidth INTEGER DEFAULT 80,
    defaultStatusWidth INTEGER DEFAULT 20,
    dayStartTime TEXT DEFAULT '06:00',
    dayEndTime TEXT DEFAULT '22:00',
    font TEXT DEFAULT 'system-ui'
)
\`\`\`

### Project Structure

#### Frontend (/src)
- **Components/**
  - `EventForm.js`: Event creation/editing form
  - `SettingsForm.js`: User settings management
  - `StatusOverlay.js`: Focus mode overlay
  - `CalendarNavigation.js`: Date navigation
  - `TimeColumn.js`: Time markers
  - `ViewSelector.js`: View switching
- **Views/**
  - `DayView.js`: Daily calendar view
  - `WeekView.js`: Weekly calendar view
  - `MonthView.js`: Monthly calendar view
- **Utils/**
  - `device.js`: Device detection utilities

#### Backend (/backend)
- `index.js`: Express server and API routes
- `db.js`: Database operations and schema
- `package.json`: Backend dependencies

### API Endpoints

- **Authentication**
  - POST `/register`: User registration
  - POST `/login`: User authentication
- **Events**
  - GET `/events`: Fetch user's events
  - POST `/events`: Create/update events
- **Settings**
  - GET `/settings`: Fetch user settings
  - POST `/settings`: Update user settings

### Technologies Used

- **Frontend**:
  - React
  - TailwindCSS
  - React DnD (drag and drop)
  - Axios (API calls)
- **Backend**:
  - Express.js
  - SQLite3
  - JWT (authentication)
  - bcrypt (password hashing)

## Coding Style

- Modern JavaScript (ES6+)
- React Hooks for state management
- Functional components
- Consistent error handling
- Detailed logging
- Atomic database transactions
- Modular component architecture

## Next Steps

### Features
1. Task Management
   - Task list integration
   - Task-to-event conversion
   - Priority levels
   - Due dates

2. Enhanced Recurring Events
   - End date for recurring series
   - Exception handling for series
   - Custom recurrence patterns

3. Calendar Sharing
   - Share with other users
   - Public/private calendars
   - Collaboration features

4. Notes Integration
   - Note taking within events
   - Rich text support
   - File attachments

### Technical Improvements
1. Performance
   - Optimize recurring event generation
   - Implement virtual scrolling
   - Cache frequently accessed data

2. Testing
   - Unit tests for components
   - Integration tests for API
   - End-to-end testing

3. Mobile Experience
   - Native mobile apps
   - Offline support
   - Push notifications

4. Security
   - Rate limiting
   - Input validation
   - CSRF protection

### UI/UX Enhancements
1. Themes
   - Dark mode
   - Custom theme creation
   - More vintage styles

2. Accessibility
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

3. Visualization
   - Timeline view
   - Analytics dashboard
   - Heat maps

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```
3. Start the backend:
   ```bash
   cd backend && npm start
   ```
4. Start the frontend:
   ```bash
   npm start
   ```
5. Visit `http://localhost:3000`

## Contributing

Please read our contributing guidelines before submitting pull requests.
