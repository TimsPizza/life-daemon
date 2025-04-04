export const suspensionEmailTemplates = {
  en: {
    subject: "Subscription Suspended - Life Daemon",
    html: (days: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Your Life Daemon subscription has been suspended</h1>
        <p>As requested, we've temporarily paused your daily life notifications.</p>
        <p>Your subscription will automatically resume in <strong>${days} days</strong>.</p>
        <div style="margin-top: 20px; color: #666;">
          <p>We'll be here when you're ready to continue your journey.</p>
          <p>Remember, every day is unique, even those spent in silence.</p>
        </div>
      </div>
    `,
  },
  fr: {
    subject: "Abonnement suspendu - Life Daemon",
    html: (days: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Votre abonnement Life Daemon a été suspendu</h1>
        <p>Comme demandé, nous avons temporairement suspendu vos notifications quotidiennes.</p>
        <p>Votre abonnement reprendra automatiquement dans <strong>${days} jours</strong>.</p>
        <div style="margin-top: 20px; color: #666;">
          <p>Nous serons là quand vous serez prêt à continuer votre voyage.</p>
          <p>N'oubliez pas, chaque jour est unique, même ceux passés dans le silence.</p>
        </div>
      </div>
    `,
  },
  cn: {
    subject: "订阅已暂停 - Life Daemon",
    html: (days: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">您的Life Daemon订阅已暂停</h1>
        <p>根据您的要求，我们已暂时停止发送每日生活通知。</p>
        <p>您的订阅将在<strong>${days}天</strong>后自动恢复。</p>
        <div style="margin-top: 20px; color: #666;">
          <p>当您准备好继续旅程时，我们会在这里等您。</p>
          <p>请记住，每一天都是独特的，即使是在沉默中度过的日子。</p>
        </div>
      </div>
    `,
  },
  jp: {
    subject: "サブスクリプション一時停止 - Life Daemon",
    html: (days: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Life Daemonのサブスクリプションが一時停止されました</h1>
        <p>ご要望に応じて、日々の通知を一時的に停止させていただきました。</p>
        <p>サブスクリプションは<strong>${days}日後</strong>に自動的に再開されます。</p>
        <div style="margin-top: 20px; color: #666;">
          <p>旅を続ける準備が整いましたら、私たちがお待ちしております。</p>
          <p>静寂の中で過ごす日々も、それぞれが唯一無二の価値があることを忘れずに。</p>
        </div>
      </div>
    `,
  },
};
