import { checkForDuplicateValue, Context, DateTimeColumn, EntityClass, IdEntity, NumberColumn, ServerFunction, StringColumn } from "@remult/core";
import { FILTER_IGNORE, MagicGetContainersItems, MagicGetContainersItemsResponse } from "../../shared/types";
import { Roles } from "../../users/roles";
import { UserId } from "../../users/users";
import { ProductIdColumn } from "../product/product";

@EntityClass
export class ContainerItem extends IdEntity {

    conid = new StringColumn({ caption: 'מחסן' });
    pid = new ProductIdColumn(this.context, { caption: "פריט" });
    quantity = new NumberColumn({ caption: "כמות" });
    created = new DateTimeColumn({caption: 'נוצר'})
    createdBy = new UserId(this.context, Roles.admin, { caption: 'נוצר ע"י' });
 
    constructor(private context: Context) {
        super({
            name: 'containersItems',
            allowApiCRUD: true,
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if (context.onServer) {
                    await checkForDuplicateValue(this, this.pid, this.context.for(ContainerItem));
                    if(this.isNew()){
                        this.created.value = new Date();
                        this.createdBy.value = context.user.id;
                    }
                }
            }
        });
    }

    @ServerFunction({ allowed: true })
    static async getContainersItems(req: MagicGetContainersItems, context?: Context) {
        let r: MagicGetContainersItemsResponse[] = [];
        for await (const c of context.for(ContainerItem).iterate({
            where: row => {
                let result = FILTER_IGNORE;
                if (req.id) {
                    result = result.and(row.id.isEqualTo(req.id));
                }
                else {
                    if (req.containerid) {
                        result = result.and(row.conid.isEqualTo(req.containerid));
                    }
                    if (req.productid) {
                        result = result.and(row.pid.isEqualTo(req.productid));
                    }
                }
                return result;
            }
        })) {
            r.push({
                id: c.id.value,
                containerId: c.conid.value,
                productid: c.pid.value,
                quantity: c.quantity.value
            });
        }
        return r;
    }
}
