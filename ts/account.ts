export class AliAccount {
    accountId: string
    accessKeyId: string
    accessKeySecret: string
    constructor(accountId: string, accessKeyId: string, accessKeySecret: string) {
        this.accountId = accountId;
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
    }
}