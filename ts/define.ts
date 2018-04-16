export interface IQueueAttributes {
    /*
    消息延迟时间，单位为秒；
    取值范围：0 ~ 604800秒(7天)；
    当该属性大于0时，发送到队列的所有消息是延迟消息，经过该属性指定的秒数后变为可消费消息；
    如果发送消息请求指定了DelaySeconds，以请求指定的DelaySeconds为准；
    */
    DelaySeconds: number

    /*
    消息体最大长度，单位为Byte；
    取值范围：1024 ~ 65536Byte(64KB)；
    该属性用于限制发送到队列的消息体最大长度，超过该长度发送消息失败
    */
    MaximumMessageSize: number


    /*
    消息最长保留时间，单位为秒；
    取值范围：60 ~ 1296000秒(15天)；
    发送到队列的消息最长保留该时长，超过指定时间，无论消息是否被消费都将被删除；
    */
    MessageRetentionPeriod: number

    /*
    消息被receive后的隐藏时长，单位为秒；
    取值范围：1 ~ 43200秒(12小时)；
    消息被receive后，在该属性指定的这段时间内消息处于隐藏状态，在这段时间内，可以删除消息或者修改消息隐藏时长；超过这段时间，消息可以再次被receive；
    */
    VisibilityTimeout: number

    /*
    (batch)receive message请求最长等待时间，单位为秒；
    取值范围：0 ~ 30秒；
    当队列中没有消息时，(batch)receive message请求将挂在 MNS 服务器端；在该属性指定的时间范围内，如果有消息发送到队列中，立即返回消息给用户；如果超过该时间，仍然没有消息，返回MessageNotExist；
    如果(batch)receive message请求指定了wait seconds，以请求指定的时间为准；
    */
    PollingWaitSeconds: number

    /*
    是否开启日志管理功能；
    取值范围：True/False；
    当该属性为True时，MNS 将收集队列的消息操作日志推送到指定的地方，日志管理请参考详情；
    */
    LoggingEnabled: 'True' | 'False'

    CreateTime: number
    LastModifyTime: number

    //队列中处于 Active 状态的消息总数，为近似值；
    ActiveMessages: number

    //队列中处于 Inactive 状态的消息总数，为近似值；
    InactiveMessages: number

    //队列中处于 Delayed 状态的消息总数，为近似值；
    DelayMessages: number
}

/**
 * 发送用的队列消息对象
 */
export interface IQueueMessageSend{
    DelaySeconds?:number
    MessageBody?:any
    Priority?:number
}

/**
 * 接收用的队列消息对象
 */
export interface IQueueMessageResponse{
    /**
    消息编号；
    (batch) send/receive/peek message 操作返回该属性；
    一个队列中每个消息都有唯一的 MessageId；
    消息发送到队列中，MNS 会生成一个 MessageId，该编号一旦生成就不会变化，可以用来做数据校对；
     */
    MessageId?:string


    /**
    消息下次可被消费的时间，从1970年1月1日 00:00:00 000 开始的毫秒数；
    (batch) receive message 和 change message visibility 操作返回该属性； 
     */
    NextVisibleTime?:number

    /**
    消息临时句柄；
    (batch) receive message 和 change message visibility 操作返回该属性；
    该句柄用于删除和修改处于Inactive状态的消息，NextVisibleTime之前有效，超过该时间使用句柄 MNS 会提示MessageNotExist；
    消息临时句柄只能使用一次，如果该句柄标识的消息状态发生改变，该句柄就会失效；  
     */
    ReceiptHandle?:string

    /**
    消息正文；
    (batch) receive/peek message 操作返回该属性；
     */
    MessageBody?:any

    /**
    消息正文的MD5值；
    (batch) send/receive/peek message 操作返回该属性；
     */
    MessageBodyMD5?:string

    /**
    消息发送到队列的时间，从 1970年1月1日 00:00:00 000 开始的毫秒数；
    (batch) receive/peek message 操作返回该属性；
     */
    EnqueueTime?:number

    /**
    消息第一次被消费的时间，从1970年1月1日 00:00:00 000 开始的毫秒数；
    (batch) receive/peek message 操作返回该属性；
    如果消息从未被消费过，该属性与EnqueueTime相同；
     */
    FirstDequeueTime?:number

