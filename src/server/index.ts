//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import { DataProvider, SqlDatabase } from '@remult/core';
import { initExpress } from '@remult/core/server';
import { PostgresDataProvider, verifyStructureOfAllEntities } from '@remult/server-postgres';
import * as compression from 'compression';
import { config } from 'dotenv';
import * as express from 'express';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';
import * as fs from 'fs';
import { Pool } from 'pg';
import '../app/app.module';
import { Container } from '../app/core/container/container';
import { ContainerItem } from '../app/core/container/containerItem';
import { Order, OrderStatus } from '../app/core/order/order';
import { MagicGetOrders, STARTING_ORDER_NUM } from '../app/shared/types';

async function startup() {
    config(); //loads the configuration from the .env file
    let dataProvider: DataProvider;

    // use json db for dev, and postgres for production
    if (true) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
        });
        let database = new SqlDatabase(new PostgresDataProvider(pool));
        await verifyStructureOfAllEntities(database);
        dataProvider = database;
        // findorcreate orderNum serial restart at 1000.
        await database.execute("alter table orders add column if not exists ordernum serial");
        let result = await database.execute("SELECT last_value FROM orders_ordernum_seq");
        if (result && result.rows && result.rows.length > 0) {
            let count = parseInt(result.rows[0].last_value);
            if (count < STARTING_ORDER_NUM) {
                await database.execute(`SELECT setval('orders_ordernum_seq'::regclass, ${STARTING_ORDER_NUM}, false)`);
            }
        }
        //https://wiki.postgresql.org/wiki/Fixing_Sequences
    }

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(compression());
    if (!process.env.DEV_MODE)
        app.use(forceHttps);
    let expressBridge = initExpress(app, {
        dataProvider
    });
    //http://localhost:4200/api-req/apikey
    //app.get("/api-req", async (req, res) => { //can be app.get(....)
    app.get("/api-req/ping", async (req, res) => {
        res.send(`Hi from cafex server clock: ${new Date().toLocaleString()}`)
    });
    app.post("/api-req/:key/containers", async (req, res) => {
        let apiKey = req.params.key;
        if (apiKey === process.env.APIKEY) {
            let context = await expressBridge.getValidContext(req);
            let con: Container = context.for(Container).create();
            con.name.value = req.query.name as string;
            con.sid.value = req.query.storeid as string;
            con.aid.value = req.query.agentid as string;
            await con.save();
            res.send(con.id);
        }
        else {
            res.send("NOT ALLOWED");
        }
    });
    app.post("/api-req/:key/containersItems", async (req, res) => {
        let apiKey = req.params.key;
        if (apiKey === process.env.APIKEY) {
            let context = await expressBridge.getValidContext(req);
            let conItem: ContainerItem = context.for(ContainerItem).create();
            conItem.conid.value = req.query.conid as string;
            conItem.pid.value = req.query.pid as string;
            conItem.quntity.value = parseInt(req.query.quntity as string);
            await conItem.save();
            res.send(conItem.id);
        }
        else {
            res.send("NOT ALLOWED");
        }
    });
    app.get("/api-req/:key/orders", async (req, res) => {
        let apiKey = req.params.key;
        if (apiKey === process.env.APIKEY) {
            let magic: MagicGetOrders = {
                id: req.query.id ? req.query.id as string : undefined,
                magicId: req.query.magicid ? req.query.magicid as string : undefined,
                orderNum: req.query.ordernum ? parseInt(req.query.ordernum as string) : undefined,
                fdate: req.query.fdate ? new Date(req.query.fdate as string) : undefined,
                tdate: req.query.tdate ? new Date(req.query.tdate as string) : undefined,
                status: req.query.status ? (OrderStatus)[req.query.status as string] : undefined
            }

            console.log('orders', magic);

            let context = await expressBridge.getValidContext(req);
            let result = "";
            let r = await Order.getOrders(magic, context);
            for (const o of r) {
                result += `${o.date.toLocaleDateString("he-il")}|${o.status} \n`;
            }
            res.send(result);
        }
        else {
            res.send("NOT ALLOWED");
        }
    });
    app.get("/api-req/:key/containers", async (req, res) => {
        let apiKey = req.params.key;
        if (apiKey === process.env.APIKEY) {
            let magic: MagicGetOrders = {
                id: req.query.id ? req.query.id as string : undefined,
                magicId: req.query.magicid ? req.query.magicid as string : undefined,
                orderNum: req.query.ordernum ? parseInt(req.query.ordernum as string) : undefined,
                fdate: req.query.fdate ? new Date(req.query.fdate as string) : undefined,
                tdate: req.query.tdate ? new Date(req.query.tdate as string) : undefined,
                status: req.query.status ? (OrderStatus)[req.query.status as string] : undefined
            }

            console.log('orders', magic);

            let context = await expressBridge.getValidContext(req);
            let result = "";
            let r = await Order.getOrders(magic, context);
            for (const o of r) {
                result += `${o.date.toLocaleDateString("he-il")}|${o.status} \n`;
            }
            res.send(result);
        }
        else {
            res.send("NOT ALLOWED");
        }
    });
    app.use(express.static('dist/cafex-app'));
    app.use('/*', async (req, res) => {
        try {
            res.send(fs.readFileSync('dist/cafex-app/index.html').toString());
        } catch (err) {
            res.sendStatus(500);
        }
    });
    let port = process.env.PORT || 3000;
    app.listen(port);
}
startup();

// Create	POST
// Read	GET
// Update	PUT
// Delete	DELETE



// for (const key in o) {
//     if (Object.prototype.hasOwnProperty.call(o, key)) {
//         const element = o[key];
//         result+=element.toString()+"|";
//     }
// }


// for await (const o of context.for(Order).iterate()) {
//     result += o.date.value.toLocaleDateString("he-il") + "|" + o.time.value + "|" + o.status.value.id + "\n";
// }
