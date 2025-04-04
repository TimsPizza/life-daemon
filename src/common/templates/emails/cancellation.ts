export const cancellationEmailTemplates = {
  en: {
    subject: "Subscription Cancelled - Life Daemon",
    html: () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Your Life Daemon subscription has been cancelled</h1>
        <p>We're sorry to see you go. Remember all the days you've lived, and know that each new day is a gift.</p>
        <p>You can always resubscribe later if you change your mind.</p>
        <div style="margin-top: 20px; color: #666;">
          <p>Thank you for being part of our journey.</p>
        </div>
      </div>
    `,
  },
  fr: {
    subject: "Abonnement annulé - Life Daemon",
    html: () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Votre abonnement Life Daemon a été annulé</h1>
        <p>Nous regrettons votre départ. Souvenez-vous de tous les jours vécus, et sachez que chaque nouveau jour est un cadeau.</p>
        <p>Vous pouvez toujours vous réabonner ultérieurement si vous changez d'avis.</p>
        <div style="margin-top: 20px; color: #666;">
          <p>Merci d'avoir fait partie de notre voyage.</p>
        </div>
      </div>
    `,
  },
  cn: {
    subject: "订阅已取消 - Life Daemon",
    html: () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">您的Life Daemon订阅已取消</h1>
        <p>我们很遗憾看到您的离开。请记住您已经走过的每一天，每一个新的日子都是一份礼物。</p>
        <p>如果您改变主意，随时欢迎您重新订阅。</p>
        <div style="margin-top: 20px; color: #666;">
          <p>感谢您曾经与我们同行。</p>
        </div>
      </div>
    `,
  },
  jp: {
    subject: "サブスクリプション解約 - Life Daemon",
    html: () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Life Daemonのサブスクリプションが解約されました</h1>
        <p>ご利用ありがとうございました。これまでの日々を振り返り、新しい一日一日が贈り物であることを忘れないでください。</p>
        <p>気が変わられましたら、いつでも再購読いただけます。</p>
        <div style="margin-top: 20px; color: #666;">
          <p>私たちの旅の一部となっていただき、ありがとうございました。</p>
        </div>
      </div>
    `,
  },
};