    /**
    消息总共被消费的次数(即被receive的次数)；
    (batch) receive/peek message 操作返回该属性；
     */
    DequeueCount?:number

    /**
    消息的优先级权值，取值范围：1~16，其中1为最高优先级；
    (batch) receive/peek message 操作返回该属性；
    如果队列中有不同优先级的消息，优先级越高的消息越容易更早被消费（既被ReceiveMessage操作取出）；
    MNS会尽量让高优先级的消息先出队列，正是因为分布式消息队列的一些特性不能百分之百保证高优先级的消息先被消费；
     */
    Priority?:number
}

export interface ITopicAttribute{

    /**
    消息体的最大长度，单位为Byte；
    取值范围：1024 ~ 65536Byte(64KB)；
    该属性用于限制发送到队列的消息体最大长度，超过该长度发布消息将失败；
     */
    MaximumMessageSize:number

    /**
    是否开启日志管理功能；
    取值范围：True/False；
    当该属性为True时，MNS 将收集主题的消息操作日志推送到指定的地方，日志管理请参考详情；
     */
    LoggingEnabled:'True'|'False'

    //主题的创建时间，从 1970-1-1 00:00:00到现在的秒值；
    CreateTime:number

    //修改主题属性信息的最近时间，从 1970-1-1 00:00:00 到现在的秒值；
    LastModifyTime:number

    /**
    消息在主题中的最长保留时间，单位为秒；
    从发送到该主题开始经过此参数指定的时间后，不论消息是否被成功推送给用户都将被删除； 
     */
    MessageRetentionPeriod:number

    /**
    该主题中消息数目；
    包含已经被推送给用户的消息，不包含过期被回收的消息；
     */
    MessageCount:number
}
export interface ITopicMessageResponse {
    /**
    消息的编号；
    一个主题中每个消息都有唯一的 MessageId；
     */
    MessageId: string

    //Message
    Message: any

    //消息正文的MD5值
    MessageMD5: string

    /**
    消息的标签；
    当发布消息时指定了消息标签，MNS 将只推送消息给接收这类标签消息的订阅；
     */
    MessageTag: string

    //消息的发布时间，从 1970-1-1 00:00:00 000 到消息发布时的毫秒值；
    PublishTime: number
}

export interface ITopicMessageSend{
    MessageBody:any
    //消息标签（用于消息过滤）	,不超过16个字符的字符串（默认没有标签）	
    MessageTag?:string
    //消息属性，如果需要推送邮件或短信，则MessageAttributes为必填项
    MessageAttributes?:ITopicPublishMessageAttributes
}

export interface IDirectMail{
    //发信账号
    AccountName
    //邮箱主题
    Subject:string
    AddressType:0|1
    IsHtml:0|1
    ReplyToAddress:0|1
}
export interface IDirectSMS{
    FreeSignName
    TemplateCode
    Type
    Receiver
    SmsParams
}

export interface ITopicPublishMessageAttributes{
    DirectMail?:IDirectMail
    DirectSMS?:IDirectSMS
}

/**
 * 公共请求头
 */
export interface IBaseMNSRequestHeader {
    Authorization?: string
    Host?: string
    Date?: string | Date
    'Content-Length'?: number
    'Content-Type'?: string
    'Content-MD5'?: string
    'x-mns-version'?: string
}

/**
 * 公共响应头 
 */
export interface IBaseMNSResponseHeader {
    'x-mns-request-id': string
    'x-mns-version': string
}

/**
 * 统一错误响应体
 */
export interface IErrorBody{
    Code: string
    Message: string
    RequestId: string
    HostId: string
}

export interface IRequest{
     (path: string, opt?: IRequestArg): Promise<IResponse>
} 
export interface IResponse{
    code: number
    body: IMnsResponseBody 
    headers: object
}

export interface IRequestArg {
    body?: any
    headers?: IBaseMNSRequestHeader
    queries?: object
    timeout?: number
}

export interface IMnsResponseBody{
    Error?:IErrorBody
    Queue?:IQueueAttributes
    Topic?:ITopicAttribute
    Message?:IQueueMessageResponse|IQueueMessageResponse[]
    Messages?:{Message?:IQueueMessageResponse|IQueueMessageResponse[]}
}