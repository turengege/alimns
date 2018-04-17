#!/usr/bin/env node
import { QueueAgent, Queue } from '..';
import { account, region, program } from './base'

(async function main() {
    const queueAgent = new QueueAgent(account, region);
    const queue = queueAgent.queue(program.queue);
    const resp = await queue.startReceiving(1,{autoDelete:true, waitseconds:10});
    queue.on(Queue.EVENTS.MESSAGE, msgs =>msgs.forEach(m=>console.log(m.MessageBody)));
})().catch(console.error)