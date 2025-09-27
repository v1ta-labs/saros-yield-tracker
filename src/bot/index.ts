import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { YieldAlert, TelegramUser, SUPPORTED_TOKENS, PROTOCOLS } from '../types';
import { YieldFetcher } from '../lib/yield-fetcher';

dotenv.config();

interface BotContext extends Context {
  session?: {
    user?: TelegramUser;
    currentAlert?: Partial<YieldAlert>;
  };
}

class SarosYieldBot {
  private bot: Telegraf<BotContext>;
  private yieldFetcher: YieldFetcher;
  private users: Map<number, TelegramUser> = new Map();
  private alerts: Map<string, YieldAlert> = new Map();

  constructor() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN);
    this.yieldFetcher = new YieldFetcher();
    this.setupCommands();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    this.bot.use((ctx, next) => {
      if (ctx.from) {
        const userId = ctx.from.id;
        if (!this.users.has(userId)) {
          this.users.set(userId, {
            id: userId,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
            alerts: []
          });
        }
        ctx.session = { user: this.users.get(userId) };
      }
      return next();
    });
  }

  private setupCommands() {
    this.bot.start((ctx) => {
      const welcomeMessage = `
🚀 *Welcome to Saros Yield Tracker!*

I help you find the best yields on Solana and notify you when Saros beats the competition!

*Available Commands:*
/yields - View current yield comparison
/opportunities - Best Saros opportunities right now
/alert - Set up yield alerts
/myalerts - Manage your alerts
/help - Show this help message

*Supported Tokens:* SOL, USDC, USDT, JitoSOL, mSOL

Get started by checking current yields with /yields
      `;
      ctx.replyWithMarkdown(welcomeMessage);
    });

    this.bot.command('yields', async (ctx) => {
      try {
        const yields = await this.yieldFetcher.getAllYields();
        const message = this.formatYieldsMessage(yields);
        ctx.replyWithMarkdown(message);
      } catch (error) {
        ctx.reply('Sorry, there was an error fetching yield data. Please try again later.');
      }
    });

    this.bot.command('opportunities', async (ctx) => {
      try {
        const opportunities = await this.yieldFetcher.getBestOpportunities();
        const message = this.formatOpportunitiesMessage(opportunities);
        ctx.replyWithMarkdown(message);
      } catch (error) {
        ctx.reply('Sorry, there was an error fetching opportunities. Please try again later.');
      }
    });

    this.bot.command('alert', (ctx) => {
      const keyboard = {
        inline_keyboard: SUPPORTED_TOKENS.map(token => [{
          text: token,
          callback_data: `alert_token_${token}`
        }])
      };
      
      ctx.reply('Which token would you like to set an alert for?', {
        reply_markup: keyboard
      });
    });

    this.bot.command('myalerts', (ctx) => {
      const user = ctx.session?.user;
      if (!user || user.alerts.length === 0) {
        ctx.reply('You have no active alerts. Use /alert to create one!');
        return;
      }

      const message = this.formatUserAlertsMessage(user.alerts);
      ctx.replyWithMarkdown(message);
    });

    this.bot.command('help', (ctx) => {
      const helpMessage = `
🤖 *Saros Yield Tracker Bot Help*

*Commands:*
/yields - Compare current yields across protocols
/opportunities - See where Saros beats competition
/alert - Set up yield notifications
/myalerts - View and manage your alerts
/help - Show this help

*About Alerts:*
• Get notified when yields reach your target
• Get notified when Saros beats competitors
• Alerts check every 15 minutes

*Supported Protocols:*
${Object.values(PROTOCOLS).map(p => `• ${p.name}`).join('\n')}

*Need help?* Contact @saros_support
      `;
      ctx.replyWithMarkdown(helpMessage);
    });

    this.bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery?.data;
      if (!data) return;

      if (data.startsWith('alert_token_')) {
        const token = data.replace('alert_token_', '');
        ctx.session!.currentAlert = { token };
        
        ctx.editMessageText(
          `Setting alert for *${token}*\n\nWhat minimum APY would you like to be notified about?\n\nExample: Send "8.5" for 8.5% APY`,
          { parse_mode: 'Markdown' }
        );
      } else if (data.startsWith('remove_alert_')) {
        const alertId = data.replace('remove_alert_', '');
        this.removeAlert(ctx.from!.id, alertId);
        ctx.editMessageText('✅ Alert removed successfully!');
      }

      ctx.answerCbQuery();
    });

    this.bot.on('text', (ctx) => {
      const currentAlert = ctx.session?.currentAlert;
      if (currentAlert && currentAlert.token && !currentAlert.minAPY) {
        const apy = parseFloat(ctx.message.text);
        if (isNaN(apy) || apy <= 0 || apy > 100) {
          ctx.reply('Please enter a valid APY between 0 and 100.');
          return;
        }

        this.createAlert(ctx.from!.id, currentAlert.token, apy);
        ctx.replyWithMarkdown(
          `✅ *Alert Created!*\n\nToken: ${currentAlert.token}\nMinimum APY: ${apy}%\n\nYou'll be notified when any protocol offers ${apy}% or higher for ${currentAlert.token}.`
        );
        
        ctx.session!.currentAlert = undefined;
      }
    });

    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('Sorry, something went wrong. Please try again.');
    });
  }

  private formatYieldsMessage(yields: any[]): string {
    const grouped = yields.reduce((acc, yieldData) => {
      if (!acc[yieldData.token]) acc[yieldData.token] = [];
      acc[yieldData.token].push(yieldData);
      return acc;
    }, {} as Record<string, any[]>);

    let message = '💰 *Current Yields Comparison*\n\n';
    
    for (const [token, tokenYields] of Object.entries(grouped)) {
      message += `*${token}:*\n`;
      
      const sorted = tokenYields.sort((a, b) => b.apy - a.apy);
      const sarosYield = sorted.find(y => y.protocol === 'Saros');
      const bestYield = sorted[0];
      
      sorted.forEach((yieldData, index) => {
        const emoji = yieldData.protocol === 'Saros' ? '🟢' : 
                     yieldData === bestYield ? '🥇' : 
                     index === 1 ? '🥈' : '🥉';
        
        message += `${emoji} ${yieldData.protocol}: ${yieldData.apy.toFixed(2)}%\n`;
      });

      if (sarosYield && bestYield && sarosYield.protocol !== bestYield.protocol) {
        const diff = sarosYield.apy - bestYield.apy;
        if (diff > 0) {
          message += `📈 *Saros leads by ${diff.toFixed(2)}%!*\n`;
        } else {
          message += `📉 Saros trails by ${Math.abs(diff).toFixed(2)}%\n`;
        }
      }
      
      message += '\n';
    }

    message += `_Last updated: ${new Date().toLocaleTimeString()}_`;
    return message;
  }

  private formatOpportunitiesMessage(opportunities: any[]): string {
    let message = '🎯 *Best Saros Opportunities*\n\n';
    
    const sarosOpportunities = opportunities.filter(op => op.sarosAPY > op.bestAPY);
    
    if (sarosOpportunities.length === 0) {
      message += '🔍 No current opportunities where Saros beats competition.\n\n';
      message += '*Top Saros Yields:*\n';
      opportunities.slice(0, 3).forEach(op => {
        message += `• ${op.token}: ${op.sarosAPY.toFixed(2)}% (vs ${op.bestProtocol}: ${op.bestAPY.toFixed(2)}%)\n`;
      });
    } else {
      sarosOpportunities.forEach(op => {
        const advantage = op.sarosAPY - op.bestAPY;
        message += `🚀 *${op.token}*\n`;
        message += `Saros: ${op.sarosAPY.toFixed(2)}%\n`;
        message += `${op.bestProtocol}: ${op.bestAPY.toFixed(2)}%\n`;
        message += `💚 *+${advantage.toFixed(2)}% advantage*\n\n`;
      });
    }

    return message;
  }

  private formatUserAlertsMessage(alerts: YieldAlert[]): string {
    let message = '🔔 *Your Active Alerts*\n\n';
    
    alerts.forEach((alert, index) => {
      message += `${index + 1}. ${alert.token} ≥ ${alert.minAPY}%\n`;
      message += `   Created: ${alert.createdAt.toLocaleDateString()}\n`;
      message += `   Status: ${alert.active ? '✅ Active' : '❌ Inactive'}\n\n`;
    });

    return message;
  }

  private createAlert(userId: number, token: string, minAPY: number) {
    const alertId = `${userId}_${token}_${Date.now()}`;
    const alert: YieldAlert = {
      id: alertId,
      userId,
      token,
      minAPY,
      active: true,
      createdAt: new Date()
    };

    this.alerts.set(alertId, alert);
    
    const user = this.users.get(userId);
    if (user) {
      user.alerts.push(alert);
    }
  }

  private removeAlert(userId: number, alertId: string) {
    this.alerts.delete(alertId);
    
    const user = this.users.get(userId);
    if (user) {
      user.alerts = user.alerts.filter(alert => alert.id !== alertId);
    }
  }

  public async checkAlerts() {
    try {
      const yields = await this.yieldFetcher.getAllYields();
      const opportunities = await this.yieldFetcher.getBestOpportunities();

      for (const alert of this.alerts.values()) {
        if (!alert.active) continue;

        const relevantYields = yields.filter(y => y.token === alert.token);
        const maxYield = Math.max(...relevantYields.map(y => y.apy));
        
        if (maxYield >= alert.minAPY) {
          const bestProtocol = relevantYields.find(y => y.apy === maxYield);
          const sarosYield = relevantYields.find(y => y.protocol === 'Saros');
          
          let message = `🚨 *Yield Alert Triggered!*\n\n`;
          message += `${alert.token} has reached ${maxYield.toFixed(2)}% on ${bestProtocol?.protocol}!\n`;
          
          if (sarosYield) {
            if (sarosYield.apy >= alert.minAPY) {
              message += `\n🟢 *Saros*: ${sarosYield.apy.toFixed(2)}%`;
            } else {
              message += `\n🟡 Saros: ${sarosYield.apy.toFixed(2)}%`;
            }
          }

          this.bot.telegram.sendMessage(alert.userId, message, { parse_mode: 'Markdown' });
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  public launch() {
    this.bot.launch();
    console.log('🤖 Saros Yield Bot started!');

    setInterval(() => {
      this.checkAlerts();
    }, 15 * 60 * 1000);

    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  public getBotInstance() {
    return this.bot;
  }
}

export { SarosYieldBot };

if (import.meta.main) {
  const bot = new SarosYieldBot();
  bot.launch();
}