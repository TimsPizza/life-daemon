export const dailyNotificationEmailTemplates = {
  en: {
    subject: "Your Daily Life Daemon Message",
    html: (message: string, survivalDays: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 24px; color: #333;">Day ${survivalDays}</div>
          <div style="width: 50px; height: 2px; background-color: #333; margin: 15px auto;"></div>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin: 20px 0;">
          ${message}
        </div>
        <div style="margin-top: 20px; color: #666; text-align: center; font-size: 12px;">
          <p>Life Daemon - Celebrating each day of your existence</p>
        </div>
      </div>
    `,
  },
  fr: {
    subject: "Votre message quotidien Life Daemon",
    html: (message: string, survivalDays: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 24px; color: #333;">Jour ${survivalDays}</div>
          <div style="width: 50px; height: 2px; background-color: #333; margin: 15px auto;"></div>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin: 20px 0;">
          ${message}
        </div>
        <div style="margin-top: 20px; color: #666; text-align: center; font-size: 12px;">
          <p>Life Daemon - Célébrant chaque jour de votre existence</p>
        </div>
      </div>
    `,
  },
  cn: {
    subject: "您的Life Daemon每日消息",
    html: (message: string, survivalDays: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 24px; color: #333;">第 ${survivalDays} 天</div>
          <div style="width: 50px; height: 2px; background-color: #333; margin: 15px auto;"></div>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin: 20px 0;">
          ${message}
        </div>
        <div style="margin-top: 20px; color: #666; text-align: center; font-size: 12px;">
          <p>Life Daemon - 庆祝生命中的每一天</p>
        </div>
      </div>
    `,
  },
  jp: {
    subject: "Life Daemon デイリーメッセージ",
    html: (message: string, survivalDays: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 24px; color: #333;">${survivalDays}日目</div>
          <div style="width: 50px; height: 2px; background-color: #333; margin: 15px auto;"></div>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin: 20px 0;">
          ${message}
        </div>
        <div style="margin-top: 20px; color: #666; text-align: center; font-size: 12px;">
          <p>Life Daemon - あなたの存在の一日一日を祝福します</p>
        </div>
      </div>
    `,
  },
};
