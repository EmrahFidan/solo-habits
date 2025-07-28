# 🚀 Solo Habits - Habit Tracker App

**Version:** 3.0.0  
**Framework:** React.js + Firebase  
**Theme:** Atomic Habits Methodology by James Clear  

A powerful habit tracking Progressive Web App (PWA) that helps you build good habits and break bad ones using proven psychological techniques.

## 📱 Features

### 🎯 TATAKAE (Challenge System)
- **Create custom habit challenges** (7 days or 30 days)
- **Visual progress tracking** with daily completion boxes
- **Streak calculation** and milestone celebrations
- **Recovery mode** for missed days
- **Habit stacking** - chain habits together
- **Temptation bundling** - pair habits with rewards
- **Auto-extension** - extend successful 7-day challenges to 30 days

### 🚫 H- (Bad Habit Tracking)
- **Track habits you want to quit** (smoking, social media, etc.)
- **Clean streak tracking** with relapse monitoring
- **Aversion bundling** - attach negative consequences
- **Environmental design** - remove triggers
- **Progress visualization** with clean/relapse indicators

### 🏆 Gamification
- **Personal best tracking** - longest streaks, best months
- **Diamond system** - earn diamonds for weekly streaks
- **Achievement badges** for consistent performance
- **Rank system** based on overall progress

### 📊 Analytics & Insights
- **Comprehensive dashboard** showing all habits
- **Success rate calculations**
- **Monthly completion rates**
- **Daily habit tips** from Atomic Habits methodology

### 🔔 Smart Notifications
- **Scheduled reminders** (3 times daily)
- **PWA notifications** work even when app is closed
- **Customizable notification times**
- **Streak warning alerts**

## 🛠️ Technology Stack

- **Frontend:** React.js 18.2.0
- **Backend:** Firebase (Firestore + Auth)
- **PWA:** Service Workers + Web App Manifest
- **Styling:** CSS3 with CSS Grid/Flexbox
- **Build Tool:** Create React App
- **State Management:** React Hooks + Context
- **Performance:** Code Splitting, Lazy Loading, Caching

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/solo-habits.git
   cd solo-habits
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your Firebase configuration
   nano .env
   ```

4. **Configure Firebase**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Copy your config values to `.env`

5. **Start Development Server**
   ```bash
   npm start
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
solo-habits/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # SW for offline functionality
│   ├── icon-192.png          # PWA icons
│   └── icon-512.png
├── src/
│   ├── components/
│   │   ├── Auth.js           # Authentication
│   │   ├── Main.js           # Dashboard
│   │   ├── Tatakae.js        # Challenge system
│   │   ├── HMinus.js         # Bad habit tracking
│   │   ├── Settings.js       # App settings
│   │   ├── ErrorBoundary.js  # Error handling
│   │   └── SkeletonLoader.js # Loading states
│   ├── hooks/
│   │   ├── useChallenge.js   # Challenge management
│   │   └── useBadHabit.js    # Bad habit management
│   ├── constants/
│   │   └── habitSteps.js     # Atomic Habits methodology
│   ├── utils/
│   │   └── propTypes.js      # Custom prop validators
│   ├── styles/
│   │   └── responsive.css    # Mobile-first responsive design
│   ├── firebase.js           # Firebase configuration
│   └── App.js               # Main app component
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
└── package.json             # Dependencies and scripts
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run test suite |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run analyze` | Analyze bundle size |
| `npm run clean` | Clean build cache |

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🎨 Design Philosophy

Based on **James Clear's Atomic Habits** methodology:

### For Building Good Habits:
1. **🔍 Cue (Make it Obvious)** - Environmental design, habit stacking
2. **✨ Craving (Make it Attractive)** - Temptation bundling, social motivation  
3. **⚡ Response (Make it Easy)** - 2-minute rule, friction reduction
4. **🏆 Reward (Make it Satisfying)** - Progress tracking, celebration

### For Breaking Bad Habits:
1. **🫥 Make it Invisible** - Remove environmental triggers
2. **🤢 Make it Unattractive** - Highlight negative consequences
3. **🚧 Make it Difficult** - Add friction to access
4. **😰 Make it Unsatisfying** - Add immediate negative consequences

## 📱 PWA Features

- **Offline functionality** with service worker caching
- **Install on home screen** for native app experience
- **Push notifications** for habit reminders
- **Background sync** for data when offline
- **Responsive design** optimized for all devices

## 🔒 Security Features

- **Environment variables** for sensitive config
- **Firebase Security Rules** for data protection
- **XSS protection** with input sanitization
- **Error boundaries** for graceful error handling
- **Prop validation** for runtime type checking

## 🚀 Performance Optimizations

- **Code splitting** with React.lazy()
- **Memoization** of expensive calculations
- **Service worker caching** for static assets
- **Image optimization** and lazy loading
- **Bundle analysis** for size monitoring
- **Memory leak prevention** with cleanup

## 🐛 Error Handling

- **Global error boundaries** catch React errors
- **Service worker error handling** for network issues
- **Firebase error handling** with user-friendly messages
- **Error reporting** with detailed logging
- **Graceful degradation** when features fail

## 📊 Analytics & Monitoring

- **Performance monitoring** with timing metrics
- **User behavior tracking** (privacy-focused)
- **Error tracking** and reporting
- **Cache hit rates** and performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Emrah Fidan**
- Email: emrah@example.com
- GitHub: [@emrahfidan](https://github.com/emrahfidan)

## 🙏 Acknowledgments

- **James Clear** - Atomic Habits methodology
- **Firebase Team** - Backend infrastructure
- **React Team** - Frontend framework
- **Create React App** - Development setup

## 📈 Roadmap

### v3.1.0 (Planned)
- [ ] Social features - share progress with friends
- [ ] Habit templates and community challenges
- [ ] Data export/import functionality
- [ ] Advanced analytics dashboard

### v3.2.0 (Planned)
- [ ] TypeScript migration
- [ ] React Query for better data management
- [ ] Advanced notification scheduling
- [ ] Habit correlation analysis

### v4.0.0 (Future)
- [ ] AI-powered habit suggestions
- [ ] Wearable device integration
- [ ] Voice commands and interactions
- [ ] Multi-language support

## 🐛 Known Issues

- None currently. Report issues [here](https://github.com/your-username/solo-habits/issues).

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/solo-habits/issues) page
2. Create a new issue with detailed description
3. Email support: support@solo-habits.com

---

**Built with ❤️ using React.js and Firebase**

*"You do not rise to the level of your goals. You fall to the level of your systems." - James Clear*