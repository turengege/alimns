import { AliAccount } from './account'
import { MnsAgent, debug } from './base';
import { IQueueAttributes, IQueueMessageResponse, IErrorBody, IResponse, IQueueMessageSend } from './define';
import * as assert from 'assert'
import * as _ from 'lodash'

/**
 * 对队列进行操作的agent
 * TODO:CreateQueue，DeleteQueue，ListQueue，SetQueueAttributes
 */
export class QueueAgent extends MnsAgent {
    private _queueCache = {};

    /**
     * 根据队列名获取队列属性 
     * @param queueName 
     */
    async getQueueAttributes(queueName): Promise<IQueueAttributes> {
        const url = `${this.getHost()}/queues/${queueName}`;
        const resp = await this.http.get(`/queues/${queueName}`);
        if (resp.code == 200) {
            return resp.body.Queue as IQueueAttributes;
        } else {
            const errBody: IErrorBody = resp.body.Error;
            throw new Error(errBody.Code);
        }
    }

    queue(queueName: string, opt?: IQueueOpt): Queue {
        if (!this._queueCache[queueName])
            this._queueCache[queueName] = new Queue(this.account, this.region, queueName, opt);
        return this._queueCache[queueName];
    }
}

/**
 * 对message进行操作的队列对象
 * TODO: ChangeMessageVisibility PeekMessage BatchPeekMessage
 * 
 */
export class Queue extends MnsAgent {
    static EVENTS = {
        MESSAGE: 'message'
    }
    private queueName: string
    private opt: IQueueOpt = {
        autoDelete: false,
        waitseconds: 4,
        numberOfMessages: 1,
        delaySeconds: 0,
        priority: 8
    }
    private pollingLoopPull = false

    /**
     * 
     * @param account 
     * @param region 
     * @param queueName 
     * @param opt 
     * @constructor
     */
    constructor(account:AliAccount, region: string, queueName: string, opt?: IQueueOpt) {
        super(account, region);
        this.queueName = queueName;
        this.opt = _.defaultsDeep(opt || {}, this.opt);
    }


    /**
     * 发送消息
     * @param msg 
     */
    async sendMessage(msg:IQueueMessageSend){
        if(!msg)
            return;
        if (typeof msg.MessageBody !== 'string') {
            msg.MessageBody = JSON.stringify(msg.MessageBody);
        }
        const body = {Message:msg};
        return await this.http.post(`/queues/${this.queueName}/messages`, { body });
    }

    /**
     * 批量发送消息 
     * @param msgs 
     */
    async batchSendMessage(msgs:IQueueMessageSend[]){
        if (!msgs || msgs.length < 1) {
            return;
        }
        const body = {
            Messages: msgs.map(
                msg => {
                    if (typeof msg.MessageBody !== 'string') {
                        msg.MessageBody = JSON.stringify(msg.MessageBody);
                    }
                    return { Message: msg }
                })
        };
        return await this.http.post(`/queues/${this.queueName}/messages`, { body });
    }

    /**
     * 队列发送消息,与send,batchSend相比在参数上更加友善
     * @param msg 
     * @param priority 
     * @param delaySeconds 
     * @throws MnsException
     */
    async push(msg: object | string | string[] | object[],
        priority = this.opt.priority,
        delaySeconds = this.opt.delaySeconds):Promise<IResponse> {
        let body;
        if (msg instanceof Array) {
            body = { Messages: (<Array<object | string>>msg).map(wrapMsg) };
        } else {
            body = wrapMsg(msg);
        }
        function wrapMsg(m: object | string) {
            let msgContent: IQueueMessageSend = {};
            if (typeof m === 'string') {
                msgContent.MessageBody = m;
            } else {
                msgContent.MessageBody = JSON.stringify(m);
            }
            if (delaySeconds)
                msgContent.DelaySeconds = delaySeconds;
            if (priority)
                msgContent.Priority = priority;
            return { Message: msgContent };
        }
        return await this.http.post(`/queues/${this.queueName}/messages`, { body });
    }

    receiveMessage = this.batchReceiveMessage.bind(this,1);

