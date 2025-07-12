# SecureChat 💬

A beautiful, lightweight, and secure ephemeral messaging web application with PIN-based room security and stunning visual effects.

![SecureChat Demo](https://secure-chat-two.vercel.app/)

## ✨ Features

### 🔐 Security & Privacy
- **PIN-based Security**: Unique 6-character PINs for room access
- **Ephemeral Messaging**: No permanent data storage
- **24-hour Auto-expiry**: Rooms automatically expire after 24 hours
- **Row Level Security**: Database-level security policies

### 💬 Real-time Communication
- **Instant Messaging**: Real-time message delivery via WebSockets
- **Typing Indicators**: See when others are typing
- **User Presence**: Live online status tracking
- **Connection Status**: Visual connection indicators

### 📁 Rich Media Support
- **Text Messages**: Beautiful formatted text messaging
- **Image Sharing**: Upload and share images instantly
- **File Uploads**: Support for documents up to 10MB
- **Emoji Picker**: Comprehensive emoji selection with 100+ emojis

### 🎨 Beautiful UI/UX
- **Light/Dark Theme**: Toggle between beautiful themes
- **Pastel Color Palette**: Soft, eye-friendly colors
- **Dynamic Animations**: Smooth send/receive message effects
- **Glass Morphism**: Modern translucent design elements
- **Responsive Design**: Perfect on all devices

### ⚡ Performance
- **Lightweight**: Minimal resource usage
- **Fast Loading**: Optimized bundle size
- **Smooth Animations**: 60fps animations with CSS transforms
- **Auto-scroll**: Smart message scrolling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for real-time features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/trdp2019/SecureChat.git
   cd securechat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the migration file in your Supabase SQL editor:
     ```sql
     -- Copy and paste contents from supabase/migrations/create_chat_schema.sql
     ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
securechat/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Theme)
│   ├── hooks/              # Custom React hooks (useChat)
│   ├── lib/                # Utilities and configurations
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── supabase/
│   └── migrations/         # Database schema migrations
├── public/                 # Static assets
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.ts         # Vite build configuration
└── README.md              # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and dev server

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Robust relational database
- **Realtime** - WebSocket-based real-time updates
- **Row Level Security** - Database-level security

### Deployment
- **Netlify** - Frontend hosting and deployment
- **Supabase Cloud** - Managed backend infrastructure

## 🎯 Usage

### Creating a Room
1. Click "Create New Room"
2. Enter your nickname
3. Click "Create Room"
4. Share the generated PIN with others

### Joining a Room
1. Click "Join Existing Room"
2. Enter the room PIN
3. Enter your nickname
4. Click "Join Room"

### Messaging Features
- **Send Messages**: Type and press Enter or click Send
- **Add Emojis**: Click the smile icon to open emoji picker
- **Upload Files**: Click the paperclip icon to upload files/images
- **Copy PIN**: Click "Copy PIN" to share room access
- **Theme Toggle**: Click sun/moon icon to switch themes

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Customization
- **Colors**: Modify `tailwind.config.js` for custom color schemes
- **Animations**: Update animation classes in `tailwind.config.js`
- **File Size Limits**: Adjust in `src/App.tsx` and database schema
- **Room Expiry**: Modify in database migration file

## 📱 Responsive Design

SecureChat is fully responsive and works perfectly on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktop computers (1280px+)

## 🔒 Security Features

### Data Protection
- No permanent message storage
- Automatic room expiry (24 hours)
- PIN-based access control
- Row Level Security policies

### Privacy
- No user registration required
- Temporary nicknames only
- No message history persistence
- Automatic cleanup of expired data

## 🚀 Deployment

### Frontend (Netlify)
1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Backend (Supabase)
1. Create a Supabase project
2. Run the database migration
3. Configure Row Level Security
4. Enable Realtime for tables

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test on multiple devices/browsers
- Maintain responsive design

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For the amazing real-time backend
- **Tailwind CSS** - For the beautiful utility-first CSS
- **Lucide** - For the gorgeous icon set
- **React Team** - For the fantastic framework
- **Vite** - For the lightning-fast build tool

## 📞 Support

If you have any questions or need help:

- 📧 Email: tridip@googleit.in
- 🐛 Issues: [GitHub Issues](https://github.com/trdp2019/SecureChat/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/trdp2019/SecureChat/discussions)

## 🌟 Show Your Support

If you like this project, please give it a ⭐ on GitHub!

---

**Made with ❤️ by [Tridip](https://googleit.in)**

*SecureChat - Connecting the world, one secure conversation at a time.*
