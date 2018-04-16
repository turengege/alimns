
export class MnsException extends Error{
    code:string
    requestId:string
    hostId:string
    constructor(msg,code,requestId,hostId){
        super(msg)
        this.code = code;
        this.requestId = requestId;
        this.hostId = hostId;
    }
}