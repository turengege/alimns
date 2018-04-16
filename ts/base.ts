import { AliAccount } from './account'
import { createHmac } from 'crypto'
import * as querystring from 'querystring'
import * as xml from 'xml'
import * as r from 'request'
import * as xml2js from 'xml2js'
import { IRequest, IRequestArg, IBaseMNSRequestHeader, IMnsResponseBody, IErrorBody } from './define'
import * as Debug from 'debug'
import { MnsException } from './exceptions';
import { EventEmitter } from 'events';

const X_MNS_VERSION = '2015-06-06'
const CONTENT_TYPE = 'text/xml'

export class MnsAgent extends EventEmitter{
    account?: AliAccount
    region?: string
    constructor(account, region) {
        super();
        this.account = account; 
        this.region = region;
    }

    protected getHost() {
        return `http://${this.account.accountId}.mns.${this.region}.aliyuncs.com`;
    }

    protected get http():{get:IRequest,post:IRequest,put:IRequest,delete:IRequest}{
        const self = this;
        return {
            get: self.request.bind(self, 'GET'),
            post: self.request.bind(self, 'POST'),
            put: self.request.bind(self, 'put'),
            delete: self.request.bind(self, 'delete'),
        }
    }

    protected async request(method: string, path, opt?: IRequestArg):Promise<{code:number,body:IMnsResponseBody,headers:object}> {
        const host = this.getHost();
        let { queries = undefined, body = {}, headers = {} } = opt || {};

        //query
        if (queries) {
            path += '?' + querystring.stringify(queries);
        }
        if (!path.startsWith('/') ){
            path = '/' + path;
        }
        const url = host + path;

        //body
        body = bodyStringify(body);

        //header
        headers["x-mns-version"] = headers["x-mns-version"] || X_MNS_VERSION;
        headers["Content-Type"] = headers["Content-Type"] || CONTENT_TYPE;
        if (!headers.Date)
            headers.Date = new Date().toUTCString();
        if (headers.Date instanceof Date)
            headers.Date = headers.Date.toUTCString();
        headers["Content-Length"] = body.length;
        headers.Authorization = mnsRequestSign(headers, method, path, this.account.accessKeyId, this.account.accessKeySecret);

        const reqArgs = { body, headers, method, url };
        if (opt && opt.timeout) 
            reqArgs['timeout'] = opt.timeout;
        
        const resp = await rp(reqArgs);

        if(!resp ){
            return null;
        }

        let respBody = null;
        if(resp.body){
            respBody =  await bodyParser(resp.body)
        }
        if(respBody && respBody.Error){
            let err = respBody.Error as IErrorBody;
            throw new MnsException(err.Message, err.Code, err.RequestId, err.HostId);
        }

        return { code: resp.statusCode, body: respBody, headers: resp.headers};
    }
}

export const debug = Debug('alimns');

function mnsRequestSign(header: IBaseMNSRequestHeader, method, uri, accessKeyId, keySecret) {
    const canonicalizedMNSHeaders = Object.keys(header)
        .filter(key => typeof key === 'string' && key.startsWith('x-mns-'))
        .map(k => k.toLowerCase())
        .sort()
        .map(key => `${key}:${header[key]}`)

    const signTarget = [
        method.toUpperCase(),
        header['Content-MD5'] || '',
        header['Content-Type'],
        header.Date,
        ...canonicalizedMNSHeaders,
        uri
    ].join('\n');

    const sign = createHmac('sha1', keySecret)
        .update(signTarget)
        .digest()
        .toString('base64');
    return `MNS ${accessKeyId}:${sign}`;

}


var builder = new xml2js.Builder();
function bodyStringify(body:object|string){
    if(typeof body === 'object'){
        return builder.buildObject(body);
    }
    return body;
}

const parser = new xml2js.Parser({ explicitArray: false});
async function bodyParser(body:string){
    return new Promise((resolve, reject)=>{
        parser.parseString(body, (err, result) => {
            if(err){
                return reject(err);
            }
            return resolve(result);
        })
    })
}

async function rp(args):Promise<any>{
    return new Promise((resolve,reject)=>{
        return r(args,(err,result)=>{
            if(!result){
                console.log('no result');
            }
            return resolve(result);
        })
    })
}

