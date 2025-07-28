# 📚 Component Documentation

This document provides detailed documentation for all React components in the Solo Habits application.

## 🗂️ Component Overview

| Component | Purpose | Location | Props |
|-----------|---------|----------|-------|
| `App` | Main application container | `/src/App.js` | None |
| `Auth` | Authentication forms | `/src/components/Auth.js` | None |
| `Main` | Dashboard and overview | `/src/components/Main.js` | `user`, `userData`, `setActiveTab` |
| `Tatakae` | Challenge management | `/src/components/Tatakae.js` | `soundEnabled` |
| `HMinus` | Bad habit tracking | `/src/components/HMinus.js` | `soundEnabled` |
| `Settings` | Application settings | `/src/components/Settings.js` | `onLogout` |
| `ErrorBoundary` | Error handling | `/src/components/ErrorBoundary.js` | `userId`, `children` |
| `SkeletonLoader` | Loading state | `/src/components/SkeletonLoader.js` | None |

---

## 📱 App Component

**File:** `/src/App.js`
**Purpose:** Main application container with routing and authentication state

### Features
- Authentication state management
- Tab navigation system
- Error boundary integration
- Lazy loading of components
- User data fetching from Firestore

### State Variables
```javascript
const [activeTab, setActiveTab] = useState(0);     // Current active tab (0-3)
const [user, setUser] = useState(null);           // Firebase user object
const [userData, setUserData] = useState(null);   // User data from Firestore
const [loading, setLoading] = useState(true);     // Loading state
```

### Tab System
```javascript
const tabs = [
  { id: 0, name: "MAIN", icon: "🌟" },      // Dashboard
  { id: 1, name: "TATAKAE", icon: "⚡" },   // Challenges
  { id: 2, name: "H-", icon: "🚫" },       // Bad habits
  { id: 3, name: "SETTINGS", icon: "⚙️" }  // Settings
];
```

---

## 🔐 Auth Component

**File:** `/src/components/Auth.js`
**Purpose:** Handles user authentication (login/register)

### Features
- Toggle between login and registration
- Email/password authentication
- User profile creation in Firestore
- Form validation and error handling

### Props
- None (self-contained)

### State Variables
```javascript
const [isLogin, setIsLogin] = useState(true);       // Toggle login/register
const [email, setEmail] = useState('');            // Email input
const [password, setPassword] = useState('');      // Password input
const [name, setName] = useState('');              // Name input (register only)
const [surname, setSurname] = useState('');        // Surname input (register only)
```

### Methods
- `handleSubmit()` - Process login/registration
- Form validation and Firebase Auth integration

---

## 🏠 Main Component

**File:** `/src/components/Main.js`
**Purpose:** Dashboard showing personal bests and habit tips

### Props
```javascript
Main.propTypes = {
  user: validateUser,           // Firebase user object
  userData: validateUserData,   // User data from Firestore  
  setActiveTab: validateFunction // Function to change active tab
};
```

### Features
- Personal best calculations (TATAKAE and H-)
- Random daily tips from Atomic Habits
- Interactive habit guide
- Real-time data from Firebase

### State Variables
```javascript
const [randomTip, setRandomTip] = useState(null);          // Daily habit tip
const [showGuide, setShowGuide] = useState(false);        // Guide modal state
const [personalBest, setPersonalBest] = useState({...});  // User records
```

### Key Methods
- `getUserName()` - Extract user display name
- `getRandomTip()` - Select random habit tip
- `calculatePersonalBest()` - Compute user achievements
- `calculateStreak()` - Calculate habit streaks

---

## ⚡ Tatakae Component

**File:** `/src/components/Tatakae.js`
**Purpose:** Challenge management system for building good habits

### Props
```javascript
const Tatakae = ({ soundEnabled }) => {
  // soundEnabled: boolean - Enable/disable sound effects
};
```

### Features
- Create custom challenges (7 or 30 days)
- Daily progress tracking with visual calendar
- Streak calculation and recovery mode
- Habit stacking and temptation bundling
- Auto-extension from 7 to 30 days
- Confetti animations and achievements

### State Variables
```javascript
const [challenges, setChallenges] = useState([]);           // Active challenges
const [showForm, setShowForm] = useState(false);          // Form modal
const [newChallenge, setNewChallenge] = useState({...});   // Challenge creation
const [showExtendModal, setShowExtendModal] = useState(null); // Extension offer
const [confetti, setConfetti] = useState([]);             // Animation particles
const [achievementModal, setAchievementModal] = useState(null); // Achievement popup
```

