import { checkForDuplicateValue, Context, DateTimeColumn, EntityClass, IdEntity, ServerFunction, StringColumn } from "@remult/core";
import { FILTER_IGNORE, MagicGetContainers, MagicGetContainersResponse } from "../../shared/types";
import { Roles } from "../../users/roles";
import { UserId } from "../../users/users";

@EntityClass
export class Container extends IdEntity {

    name = new StringColumn({ caption: 'שם' });
    sid = new UserId(this.context, Roles.store, { caption: "בית קפה" });
    aid = new UserId(this.context, Roles.agent, { caption: "סוכן" });
    created = new DateTimeColumn({caption: 'נוצר'})
    createdBy = new UserId(this.context, Roles.admin, { caption: 'נוצר ע"י' });

    constructor(private context: Context) {
        super({
            name: 'containers',
            allowApiCRUD: true,
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if (context.onServer) {
                    await checkForDuplicateValue(this, this.name, this.context.for(Container));
                    if(this.isNew()){
                        this.created.value = new Date();
                        this.createdBy.value = context.user.id;
                    }
                }
            }
        });
    }

    @ServerFunction({ allowed: true })
    static async getContainers(req: MagicGetContainers, context?: Context) {
        let r: MagicGetContainersResponse[] = [];
        for await (const c of context.for(Container).iterate({
            where: row => {
                let result = FILTER_IGNORE;
                if (req.id) {
                    result = result.and(row.id.isEqualTo(req.id));
                }
                else {
                    if (req.storeid) {
                        result = result.and(row.sid.isEqualTo(req.storeid));
                    }
                    if (req.agentid) {
                        result = result.and(row.aid.isEqualTo(req.agentid));
                    }
                }
                return result;
            }
        })) {
            r.push({
                id: c.id.value,
                name: c.name.value,
                storeid: c.sid.value,
                agentid: c.aid.value
            });
        }
        return r;
    }
}
