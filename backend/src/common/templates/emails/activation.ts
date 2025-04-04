export const activationEmailTemplates = {
  en: {
    subject: "Activate Your Life Daemon Subscription",
    html: (activationLink: string) => `
      <h1>Welcome to Life Daemon!</h1>
      <p>Please click the link below to activate your subscription:</p>
      <a href="${activationLink}">${activationLink}</a>
      <p>This link will expire in 24 hours.</p>
    `,
  },
  fr: {
    subject: "Activez votre abonnement Life Daemon",
    html: (activationLink: string) => `
      <h1>Bienvenue sur Life Daemon !</h1>
      <p>Veuillez cliquer sur le lien ci-dessous pour activer votre abonnement :</p>
      <a href="${activationLink}">${activationLink}</a>
      <p>Ce lien expirera dans 24 heures.</p>
    `,
  },
  cn: {
    subject: "激活您的Life Daemon订阅",
    html: (activationLink: string) => `
      <h1>欢迎使用Life Daemon！</h1>
      <p>请点击以下链接激活您的订阅：</p>
      <a href="${activationLink}">${activationLink}</a>
      <p>此链接将在24小时后过期。</p>
    `,
  },
  jp: {
    subject: "Life Daemon サブスクリプションを有効化",
    html: (activationLink: string) => `
      <h1>Life Daemonへようこそ！</h1>
      <p>以下のリンクをクリックしてサブスクリプションを有効化してください：</p>
      <a href="${activationLink}">${activationLink}</a>
      <p>このリンクは24時間後に期限切れとなります。</p>
    `,
  },
};