### Key Methods
- `addChallenge()` - Create new challenge
- `toggleDay()` - Mark day as complete/incomplete
- `getDaysSinceStart()` - Calculate days elapsed
- `getProgressBoxes()` - Generate calendar UI
- `extendToMonth()` - Convert 7-day to 30-day challenge
- `createConfetti()` - Trigger celebration animation

### Challenge Object Structure
```javascript
{
  id: string,
  name: string,
  icon: string,
  color: string,
  description: string,
  duration: number,              // 7 or 30 days
  startDate: string,            // YYYY-MM-DD format
  monthlyProgress: boolean[],   // Daily completion array
  completedDays: number,
  missedDays: number,
  consecutiveMissed: number,
  recoveryMode: boolean,
  stackTrigger: string,         // Habit stacking trigger
  bundlePartner: string,        // Temptation bundling partner
  isExtended: boolean,
  monthsCompleted: number
}
```

---

## 🚫 HMinus Component

**File:** `/src/components/HMinus.js`
**Purpose:** Bad habit tracking system for breaking unwanted behaviors

### Props
```javascript
const HMinus = ({ soundEnabled }) => {
  // soundEnabled: boolean - Enable/disable sound effects
};
```

### Features
- Track habits to quit (smoking, social media, etc.)
- Clean/relapse tracking system
- Aversion bundling and consequence reminders
- Environmental design triggers
- Progress visualization with clean percentages

### State Variables
```javascript
const [badHabits, setBadHabits] = useState([]);            // Active bad habits
const [showForm, setShowForm] = useState(false);          // Form modal
const [newBadHabit, setNewBadHabit] = useState({...});    // Bad habit creation
const [showExtendModal, setShowExtendModal] = useState(null); // Extension offer
```

### Key Methods
- `addBadHabit()` - Create new bad habit tracking
- `toggleDay()` - Mark day as clean/relapse/neutral
- `getProgressDisplay()` - Calculate clean percentage
- `getProgressBoxes()` - Generate calendar UI

### Bad Habit Object Structure
```javascript
{
  id: string,
  name: string,
  icon: string,
  color: string,
  description: string,
  duration: number,              // 7 or 30 days
  startDate: string,            // YYYY-MM-DD format
  monthlyProgress: boolean[],   // null=neutral, true=clean, false=relapse
  cleanDays: number,
  relapseCount: number,
  currentStreak: number,
  longestStreak: number,
  aversionPartner: string,      // Negative consequence
  consequenceReminder: string,  // Long-term damage reminder
  blockerTrigger: string,       // Replacement activity
  isExtended: boolean,
  monthsCompleted: number
}
```

---

## ⚙️ Settings Component

**File:** `/src/components/Settings.js`
**Purpose:** Application settings and user preferences

### Props
```javascript
Settings.propTypes = {
  onLogout: validateFunction    // Logout callback function
};
```

### Features
- Day start time configuration
- Notification settings (3 daily reminders)
- Service Worker integration for PWA notifications
- Time format validation and sanitization
- Settings persistence in Firestore

### State Variables
```javascript
const [userSettings, setUserSettings] = useState({
  dayStartTime: "00:00",
  notifications: {
    enabled: true,
    times: ["07:00", "16:00", "23:00"]
  }
});
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
```

### Key Methods
- `ensureTimeFormat()` - Validate and format time strings
- `handleDayStartTimeChange()` - Update day start time with debouncing
- `handleNotificationTimeChange()` - Update notification times
- `handleNotificationToggle()` - Enable/disable notifications
- `saveSettings()` - Persist settings to Firestore

---

## 🚨 ErrorBoundary Component

**File:** `/src/components/ErrorBoundary.js`
**Purpose:** Catch and handle React errors gracefully

