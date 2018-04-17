#!/usr/bin/env node
import { QueueAgent, Queue } from '..';
import { account, region, program } from './base'

(async function main() {
    const queueAgent = new QueueAgent(account, region);
    const queue = queueAgent.queue(program.queue);
    const resp = await queue.pop(1, { autoDelete: true});
    if(resp)
        resp.forEach(i=>console.log(i.MessageBody));
})().catch(console.error);