export interface IUpdateUserPayload {
    name?: string;
}

export interface ITrimmedUser{
    name?:string;
    email?:string;
    lastNameUpdate?:Date;
    createdAt?:Date;
}