### Props
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    // props.userId - Optional user ID for error reporting
    // props.children - Child components to wrap
  }
}
```

### Features
- Catches JavaScript errors in component tree
- Displays fallback UI instead of crashing
- Error reporting with unique error IDs
- Development vs. production error display
- Local storage backup for error reports

### State Variables
```javascript
this.state = {
  hasError: false,      // Error occurred flag
  error: null,          // Error object
  errorInfo: null,      // Component stack trace
  errorId: null         // Unique error identifier
};
```

### Methods
- `componentDidCatch()` - Error capture and logging
- `reportError()` - Send error reports to logging service
- `handleRetry()` - Reset error state and retry
- `handleReload()` - Reload the page
- `handleGoBack()` - Navigate back in history

---

## ⏳ SkeletonLoader Component

**File:** `/src/components/SkeletonLoader.js`
**Purpose:** Loading state animation while content loads

### Props
- None (static loading animation)

### Features
- CSS-only loading animation
- Mobile-responsive design
- Consistent with app's dark theme
- Used during authentication and lazy loading

---

## 🎣 Custom Hooks

### useChallenge Hook
**File:** `/src/hooks/useChallenge.js`
**Purpose:** Manage challenge state and Firebase operations

#### Returns
```javascript
{
  challenges,              // Array of active challenges
  showExtendModal,        // Extension modal state
  setShowExtendModal,     // Extension modal setter
  getDaysSinceStart,      // Calculate days since start
  getProgressBoxes,       // Generate progress UI
  addChallenge,          // Create new challenge
  extendToMonth,         // Extend 7-day to 30-day
  toggleDay,             // Mark day complete/incomplete
  deleteChallenge,       // Remove challenge
  updateDescription,     // Update challenge description
  getCompletionPercentage, // Calculate completion %
  isExpired              // Check if challenge is finished
}
```

### useBadHabit Hook
**File:** `/src/hooks/useBadHabit.js`
**Purpose:** Manage bad habit state and Firebase operations

#### Returns
```javascript
{
  badHabits,             // Array of active bad habits
  showExtendModal,       // Extension modal state
  setShowExtendModal,    // Extension modal setter
  getDaysSinceStart,     // Calculate days since start
  getProgressBoxes,      // Generate progress UI
  addBadHabit,          // Create new bad habit tracker
  extendToMonth,        // Extend 7-day to 30-day
  toggleDay,            // Mark day clean/relapse/neutral
  deleteBadHabit,       // Remove bad habit tracker
  updateDescription,    // Update description
  getProgressDisplay,   // Calculate clean percentage
  isExpired            // Check if tracking is finished
}
```

---

## 🎨 Styling Structure

### CSS Organization
- **Component-specific CSS:** Each component has its own `.css` file
- **Global styles:** `/src/App.css` for app-wide styles
- **Responsive styles:** `/src/styles/responsive.css` for mobile-first design
- **Utility styles:** `/src/components/SettingsStyles.css` for shared styles

### Theme Colors
```css
:root {
  --primary-bg: linear-gradient(135deg, #0a0616 0%, #1a1a3e 50%, #16213e 100%);
  --text-primary: #ccc9dc;
  --text-secondary: rgba(204, 201, 220, 0.7);
  --accent-blue: #667eea;
  --accent-purple: #764ba2;
  --accent-pink: #f093fb;
  --accent-green: #43e97b;
}
```

### Responsive Breakpoints
- **Mobile:** `max-width: 480px`
- **Tablet Portrait:** `481px - 768px`
- **Tablet Landscape:** `769px - 1024px`
- **Desktop:** `1025px+`

---

## 🔄 State Management

### Firebase Integration
- **Authentication:** Firebase Auth for user management
- **Database:** Firestore for data persistence
- **Real-time updates:** `onSnapshot` listeners for live data
- **Offline support:** Service Worker caching

### Data Flow
1. **Authentication:** User logs in via Auth component
2. **Data Loading:** App fetches user data from Firestore
3. **Real-time Updates:** Components subscribe to Firestore changes
4. **State Updates:** Local state updates trigger UI re-renders
5. **Persistence:** Changes saved back to Firestore

---

## 🔧 Development Guidelines

### Component Creation Checklist
- [ ] Create component file in `/src/components/`
- [ ] Add corresponding CSS file
- [ ] Implement prop validation
- [ ] Add error boundaries where needed
- [ ] Include responsive design
- [ ] Write component documentation
- [ ] Add to lazy loading if appropriate

### Best Practices
- **Prop Validation:** Use custom validators from `/src/utils/propTypes.js`
- **Error Handling:** Wrap components in ErrorBoundary
- **Performance:** Use `useCallback` and `useMemo` for expensive operations
- **Accessibility:** Include ARIA labels and keyboard navigation
- **Testing:** Write unit tests for critical functionality

---

## 🐛 Common Issues & Solutions

### Issue: Component not re-rendering
**Solution:** Check if state updates are using proper immutable patterns

### Issue: Firebase permission denied
**Solution:** Verify Firestore security rules and user authentication

### Issue: Service Worker not updating
**Solution:** Update cache version in `service-worker.js`

### Issue: Memory leaks
**Solution:** Clean up subscriptions and timeouts in `useEffect` cleanup

---

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [PWA Best Practices](https://developers.google.com/web/progressive-web-apps)
- [Atomic Habits Methodology](https://jamesclear.com/atomic-habits)

---

*This documentation is maintained alongside the codebase. Please update when making significant changes to components.*