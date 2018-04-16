import * as commander from 'commander'
import {QueueAgent , Queue, AliAccount} from '..'

commander 
    .version('0.1.0')
    .option('-i, --accountid <path>', 'aliyun accountId')
    .option('-k, --accesskey <value>', 'aliyun accessKey')
    .option('-s, --accesssecret <value>', 'aliyun accessSecret')
    .option('-r, --region <value>', 'aliyun region')
    .option('-w, --waitseconds <n>', 'waitseconds')
    .option('-m, --message <value>', 'value')
    .option('-b, --batch <n>', 'batch number')
    .option('-q, --queue <value>', 'queue name')
    .option('-t, --topic <value>', 'topic name')
    .parse(process.argv);

export const program = commander;
export const account = new AliAccount(program.accountid, program.accesskey, program.accesssecret);
export const region = program.region; 
