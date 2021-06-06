import { Context, EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Store extends IdEntity{
    name = new StringColumn();
    
    constructor(private context:Context){
        super({
            name: 'stores',
            allowApiCRUD: c=> c.isSignedIn(),
            allowApiRead: c=> c.isSignedIn()
        });
    }
};
