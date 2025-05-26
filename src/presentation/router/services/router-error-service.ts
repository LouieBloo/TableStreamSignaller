import { IAPIError } from "../interfaces/IAPIError";


export const apiError = (message: string, path:string, type:string = 'field', location:string = 'body'): IAPIError => {
  return {
    msg: message,
    type: type,
    path: path,
    location: location
  }
}