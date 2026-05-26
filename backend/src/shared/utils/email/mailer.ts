import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"Nexo" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Redefinição de senha - Nexo',
        html: `
            <h2>Redefinição de senha</h2>
            <p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6C5CE7;color:#fff;text-decoration:none;border-radius:8px">
                Redefinir senha
            </a>
            <p>Este link expira em 1 hora.</p>
            <p>Se não foi você, ignore este email.</p>
        `,
    });
}
