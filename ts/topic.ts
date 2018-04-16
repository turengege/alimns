import { MnsAgent } from './base'
import { AliAccount } from './account';
import * as _ from 'lodash'
import { ITopicMessageSend, ITopicPublishMessageAttributes, IResponse } from './define';
export class TopicAgent extends MnsAgent{
    private _topicCache = {};

    createTopic
    deleteTopic
    listTopic
    getTopicAttributes
    setTopicAttributes

    topic(topicName:string, opt?):Topic{
        if (!this._topicCache[topicName])
            this._topicCache[topicName] = new Topic(this.account, this.region, topicName, opt);
        return this._topicCache[topicName];
    }
}

/**
 * TODO:  Subscribe , Unsubscribe, ListSubscriptionByTopic,  GetSubscriptionAttributes, SetSubscriptionAttributess,HttpEndpoint
 * 
 */
export class Topic extends MnsAgent{
    private topicName:string
    opt ={}
    constructor(account:AliAccount, region:string,topicName:string,opt?) {
        super(account, region);
        this.topicName = topicName;
        this.opt = _.defaultsDeep(opt || {}, this.opt);
    }

    /**
     * 发布消息 
     * @param msg 
     */
    async publishMessage(msg:ITopicMessageSend):Promise<IResponse>{
        if(!msg)
            return;
        if(typeof msg.MessageBody !== 'string' ){
            msg.MessageBody = JSON.stringify(msg.MessageBody);
        }
        return await this.http.post(`/topics/${this.topicName}/messages`,{body:{Message:msg}});
    }

    /**
     * 发布消息 
     * @param msg 
     * @param tag 
     * @param attr 
     */
    async publish(msg: any, tag?: string, attr?: ITopicPublishMessageAttributes):Promise<IResponse> {
        let m :ITopicMessageSend = {
            MessageBody:msg,
        }
        if(tag)
            m.MessageTag = tag;
        if(attr)
            m.MessageAttributes = attr;
        return await this.publishMessage(m);
    }
}