export interface IUpdateUserPayload {
    name?: string;
    profileSettings?: IProfileSettings;
}

export interface ITrimmedUser{
    name?:string;
    email?:string;
    lastNameUpdate?:Date;
    createdAt?:Date;
    profileSettings?: IProfileSettings;
}

export interface IProfileSettings{
    icon?:IProfileIcon;
}

export interface IProfileIcon{
    id?:string;
    color?:string;
}