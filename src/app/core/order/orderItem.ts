import { Context, EntityClass, IdEntity, StringColumn } from "@remult/core";
import { OrderIdColumn } from "./order";

@EntityClass
export class OrderItem extends IdEntity{
    oid = new OrderIdColumn();
    name = new StringColumn();
    
    constructor(private context:Context){
        super({
            name: 'ordersItems',
            allowApiCRUD: c=> c.isSignedIn(),
            allowApiRead: c=> c.isSignedIn()
        });
    }
};
  
export class OrderItemIdColumn extends StringColumn{
    
}

export class OrderItemStatus{
    open = new OrderItemStatus();
    proccessing = new OrderItemStatus();
    closed = new OrderItemStatus();
    constructor(){}
}