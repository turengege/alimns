# alimns  

## Usage

```typescript
import {QueueAgent, Queue, AliAccount} from 'alimns'
const account = new AliAccount('<accountId>', '<accessKey>','<accessSecret>');
const queueAgent = new QueueAgent(account, '<region>');
//发送队列消息
queueAgent.queue('<topicName>').push('a message!');

```