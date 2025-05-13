export interface ISendEmailPayload {
    email: string;
    name: string;
    subject: string;
    templateId: string;
    data?:any;
}