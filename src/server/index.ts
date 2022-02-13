//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import { Context, DataProvider, SqlDatabase } from '@remult/core';
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
import { STARTING_ORDER_NUM } from '../app/shared/types';
import { Users } from '../app/users/users';

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
 
    let apiUser: Users;

    async function register(action: string, path: string, doWork: (req: express.Request, context: Context) => Promise<string>) {
        let f = async (req, res) => {
            let apiKey = req.query.key as string;
            if (apiKey === process.env.APIKEY) {
                let context = await expressBridge.getValidContext(req);
                // context.clearAllCache();
                if (!apiUser) {
                    apiUser = await context.for(Users).findOrCreate({ where: row => row.name.isEqualTo('api') });
                    if (apiUser.isNew()) {
                        apiUser.admin.value = true;
                        await apiUser.save();
                    }  
                }
                // console.log('apiUser.admin.value',apiUser.admin.value);
                
                if (!apiUser.admin.value!) {
                    res.send('User API disabled.');
                }
                else {
                    context.setUser({ id: apiUser.id.value, name: apiUser.name.value, roles: [] });
                    let result = await doWork(req, context);
                    res.send(result);
                }
            }
            else {
                res.send("NOT ALLOWED");
            };
        };

        if (action === 'post') {
            app.post('/api-req/' + path, f);
        }
        else {
            app.get('/api-req/' + path, f);
        }
    }
 
    register('get', "time", async (req, context) => {
        return new Date().toLocaleString('he-IL');
    });

    register('post', "containers", async (req, context) => {
        return await Container.post({
            id: req.query.id as string,
            name: req.query.name as string,
            uid: req.query.userid as string
        }, context);
    });

    register('get', "containers", async (req, context) => {
        return await Container.get({
            id: req.query.id as string,
            uid: req.query.userid as string
        }, context);
    });

    register('post', "containersitems", async (req, context) => {
        return await ContainerItem.post({
            id: req.query.id as string,
            containerid: req.query.containerid as string,
            productid: req.query.productid as string,
            quantity: parseInt(req.query.quantity as string)
        }, context);
    });

    register('get', "containersitems", async (req, context) => {
        return await ContainerItem.get({
            id: req.query.id as string,
            containerId: req.query.containerId as string,
            productId: req.query.productId as string
        }, context);
    });

    // app.use(route);
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


    //http://localhost:4200/api-req/apikey

    // PING
    // app.get("/api-req/ping", async (req, res) => {
    //     res.send(`Hi from cafex server clock: ${new Date().toLocaleString()}`)
    // });

    // // STORES
    // app.get("/api-req/:key/stores", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {

    //         let context = await expressBridge.getValidContext(req);
    //         let result = "";
    //         let r = await Users.getStores(context);
    //         for (const c of r) {
    //             result += `${c.id}|${c.name} \n`;
    //         }
    //         res.send(result);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });
    // // AGENTS
    // app.get("/api-req/:key/agents", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {

    //         let context = await expressBridge.getValidContext(req);
    //         let result = "";
    //         let r = await Users.getAgents(context);
    //         for (const c of r) {
    //             result += `${c.id}|${c.name} \n`;
    //         }
    //         res.send(result);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });
    // // ORDERS
    // app.get("/api-req/:key/orders", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {
    //         let magic: MagicGetOrders = {
    //             id: req.query.id ? req.query.id as string : undefined,
    //             magicId: req.query.magicid ? req.query.magicid as string : undefined,
    //             orderNum: req.query.ordernum ? parseInt(req.query.ordernum as string) : undefined,
    //             fdate: req.query.fdate ? new Date(req.query.fdate as string) : undefined,
    //             tdate: req.query.tdate ? new Date(req.query.tdate as string) : undefined,
    //             status: req.query.status ? (OrderStatus)[req.query.status as string] : undefined
    //         }

    //         console.debug('MagicGetOrders', magic);

    //         let context = await expressBridge.getValidContext(req);
    //         let result = "";
    //         let r = await Order.getOrders(magic, context);
    //         for (const o of r) {
    //             result += `${o.date.toLocaleDateString("he-il")}|${o.status} \n`;
    //         }
    //         res.send(result);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });
    // // PRODUCTS
    // app.get("/api-req/:key/products", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {
    //         let magic: MagicGetProducts = {
    //             id: req.query.id ? req.query.id as string : undefined,
    //             main: req.query.main ? req.query.main as string : undefined,
    //             sub: req.query.sub ? req.query.sub as string : undefined,
    //             sku: req.query.sku ? req.query.sku as string : undefined
    //         }

    //         console.debug('MagicGetProducts', magic);

    //         let context = await expressBridge.getValidContext(req);
    //         let result = "";
    //         let r = await Product.getProducts(magic, context);
    //         for (const o of r) {
    //             result += `${o.id}|${o.name}|${o.main}|${o.sub}|${o.sku} \n`;
    //         }
    //         res.send(result);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });
    // // CATEGORIES
    // app.get("/api-req/:key/categories", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {
    //         let magic: MagicGetCategories = {
    //             id: req.query.id ? req.query.id as string : undefined
    //         }

    //         console.debug('MagicGetCategories', magic);

    //         let context = await expressBridge.getValidContext(req);
    //         let result = "";
    //         let r = await Category.getCategories(magic, context);
    //         for (const o of r) {
    //             result += `${o.id}|${o.name} \n`;
    //         }
    //         res.send(result);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });
    // // CATEGORIES-ITEMS
    // app.get("/api-req/:key/categoriesItems", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {
    //         let magic: MagicGetCategoriesItems = {
    //             id: req.query.id ? req.query.id as string : undefined,
    //             categoryid: req.query.categoryid ? req.query.categoryid as string : undefined
    //         }

    //         console.debug('MagicGetCategoriesItems', magic);

    //         let context = await expressBridge.getValidContext(req);
    //         let result = "";
    //         let r = await CategoryItem.getCategoriesItems(magic, context);
    //         for (const o of r) {
    //             result += `${o.id}|${o.categoryid}|${o.name} \n`;
    //         }
    //         res.send(result);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });

    // async function getRequest(path: string, doWork: (req: express.Request, context: Context) => Promise<string>) {
    //     app.get('/api-req/' + path, async (req, res) => {

    //         let apiKey = req.query.key;
    //         if (apiKey === process.env.APIKEY) {
    //             let context = await expressBridge.getValidContext(req);
    //             // context.setUser({ id: "API", name: "API", roles: [] });
    //             let result = await doWork(req, context);
    //             res.send(result);
    //         }
    //         else {
    //             res.send("NOT ALLOWED");
    //         }
    //     })
    // }



    // CONTAINERS

    // app.post("/api-req/:key/containers", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {

    //         console.debug('containers.post.req.query', req.query);

    //         let context = await expressBridge.getValidContext(req);
    //         context.setUser({ id: "API", name: "API", roles: [] });
    //         let con = context.for(Container).create();
    //         if (req.query.id) {
    //             con = await context.for(Container).findId(req.query.id);
    //             if (!con) {
    //                 if (req.query.create && req.query.create === 'true') {
    //                     con = context.for(Container).create();
    //                 }
    //                 else {
    //                     res.send(`Not found Container with id: ${req.query.id}`);
    //                     return;
    //                 }
    //             }
    //         }
    //         con.name.value = req.query.name ? req.query.name as string : undefined;
    //         con.sid.value = req.query.storeid ? req.query.storeid as string : undefined;
    //         con.aid.value = req.query.agentid ? req.query.agentid as string : undefined;
    //         await con.save();
    //         res.send(con.id.value);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });

    // CONTAINERS-ITEMS
    // app.get("/api-req/:key/containersItems", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {
    //         let magic: MagicGetContainersItems = {
    //             id: req.query.id ? req.query.id as string : undefined,
    //             containerid: req.query.containerid ? req.query.containerid as string : undefined,
    //             productid: req.query.productid ? req.query.productid as string : undefined
    //         }

    //         console.debug('MagicGetContainersItems', magic);

    //         let context = await expressBridge.getValidContext(req);
    //         let result = "";
    //         let r = await ContainerItem.getContainersItems(magic, context);
    //         for (const c of r) {
    //             result += `${c.id}|${c.containerId}|${c.productid}|${c.quantity} \n`;
    //         }
    //         res.send(result);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });
    // app.post("/api-req/:key/containersItems", async (req, res) => {
    //     let apiKey = req.params.key;
    //     if (apiKey === process.env.APIKEY) {

    //         console.debug('containersItems.post.req.query', req.query);

    //         let context = await expressBridge.getValidContext(req);
    //         let conItem = context.for(ContainerItem).create();
    //         if (req.query.id) {
    //             conItem = await context.for(ContainerItem).findId(req.query.id);
    //             if (!conItem) {
    //                 if (req.query.create && req.query.create === 'true') {
    //                     conItem = context.for(ContainerItem).create();
    //                 }
    //                 else {
    //                     res.send(`Not found ContainerItem with id: ${req.query.id}`);
    //                     return;
    //                 }
    //             }
    //         }
    //         conItem.conid.value = req.query.containerid ? req.query.containerid as string : undefined;
    //         conItem.pid.value = req.query.productid ? req.query.productid as string : undefined;
    //         conItem.quantity.value = req.query.quntity ? parseInt(req.query.quntity as string) : undefined;
    //         await conItem.save();
    //         res.send(conItem.id.value);
    //     }
    //     else {
    //         res.send("NOT ALLOWED");
    //     }
    // });
