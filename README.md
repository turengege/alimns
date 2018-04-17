# alimns  
还在完善中，目前只完成了在工作中用到的功能，后面会持续补充上。具体见usage 和api部分
## Features
- 强类型接口(如果您用ts)

## Usage
### 命令行
```sh
npm i -g alimns-client 
```

### 队列
```sh
npm i alimns-client
```
```typescript
import {QueueAgent, Queue, AliAccount,Topic} from 'alimns-client'
const account = new AliAccount('<accountId>', '<accessKey>','<accessSecret>');
const queue = new Queue(account, '<region>','<queueName>' );

//发送队列消息
await queue.push('a queue message!');
await queue.sendMessage({MessageBody:'a queue message!', Priority:16, DelaySeconds:15});
await queue.batchSendMessage([{MessageBody:'a queue message!'}]);

//接收消息
const msgs = await queue.receiveMessage();
const msgs = await queue.batchReceiveMessage(2);

//区别与receiveMessage，该方法会持续轮训直到收到msg
const msgs = await queue.pop();

//删除消息
await msgs[i].delete();
//or
await queue.deleteMsg(msgs[i]);
//批量删除消息
await queue.deleteBatchByReceiptHandles(msgs.map(m=>m.ReceiptHandle));

//自动删除
//queue在初始化时 和 发送消息的各个接口, 都可以设置autoDelete =true，来自动删除消息,具体见api

//持续轮训,并将接收到的信息发射到queue 的 'message'事件上
queue.startReceiving(10,1,true);
queue.on(Queue.EVENTS.MESSAGE, msgs =>msgs.forEach(m=>console.log(m.MessageBody)));
```

### 主题
```typescript
const topic = new Topic(account, '<region>','<topicName>' );
await topic.publish('a topic message!');
```

## Api