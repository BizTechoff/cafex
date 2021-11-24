import { checkForDuplicateValue, Context, DateTimeColumn, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { FILTER_IGNORE } from "../../shared/types";
import { Roles } from "../../users/roles";
import { UserId } from "../../users/users";
import { ProductIdColumn } from "../product/product";
import { ContainerIdColumn } from "./container";
 
@EntityClass
export class ContainerItem extends IdEntity {
 
    conid = new ContainerIdColumn(this.context, { caption: 'מחסן' });
    pid = new ProductIdColumn(this.context, { caption: "פריט" });
    quantity = new NumberColumn({ caption: "כמות" });
    created = new DateTimeColumn({ caption: 'נוצר' })
    createdBy = new UserId(this.context, Roles.admin, { caption: 'נוצר ע"י' });

    constructor(private context: Context) {
        super({
            name: 'containersItems',
            allowApiCRUD: true,
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if (context.onServer) {
                    await checkForDuplicateValue(this, this.pid, this.context.for(ContainerItem));
                    if (this.isNew()) {
                        this.created.value = new Date();
                        this.createdBy.value = context.user.id;
                    }
                }
            }
        });
    }

    static async get(req: { id?: string, containerId?: string, productId?: string }, context?: Context) {
        let result = '';
        for await (const c of context.for(ContainerItem).iterate({
            where: row => {
                let result = FILTER_IGNORE;
                if (req.id) {
                    result = result.and(row.id.isEqualTo(req.id));
                }
                else {
                    if (req.containerId) {
                        result = result.and(row.conid.isEqualTo(req.containerId));
                    }
                    if (req.productId) {
                        result = result.and(row.pid.isEqualTo(req.productId));
                    }
                }
                return result;
            }
        })) {
            result += `${c.id.value}|${c.conid.value}|${c.pid.value}|${c.quantity.value} \n`;
        }
        return result;
    }

    static async post(req: { id?: string, containerid?: string, productid?: string, quantity?: number }, context?: Context) {
        let result = '';
        let item : ContainerItem = undefined;
        if (req.id) {
            item = await context.for(ContainerItem).findId(req.id);
            if (!item) {
                return 'Id Not Found';
            }
        }
        else{
            item = context.for(ContainerItem).create();
        }
        item.conid.value = req.containerid;
        item.pid.value = req.productid;
        item.quantity.value = req.quantity;
        await item.save();
        result = item.id.value;
        return result;
    }
}
