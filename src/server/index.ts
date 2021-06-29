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
import { Order } from '../app/core/order/order';

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
    app.get("/api-req/:key", async (req, res) => { //can be app.get(....)
        // let apiKey2 = req.query.apiKey;//.body.key;
        // console.log(apiKey2)
        let apiKey = req.params.key;

        if (apiKey === process.env.apiKey) {
            let context = await expressBridge.getValidContext(req);
            let result = ""; 
            let r = await Order.getOrders(context);
            for (const o of r) {
                // for (const key in o) {
                //     if (Object.prototype.hasOwnProperty.call(o, key)) {
                //         const element = o[key];
                //         result+=element.toString()+"|";
                //     }
                // }


                result += `${o.date.toLocaleDateString("he-il")}|${o.status} \n`;
            }

            // for await (const o of context.for(Order).iterate()) {
            //     result += o.date.value.toLocaleDateString("he-il") + "|" + o.time.value + "|" + o.status.value.id + "\n";
            // }
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