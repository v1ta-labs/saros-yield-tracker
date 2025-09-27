# Saros Yield Tracker

A Next.js 15 application that compares yields across Solana DeFi protocols with a focus on highlighting when Saros offers better opportunities than competitors like Jupiter, Raydium, Meteora, and Kamino.

## 🚀 Features

### Web Dashboard
- **Real-time Yield Comparison**: Side-by-side comparison of APYs across major protocols
- **Opportunity Cards**: Highlighted cards showing when Saros beats competition
- **Mobile Responsive**: Optimized for all device sizes
- **Live Data**: Updates every 15 minutes
- **Clean UI**: Built with Tailwind CSS v4 and ShadCN/UI components

### Telegram Bot Integration
- **Real-time Alerts**: Get notified when yields reach your target
- **Custom Notifications**: Set alerts for specific tokens and APY thresholds
- **Saros Advantage Alerts**: Instant notifications when Saros beats competitors
- **Interactive Commands**: Easy-to-use bot commands for yield checking

### Supported Protocols
- 🟢 **Saros** - Primary focus with advantage highlighting
- 🟡 **Jupiter** - Yield farming and aggregation
- 🟣 **Raydium** - AMM and farming pools
- 🔵 **Meteora** - DLMM and vault yields
- 🔴 **Kamino** - Lending and multiply strategies

### Supported Tokens
- SOL, USDC, USDT, JitoSOL, mSOL

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun (fastest JavaScript runtime)
- **Styling**: Tailwind CSS v4 (zero-config)
- **UI Components**: ShadCN/UI with Radix primitives
- **TypeScript**: Full type safety
- **Telegram Bot**: Telegraf.js
- **Deployment**: Vercel-ready

## 📦 Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repo>
   cd saros-yield-tracker
   bun install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Telegram bot token:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
   ```

3. **Run the development server**:
   ```bash
   bun dev
   ```

4. **Run the Telegram bot**:
   ```bash
   bun run bot
   ```

## 🤖 Telegram Bot Setup

1. **Create a new bot**:
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command
   - Choose a name and username for your bot
   - Copy the token to your `.env.local` file

2. **Set webhook** (for production):
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
   ```

3. **Bot Commands**:
   - `/start` - Welcome message and help
   - `/yields` - Current yield comparison
   - `/opportunities` - Best Saros opportunities
   - `/alert` - Set up yield alerts
   - `/myalerts` - Manage your alerts
   - `/help` - Show help message

## 📊 API Endpoints

### Yield Data
- `GET /api/yields` - Get all current yields
- `GET /api/yields?token=SOL` - Get yields for specific token
- `GET /api/yields?protocol=Saros` - Get yields for specific protocol
- `POST /api/yields` - Force refresh yield data

### Opportunities
- `GET /api/opportunities` - Get best opportunities
- `GET /api/opportunities?limit=5` - Limit results
- `GET /api/opportunities?min_advantage=1` - Filter by minimum advantage

### Telegram Integration
- `POST /api/telegram/webhook` - Telegram bot webhook
- `GET /api/telegram/status` - Bot status and info
- `POST /api/telegram/status` - Set webhook URL

## 🚀 Deployment

### Vercel (Recommended)
1. **Deploy the web app**:
   ```bash
   vercel --prod
   ```

2. **Set environment variables**:
   - `TELEGRAM_BOT_TOKEN`
   - `WEBHOOK_URL`

3. **Update webhook URL** after deployment

### Alternative: Self-hosted
1. **Build the application**:
   ```bash
   bun run build
   ```

2. **Start production server**:
   ```bash
   bun start
   ```

## 🔧 Configuration

### Adding New Protocols
1. Update `src/types/index.ts` - Add to `PROTOCOLS` constant
2. Implement fetcher in `src/lib/yield-fetcher.ts`
3. Add API integration for the new protocol

### Customizing UI
- Colors and themes: `src/app/globals.css`
- Component styling: Individual component files
- Tailwind config: Uses Tailwind v4 (no config file needed)

## 📈 Performance Features

### Caching Strategy
- **In-memory caching**: 15-minute cache for API responses
- **API rate limiting**: Prevents excessive API calls
- **Efficient re-fetching**: Smart cache invalidation

### Mobile Optimization
- **Responsive design**: Mobile-first approach
- **Touch-friendly**: Large tap targets and smooth interactions
- **Fast loading**: Optimized bundle size and lazy loading

## 🛡️ Security

- **Environment variables**: Sensitive data properly configured
- **API validation**: Input validation on all endpoints
- **Rate limiting**: Protection against abuse
- **Type safety**: Full TypeScript coverage

## 🤝 Contributing

1. **Fork the repository**
2. **Create your feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Saros Finance**: https://saros.finance
- **Telegram Bot**: [@SarosYieldTrackerBot](https://t.me/SarosYieldTrackerBot)
- **Support**: Create an issue in this repository

---

**Built with ❤️ for the Saros ecosystem**