    /**
     * 批量获取消息 
     * @param numOfMessages 
     * @param waitseconds 
     * @param autoDelete 
     * @throws MnsException
     */
    async batchReceiveMessage(numOfMessages = this.opt.numberOfMessages,
        opt?:IReceiveOpt): Promise<IQueueMessage[]> {
        const waitseconds = opt && opt.waitseconds || this.opt.waitseconds;
        const autoDelete = opt && opt.autoDelete || this.opt.autoDelete;

        const resp = await this.http.get(`/queues/${this.queueName}/messages`,
            { queries: { waitseconds, numOfMessages }, timeout: waitseconds * 1000 + 5000 });
        let rt: IQueueMessage[] = [];
        if (!resp)
            return rt;
        if (!resp.body)
            return rt;
        if (resp.body.Messages && resp.body.Messages.Message) {
            let messages = resp.body.Messages.Message;
            if (!(messages instanceof Array)) {
                messages = [messages]
            }
            for (let m of messages) {
                let queueMsg = m as IQueueMessageResponse;
                rt.push(this._addDeleteMethod(queueMsg));
            }
        }
        if (resp.body.Message) {
            rt.push(this._addDeleteMethod(resp.body.Message as IQueueMessageResponse));
        }

        if (autoDelete || this.opt.autoDelete) {
            let receiptHandles = rt.map(m => m.ReceiptHandle);
            if (receiptHandles && receiptHandles.length > 0)
                await this.deleteBatchByReceiptHandles(receiptHandles);
        }

        return rt;
    }

    /**
     * 开启循环轮训模式获取消息,消息会通过Queue.EVENTS.MESSAGE事件返回
     * @example queue.startReceiving();queue.on(Queue.EVENTS.MESSAGE,console.log);
     * @event 'message' 
     * @param {number} numberOfMessages 
     * @param {number} waitseconds 
     * @param {boolean} autoDelete 
     * @param {()=>boolean} condition 
     */
    async startReceiving(numberOfMessages?: number,
        opt?: IReceiveOpt,
        condition: () => boolean = () => true) {

        this._startPollingLoopPull(condition, false, numberOfMessages, opt);
    }


    /**
     * 该方法会持续轮训直到收到一个非空的消息，才会返回 
     * @param numberOfMessages 
     * @param waitseconds 
     * @param autoDelete 
     */
    async pop(numberOfMessages?, opt?:IReceiveOpt) {
        return await this._startPollingLoopPull(() => true, true, numberOfMessages, opt);
    }

    private async _startPollingLoopPull(condition: () => boolean,
        oneshot: boolean,
        numberOfMessages?,
        opt?: IReceiveOpt) {

        this.pollingLoopPull = true;
        while (this.pollingLoopPull && condition()) {
            try {
                let msg = await this.batchReceiveMessage(numberOfMessages, opt);
                if (msg) {
                    if (oneshot) {
                        return msg;
                    } else {
                        this.emit(Queue.EVENTS.MESSAGE, msg);
                    }
                }
            } catch (e) {
                if (oneshot) {
                    return null;
                }
                debug(e);
            }
        }
    }

    /**
     * 停止拉取消息循环
     * TODO: 立刻停止正在执行的长轮训
     */
    stopPollingLoopPull() {
        this.pollingLoopPull = false;
    }

    /**
     * 根据ReceiptHandles 批量删除消息
     * @param receiptHandles 
     */
    async deleteBatchByReceiptHandles(receiptHandles: string[]) {
        const body = { ReceiptHandles: receiptHandles.map(ReceiptHandle => { return { ReceiptHandle } }) };
        const resp = await this.http.delete(`/queues/${this.queueName}/messages`, { body });
    }

    /**
     * 根据ReceiptHandle 单独删除消息
     * @param receiptHandles 
     */
    async deleteByReceiptHandle(receiptHandle: string) {
        const resp = await this.http.delete(`/queues/${this.queueName}/messages`, { queries: { ReceiptHandle: receiptHandle } });
    }

    /**
     * 单独删除消息
     * @param receiptHandles 
     */
    async deleteMsg(msgContent: IQueueMessageResponse) {
        assert(!!msgContent.ReceiptHandle);
        const receiptHandle = msgContent.ReceiptHandle;
        const resp = await this.deleteByReceiptHandle(receiptHandle);
    }

    private _addDeleteMethod(queueMsg: IQueueMessageResponse): IQueueMessage {
        const self = this;
        (queueMsg as IQueueMessage).delete= async function () {
            await self.deleteMsg(queueMsg);
        }
        return queueMsg as IQueueMessage;
    }
}

/**
 * 在aliyun的队列消息基础上增加commit方法 
 */
export interface IQueueMessage extends IQueueMessageResponse {
    //标记消息被消费
    delete(): Promise<void>;
}

/**
 * 队列配置
 * NOTE: 该接口只是针对Queue对象的配置，阿里云队列属性见IQueueAttributes
 */
export interface IQueueOpt {
    autoDelete?: boolean
    waitseconds?: number
    numberOfMessages?: number
    delaySeconds?: number
    priority?: number
}

/**
 * 接收消息的配置
 */
export interface IReceiveOpt {
    waitseconds?: number
    autoDelete?: boolean
}