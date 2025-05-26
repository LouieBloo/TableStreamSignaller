import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { ISendEmailPayload } from './interfaces/IEmails';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILER_SEND_TOKEN,
});

export const sendEmail = async (payload: ISendEmailPayload) => {
  const sentFrom = new Sender("support@table-stream.com", "Table Stream");

  const recipients = [
    new Recipient(payload.email, payload.name)
  ];

  const personalization = [
    {
      email: payload.email,
      data: payload.data
    }
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(payload.subject)
    .setTemplateId(payload.templateId)
    .setPersonalization(personalization);

  await mailerSend.email.send(emailParams);
}
